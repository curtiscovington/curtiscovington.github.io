"""Conservative story evidence and diagnostic encounters from existing run logs."""
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path


def normalized(text):
    return re.sub(r'[^A-Z0-9 ]', '', unicodedata.normalize('NFKD', text).upper())


def analyze_outcomes(path):
    first = {}
    dialogue = Counter()
    targets = Counter()
    last_dialogue = None
    inventory_had_parcel = False
    delivery_text = None
    delivery_removed = False
    pending = []
    recovery = {'signals': 0, 'complete_windows': 0, 'censored_windows': 0,
                'changed_action': 0, 'changed_context': 0, 'milestone_evidence': 0}
    signal_before = False
    context = None
    action = None
    objective = None
    last = 0

    def close(window, censored):
        recovery['censored_windows' if censored else 'complete_windows'] += 1
        for key in ('changed_action', 'changed_context', 'milestone_evidence'):
            recovery[key] += int(window[key])

    with Path(path).open() as source:
        for line in source:
            if not line.endswith('\n'):
                break
            e = json.loads(line)
            if e.get('elapsed') is None:
                continue
            t = e['elapsed']
            last = t
            expired = [w for w in pending if t > w['start'] + 120]
            for w in expired:
                close(w, False)
                pending.remove(w)
            kind = e['type']
            if kind == 'memory_updated':
                objective = e['notebook'].get('model_objective') or objective
            elif kind in ('observation', 'skill_observation'):
                s = e['state']
                map_id = s.get('map', {}).get('map_id')
                objective = s.get('verified_objective', {}).get('id', objective)
                for number, label in ((51, 'forest_entered'), (47, 'forest_north_gate'), (2, 'pewter_reached'), (54, 'pewter_gym_entered')):
                    if map_id == number:
                        first.setdefault(label, t)
                if s.get('player', {}).get('badges'):
                    first.setdefault('first_badge', t)
                interface = s.get('interface', {})
                text = ' '.join(interface.get('text', []))
                context = (map_id, json.dumps(s.get('player', {}).get('position')), text,
                           json.dumps(s.get('bag', [])), bool(s.get('battle', {}).get('in_battle')))
                for w in pending:
                    w['changed_context'] |= context != w['context']
                # Consecutive observations of the same page count once. These are page
                # revisits, not inferred distinct NPC conversations.
                encounter = (map_id, objective, text)
                if text and not s.get('battle', {}).get('in_battle') and encounter != last_dialogue:
                    dialogue[encounter] += 1
                last_dialogue = encounter if text else None
                if s.get('party'):
                    first.setdefault('starter_observed', t)
                has_parcel = any(i.get('id') == 70 and i.get('quantity', 0) > 0 for i in s.get('bag', []))
                if has_parcel:
                    first.setdefault('parcel_in_bag', t)
                    inventory_had_parcel = True
                n = normalized(text)
                if re.search(r'\bDELIVERED OAK\s*S?\s*PARCEL\b', n):
                    delivery_text = delivery_text if delivery_text is not None else t
                    first.setdefault('parcel_delivery_text', t)
                if delivery_text is not None and inventory_had_parcel and not has_parcel:
                    delivery_removed = True
                if re.search(r'\bGOT POKEDEX FROM OAK\b', n):
                    first.setdefault('pokedex_receipt_text', t)
            elif kind == 'action_completed':
                action = e['action']
                if action.startswith('go:'):
                    targets[(objective, action)] += 1
                for w in pending:
                    w['changed_action'] |= action != w['action']
            elif kind == 'milestone_evidence':
                for w in pending:
                    w['milestone_evidence'] = True
            elif kind == 'request':
                content = e['request']['messages'][0]['content']
                i = content.find('{"state":')
                request_context = json.loads(content[i:]) if i >= 0 else {}
                notebook = request_context.get('repeat_feedback', request_context.get('notebook', {}))
                signal = bool(notebook.get('reconsider'))
                if signal and not signal_before:
                    recovery['signals'] += 1
                    pending.append({'start': t, 'context': context, 'action': action,
                                    'changed_action': False, 'changed_context': False,
                                    'milestone_evidence': False})
                signal_before = signal
    for w in pending:
        close(w, last < w['start'] + 120)
    return {'version': 2, 'first_observed_seconds': first,
            'parcel_delivery_confirmed': delivery_text is not None and delivery_removed,
            'delivery_bag_corroborated': delivery_removed,
            'repeated_nonbattle_dialogue_pages': sum(max(0, n-1) for n in dialogue.values()),
            'repeated_navigation_targets_within_objective': sum(max(0, n-1) for n in targets.values()),
            'reconsideration_120_seconds': recovery,
            'observed_seconds': round(last, 2),
            'timing_note': 'Unreached milestones are censored; revisits and context changes are not proof of failure or success.'}

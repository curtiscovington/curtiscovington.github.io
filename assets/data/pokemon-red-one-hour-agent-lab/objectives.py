"""Disclosed Red-specific guidance; completion comes only from observed evidence."""
import re

from .outcome_metrics import normalized


class Objectives:
    def __init__(self, staged=False):
        self.staged = staged
        self.forest_crossed = False
        self.pewter_seen = False
        self.had_parcel = False
        self.delivery_text = False
        self.delivered = False
        self.pokedex = False

    def observe(self, state):
        map_id = state.get('map', {}).get('map_id')
        self.forest_crossed |= map_id == 47
        self.pewter_seen |= map_id == 2
        parcel = any(i.get('id') == 70 and i.get('quantity', 0) > 0 for i in state.get('bag', []))
        self.had_parcel |= parcel
        text = normalized(' '.join(state.get('interface', {}).get('text', [])))
        self.delivery_text |= bool(re.search(r'\bDELIVERED OAK\s*S?\s*PARCEL\b', text))
        self.delivered |= self.had_parcel and self.delivery_text and not parcel
        self.pokedex |= bool(re.search(r'\bGOT POKEDEX FROM OAK\b', text))
        starter = any(1 <= p.get('level', 0) <= 100 and p.get('species_id', 0) > 0
                      for p in state.get('party', []))
        if not starter:
            goal = ('obtain_starter', 'Leave the house. In Pallet Town walk north to meet Oak, then follow him and choose a starter in his lab.', 'A valid Pokemon appears in party.')
        elif not self.delivered and not self.pokedex:
            if parcel:
                goal = ('deliver_parcel', 'Return south through Route 1 to Pallet Town, enter Oak\'s Lab and speak to Oak. Do not revisit the Mart to collect another parcel.', 'Delivery dialogue and parcel removed from bag.')
            else:
                goal = ('collect_parcel', 'Travel north to Viridian City, enter the Mart and speak to its clerk.', 'Oak\'s Parcel (item 70) appears in bag.')
        elif not self.pokedex:
            goal = ('receive_pokedex', 'Continue Oak\'s conversation until the Pokedex is received.', 'Explicit Pokedex receipt dialogue.')
        elif not state.get('player', {}).get('badges'):
            goal = ('first_badge', 'Travel north through Viridian City, Route 2 and Viridian Forest toward Pewter City. Prepare your team, heal when needed, and defeat Brock.', 'First badge observed.')
        else:
            goal = ('continue_journey', 'Continue toward the next badge, keeping the team healthy.', 'Further badges observed.')
        if goal[0] == 'obtain_starter' and map_id == 40:
            goal = ('obtain_starter', 'Choose one of the Poke Balls on the table and confirm YES to receive a starter. Oak will prevent leaving until you choose. Speaking to Oak or repeatedly approaching the exit does not choose a Pokemon.', 'A valid Pokemon appears in party.')
        if self.staged and goal[0] == 'first_badge':
            party = state.get('party', [])
            healthy = any(p.get('hp', 0) > 0 and p.get('hp', 0) >= p.get('max_hp', 1) * .8 for p in party)
            if self.pewter_seen:
                if not healthy:
                    goal = ('heal_team', 'Visit Pewter Pokemon Center and speak to the nurse. Keep this task through the healing dialogue.', 'A party member has at least 80 percent HP.')
                elif map_id == 54:
                    goal = ('challenge_brock', 'Challenge the gym trainers and Brock. Choose effective moves, manage HP, and win the Boulder Badge.', 'First badge observed.')
                else:
                    goal = ('enter_pewter_gym', 'Reach Pewter City and enter its Gym to challenge Brock. Your team is healthy enough to attempt the challenge.', 'Pewter Gym map 54 observed.')
            elif self.forest_crossed:
                goal = ('reach_pewter', 'Leave the north forest gate toward Route 2, then continue north to Pewter City. Do not return south into the forest.', 'Pewter City map 2 observed.')
            elif map_id == 51:
                goal = ('cross_forest', 'Traverse Viridian Forest toward its north exit. Avoid returning through the southern entrance. Resolve battles and continue toward the north gate.', 'North gate map 47 observed.')
            else:
                goal = ('reach_forest', 'Head north from Viridian City along Route 2, through the south forest gate, and enter Viridian Forest.', 'Viridian Forest map 51 observed.')
        return {'id': goal[0], 'instruction': goal[1], 'success_evidence': goal[2],
                'source': 'Explicit Pokemon Red guide; completion checked from observed game state.'}

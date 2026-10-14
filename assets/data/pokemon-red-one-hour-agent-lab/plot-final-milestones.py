import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
blog=Path(__file__).resolve().parents[3]
a=json.loads((blog/'assets/data/pokemon-red-one-hour-agent-lab/final-batch-audit.json').read_text())
rows=sorted(a['runs'],key=lambda r:(r['seed'],r['recovery']))
fig,ax=plt.subplots(figsize=(11,6.2),layout='constrained')
fig.patch.set_facecolor('#fbfaf7');ax.set_facecolor('#fbfaf7')
colors={'pewter_reached':'#407b93','pewter_gym_entered':'#b46b31','first_badge':'#23724d'}
markers={'pewter_reached':'o','pewter_gym_entered':'s','first_badge':'*'}
for i,r in enumerate(rows):
 if i%4<2:ax.axhspan(i-.46,i+.46,color='#efeee8',zorder=0)
 ax.hlines(i,0,60,color='#c7c6bf',linewidth=1,zorder=1)
 for k in colors:
  if k in r['first']:ax.scatter(r['first'][k]/60,i,c=colors[k],marker=markers[k],s=145 if k=='first_badge' else 47,zorder=3)
 if 'first_badge' not in r['first']:
  ax.scatter(60,i,marker='x',c='#676762',s=65,zorder=4)
 else:
  n=round(r['first']['first_badge']);ax.text(61,i,f'{n//60}:{n%60:02}',va='center',fontsize=10,color='#23724d')
ax.set_yticks(range(8),[f"Seed {r['seed']}  ·  {'Recovery' if r['recovery'] else 'Baseline'} (run {int(r['run'][:2])})" for r in rows])
ax.invert_yaxis();ax.set_xlim(0,66);ax.set_xticks(range(0,61,10));ax.set_xlabel('Elapsed minutes from bedroom start',labelpad=10)
ax.axvline(60,color='#777770',linestyle=':',linewidth=1)
ax.set_title('All eight runs entered the gym. Four earned the badge.',loc='left',fontweight='bold',fontsize=15,pad=38)
ax.text(0,1.035,'One-hour runs · same model and controls · paired seeds · v2.21',transform=ax.transAxes,fontsize=10,color='#55554f')
handles=[Line2D([],[],color=colors[k],marker=markers[k],linestyle='None',markersize=10 if k=='first_badge' else 7,label=label) for k,label in [('pewter_reached','Pewter'),('pewter_gym_entered','Gym'),('first_badge','Badge state observed')]]
handles.append(Line2D([],[],color='#676762',marker='x',linestyle='None',markersize=8,label='No badge by deadline'))
ax.legend(handles=handles,loc='upper left',bbox_to_anchor=(-.02,-.15),ncol=4,frameon=False,fontsize=9)
for sp in ax.spines.values():sp.set_visible(False)
ax.tick_params(axis='both',length=0);ax.grid(axis='x',color='#e0dfd8',linewidth=.5);ax.set_axisbelow(True)
p=blog/'img/posts/pokemon-red-one-hour-agent-lab';fig.savefig(p/'final-milestones.png',dpi=180);fig.savefig(p/'final-milestones.svg');print(p/'final-milestones.png')

# Portrait export: legible at a 390px mobile content width.
fig,ax=plt.subplots(figsize=(3.9,6.5),layout='constrained')
fig.patch.set_facecolor('#fbfaf7');ax.set_facecolor('#fbfaf7')
for i,r in enumerate(rows):
 if i%4<2:ax.axhspan(i-.46,i+.46,color='#efeee8',zorder=0)
 ax.hlines(i,0,60,color='#c7c6bf',linewidth=1)
 for k in colors:
  if k in r['first']:ax.scatter(r['first'][k]/60,i,c=colors[k],marker=markers[k],s=110 if k=='first_badge' else 34,zorder=3)
 if 'first_badge' not in r['first']:ax.scatter(60,i,marker='x',c='#555550',s=65,linewidths=2,zorder=4)
ax.set_yticks(range(8),[f"{int(r['run'][:2])} · {'Recovery' if r['recovery'] else 'Baseline'}" for r in rows],fontsize=10)
ax.invert_yaxis();ax.set_xlim(0,63);ax.set_xticks([0,20,40,60]);ax.set_xlabel('Minutes from bedroom start',fontsize=10)
ax.axvline(60,color='#777770',linestyle=':',linewidth=1)
ax.set_title('All 8 entered the gym.\n4 earned the badge.',loc='left',fontweight='bold',fontsize=13,pad=15)
ax.legend(handles=handles,loc='upper left',bbox_to_anchor=(-.5,-.13),ncol=1,frameon=False,fontsize=10)
for sp in ax.spines.values():sp.set_visible(False)
ax.tick_params(axis='both',length=0);ax.grid(axis='x',color='#e0dfd8',linewidth=.5);ax.set_axisbelow(True)
fig.savefig(p/'final-milestones-mobile.png',dpi=100)

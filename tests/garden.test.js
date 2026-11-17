import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {grove,scenePage,sceneSpot,characterFor,TREE_LIMIT} from '../mods/tinydust/game.js';

function element() {
  const target={nodes:[],attrs:{}};
  return new Proxy(target,{get(t,key,self){
    if(key in t)return t[key];
    if(key==='when')return (on,fn)=>on?fn(self):self;
    if(key==='child')return value=>{t.nodes.push(value);return self;};
    if(key==='children')return values=>{t.nodes.push(...values);return self;};
    return (...args)=>{t.attrs[key]=args;return self;};
  }});
}
const flat=n=>typeof n==='string'?[n]:[n,...n.nodes.flatMap(flat)];
const has=(nodes,id)=>nodes.find(n=>n.attrs?.id?.[0]===id);
function harness() {
  let properties={},order=[],calls=[],timer=null;
  const preferences=new Map();
  const spaceList=[{id:'here',active:true,machine:'remote',tabs:[{id:'tab-here'}]}];
  const paneList=[{pane:'pane-here',tab:'tab-here',focused:true,terminal:'a0'}];
  const data=['working','blocked','done','idle','future'].map((status,i)=>({address:'a'+i,space:'here',status,program:{name:'Agent '+i},tab_name:'Work'}));
  data.push({address:'elsewhere',space:'other',status:'working'});
  const cx={notify(){},timer:{after(ms,fn){timer=fn;return {cancel(){timer=null;}};}}};
  const context={View:class{},div:element,image:path=>element().image(path),h_flex:element,v_flex:element,Button:{new:id=>element().id(id)},
    props:()=>properties,theme:()=>new Proxy({},{get:()=> '#aabbcc'}),shared:k=>preferences.get(k),setShared:(k,v)=>preferences.set(k,v),
    agents:()=>data,spaces:()=>spaceList,panes:()=>paneList,setAgentOrder:v=>order=v,run:(...args)=>calls.push(args),
    openOverlay:spec=>calls.push(['openOverlay',spec]),closeOverlay:id=>calls.push(['closeOverlay',id]),
    notify(){throw Error('Scene must not duplicate Herdr notifications');},playSound(){throw Error('Scene must not duplicate Herdr sounds');}};
  vm.createContext(context);
  for(const file of ['game.js','scene.js','toast.js','creation.js','workbench.js','main.js']){
    const source=readFileSync(new URL('../mods/tinydust/'+file,import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export (function|const) /g,'$1 ').replace('export default class TinyDust','class TinyDust');
    vm.runInContext(source+(file==='main.js'?'\nthis.Garden=TinyDust;':''),context);
  }
  const garden=new context.Garden();garden.init();
  return {garden,cx,data,spaceList,paneList,preferences,calls,props:p=>{properties=p;},order:()=>Array.from(order),nodes:()=>flat(garden.render()),tick:()=>timer?.(cx)};
}

test('New menu routes tab, space and terminal to captured targets; stale targets and demos are safe',()=>{
  const h=harness();h.props({role:'brand'});
  has(h.nodes(),'create-open').attrs.on_click[0]();
  const spec=h.calls[0][1];assert.equal(spec.kind,'popup');assert.equal(spec.props.role,'create-menu');
  assert.equal(spec.props.target.space,'here');assert.equal(spec.props.target.machine,'remote');assert.equal(spec.props.target.pane,'pane-here');
  h.props({...spec.props,overlay:'new-menu'});
  const nodes=h.nodes();
  for(const [kind,name,args] of [
    ['tab','tab.new',{space:'here'}],['space','space.new',{machine:'remote'}],['terminal','pane.split',{pane:'pane-here',direction:'right'}]
  ]){
    const row=has(nodes,`create-${kind}`);assert.equal(row.attrs.disabled[0],false);
    row.attrs.on_click[0]();const command=h.calls.at(-1);
    assert.equal(command[0],name);assert.equal(JSON.stringify(command[1]),JSON.stringify(args));
    assert.equal(h.calls.at(-2)[0],'closeOverlay');
  }
  h.paneList.length=0;const count=h.calls.length;
  has(nodes,'create-terminal').attrs.on_click[0]();assert.equal(h.calls.length,count);
  assert.equal(has(h.nodes(),'create-terminal').attrs.disabled[0],true);
  h.spaceList.length=0;has(nodes,'create-tab').attrs.on_click[0]();assert.equal(h.calls.length,count);
  assert.equal(has(h.nodes(),'create-space').attrs.disabled[0],false);
  h.props({...spec.props,overlay:'sample-menu',demo:true});
  for(const kind of ['tab','space','terminal'])has(h.nodes(),`create-${kind}`).attrs.on_click[0]();
  assert.equal(h.calls.length,count);
  h.props({role:'brand',demo:true});h.garden.width=44;
  assert(has(h.nodes(),'create-open'));assert(!has(h.nodes(),'journal-toggle'));
});

test('workbench decoration stays outside the terminal and preserves native pane controls',()=>{
  const h=harness();h.props({role:'workbench'});
  let nodes=h.nodes();assert(has(nodes,'workbench-trim'));assert(nodes.includes('The workbench'));
  assert(nodes.some(n=>n.attrs?.image?.[0]==='mods/tinydust/workbench-sprout.svg'));
  assert(!nodes.some(n=>n.attrs?.on_click));assert.equal(h.calls.length,0);
  h.garden.width=100;nodes=h.nodes();assert(has(nodes,'workbench-trim'));assert(nodes.includes('The workbench'));
  const layout=JSON.parse(readFileSync(new URL('../layouts/tinydust.json',import.meta.url),'utf8'));
  const visit=node=>[node,...(node.children??[]).flatMap(visit)], all=visit(layout);
  const shell=all.find(node=>node.id==='workbench'),main=all.find(node=>node.id==='main');
  assert(shell.children.includes(main));assert.equal(main.content.tab,'active');
  assert.equal(main.content.pane.header.content.mod,'pane');assert.equal(main.content.pane.header.reveal,'always');
  assert.equal(main.content.pane.focus.color,'accent');assert.equal(main.content.pane.focus.width,2);
  assert.equal(layout.terminal_padding[0],14);assert.equal(layout.terminal_padding[1],12);
});

test('working agents grow trees; counts stay honest and large scenes stay bounded',()=>{
  const list=Array.from({length:40},(_,i)=>({address:'a'+i,status:i<30?'working':'idle'}));
  assert.equal(grove(list).count,30);assert.equal(grove(list).visible.length,TREE_LIMIT);
  list[0].status='done';assert.equal(grove(list).count,29);
  assert.equal(grove([]).count,0);
  const seen=[];
  for(let page=0;page<scenePage(list).pages;page++)seen.push(...scenePage(list,page).agents);
  assert.deepEqual(seen,list);
  assert.equal(scenePage(list,999).page,6);assert.equal(scenePage([],999).page,0);
  assert.equal(scenePage(list,0,3).agents.length,3);
  for(let i=0;i<6;i++)for(const state of ['working','idle','blocked','done']){
    const spot=sceneSpot(i,state,300);assert(spot.x>=0&&spot.x+54<=300);
  }
});

test('live scene filters spaces, focuses exact agents, paginates and grows one tree per worker',()=>{
  const h=harness(),g=h.garden;
  let nodes=h.nodes();
  assert.deepEqual(h.order(),['a0','a1','a2','a3','a4','elsewhere']);
  assert(!has(nodes,'farmer-elsewhere'));assert(has(nodes,'tree-a0'));assert(!has(nodes,'tree-a1'));
  assert(has(nodes,'unit-a0'));assert(!has(nodes,'unit-a3'));
  has(nodes,'unit-a1').attrs.on_click[0]({},h.cx);assert.equal(h.calls[0][0],'agent.focus');assert.equal(h.calls[0][1].terminal,'a1');
  has(nodes,'next-field').attrs.on_click[0]({},h.cx);nodes=h.nodes();assert(has(nodes,'unit-a3'));
  has(nodes,'previous-field').attrs.on_click[0]({},h.cx);
  h.data[0].status='done';nodes=h.nodes();assert(!has(nodes,'tree-a0'));assert(nodes.includes('Finished!'));
  assert.equal(h.calls.length,1,'A status update sends no duplicate notification or sound');
  h.data[0].status='working';g.page=0;nodes=h.nodes();
  has(nodes,'visit-farm').attrs.on_click[0]({},h.cx);assert.equal(h.calls[1][0],'openOverlay');assert.equal(h.calls[1][1].props.role,'world');
});

test('work/rest/cheer sprites, opt-in animation, tree taps and Quiet view',()=>{
  const h=harness(),g=h.garden;g.height=800;
  let nodes=h.nodes();
  for(const ending of ['-work-0.svg','-rest.svg','-cheer.svg'])assert(nodes.some(n=>n.attrs?.image?.[0]?.endsWith(ending)),ending);
  assert(!nodes.some(n=>n.attrs?.loop));
  h.preferences.set('tinydust.motion',true);nodes=h.nodes();assert(nodes.some(n=>n.attrs?.loop));
  has(nodes,'tree-a0').attrs.on_click[0]({},h.cx);assert.equal(g.shaken,'a0');assert(g.treeMessage.includes('Agent 0'));
  h.tick();assert.equal(g.shaken,null);
  h.preferences.set('tinydust.quiet',true);nodes=h.nodes();assert(!has(nodes,'living-farm'));assert(!nodes.some(n=>n.attrs?.loop));
  assert(has(nodes,'farmer-a0'));has(nodes,'motion').attrs.on_click[0]({},h.cx);assert.equal(h.preferences.get('tinydust.quiet'),false);
  g.width=100;nodes=h.nodes();assert(!has(nodes,'living-farm'));assert(has(nodes,'farmer-a0'));
});

test('character identity is stable, poses exist, and demo never focuses real agents',()=>{
  const h=harness(),before=characterFor('a1');h.data.reverse();h.nodes();assert.equal(characterFor('a1'),before);
  const kinds=new Set(Array.from({length:64},(_,i)=>characterFor(`agent-${i}`)[0]));assert.equal(kinds.size,8);
  for(const kind of kinds)for(const suffix of ['','-work-0','-work-1','-rest','-cheer'])
    assert(readFileSync(new URL(`../mods/tinydust/${kind}${suffix}.svg`,import.meta.url),'utf8').includes('<svg'));
  h.preferences.set('tinydust.quiet',true);h.props({demo:true,role:'world'});h.garden.width=880;
  const nodes=h.nodes();assert(has(nodes,'living-farm'));assert(!nodes.some(n=>n.attrs?.loop));
  has(nodes,'unit-sample-1').attrs.on_click[0]({},h.cx);assert.equal(h.calls.length,0);
  assert.equal(h.garden.demoSelected,'sample-1');assert.equal(h.preferences.get('tinydust.quiet'),true);
});

test('TinyDust skins Herdr info-level completion toasts without losing actions or generic alerts',()=>{
  const h=harness();
  h.props({overlay:'notice',title:'Pi finished',body:'Sample / Task',level:'info',action:{name:'agent.focus',args:{terminal:'a2'}}});
  let nodes=h.nodes();assert(nodes.some(n=>n.attrs?.image?.[0]?.endsWith('-cheer.svg')));
  assert(nodes.includes('Harvest ready · click to visit'));
  has(nodes,'notice-open').attrs.on_click[0]();assert.equal(h.calls[0][0],'closeOverlay');assert.equal(h.calls[1][0],'agent.focus');assert.equal(h.calls[1][1].terminal,'a2');
  h.props({overlay:'notice2',title:'Connection failed',body:'Reconnect from Settings',level:'error'});
  nodes=h.nodes();assert(nodes.includes('Connection failed'));assert(!nodes.some(n=>n.attrs?.image?.[0]?.endsWith('-cheer.svg')));
  has(nodes,'notice-close').attrs.on_click[0]();assert.equal(h.calls[2][1],'notice2');
  const layout=JSON.parse(readFileSync(new URL('../layouts/tinydust.json',import.meta.url),'utf8'));assert.equal(layout.toast,'tinydust');
});

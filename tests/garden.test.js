import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {grove,scenePage,sceneSpot,characterFor,TREE_LIMIT} from '../mods/tinydust/game.js';
import {GROVE_KEY,readGroves,rememberAgents,clearGrove} from '../mods/tinydust/grove.js';
import {PANE_LABEL_KEY,readPaneLabels,matchingPane,paneLabel,setPaneLabel} from '../mods/tinydust/labels.js';

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
function harness(preferences=new Map()) {
  let properties={},order=[],calls=[],timer=null;
  const spaceList=[{id:'here',name:'Garden',active:true,machine:'remote',tabs:[{id:'tab-here'}]}];
  const paneList=[{pane:'pane-here',tab:'tab-here',focused:true,terminal:'a0',title:'Shell',cwd:'/home/sample',program:{name:'Agent 0',agent:true},status:'working'},
    {pane:'pane-other',tab:'tab-here',focused:false,terminal:'a1',title:'Shell',cwd:'/home/sample',program:{name:'Agent 1',agent:true},status:'blocked'}];
  const spaceView={id:'spaces',type:'stack',active:'tinydust-spaces-native',children:[{id:'tinydust-spaces-native'},{id:'tinydust-spaces-compact'}]};
  const sidebar={id:'sidebar',size:{px:300},children:[spaceView]},rootLayout={id:'root',children:[sidebar]},windowState={platform:'linux'};
  const data=['working','blocked','done','idle','future'].map((status,i)=>({address:'a'+i,pane:i===0?'pane-here':i===1?'pane-other':`pane-${i}`,space:'here',status,program:{name:'Agent '+i},tab_name:'Work'}));
  data.push({address:'elsewhere',space:'other',status:'working'});
  const cx={notify(){},stop_propagation(){},focus_handle:()=>({focus(){}}),timer:{after(ms,fn){timer=fn;return {cancel(){timer=null;}};}}};
  const inputState={new:({value=''})=>({text:value,on(){},focus(){},value(){return this.text;},set_value(value){this.text=value;}})};
  const context={View:class{},div:element,svg:path=>element().svg(path),image:path=>element().image(path),h_flex:element,v_flex:element,Button:{new:id=>element().id(id)},Input:{new:()=>element()},InputState:inputState,
    props:()=>properties,theme:()=>new Proxy({},{get:()=> '#aabbcc'}),shared:k=>preferences.get(k),setShared:(k,v)=>preferences.set(k,v),home:()=>'/home/sample',checking:()=>true,
    agents:()=>data,spaces:()=>spaceList,panes:()=>paneList,layout:()=>rootLayout,window:()=>windowState,setAgentOrder:v=>order=v,run:(...args)=>calls.push(args),
    openOverlay:spec=>calls.push(['openOverlay',spec]),closeOverlay:id=>calls.push(['closeOverlay',id]),
    notify(){throw Error('Scene must not duplicate Herdr notifications');},playSound(){throw Error('Scene must not duplicate Herdr sounds');}};
  vm.createContext(context);
  for(const file of ['game.js','grove.js','labels.js','scene.js','toast.js','creation.js','workbench.js','spaces.js','pane-ui.js','main.js']){
    const source=readFileSync(new URL('../mods/tinydust/'+file,import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export (function|const) /g,'$1 ').replace('export default class TinyDust','class TinyDust');
    vm.runInContext(source+(file==='main.js'?'\nthis.Garden=TinyDust;':''),context);
  }
  const garden=new context.Garden();garden.init();
  return {garden,cx,data,spaceList,paneList,sidebar,spaceView,rootLayout,windowState,preferences,calls,props:p=>{properties=p;},order:()=>Array.from(order),nodes:()=>flat(garden.render()),tick:()=>timer?.(cx)};
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

test('space shortcuts use stable icons, preserve Herdr colors and only switch valid real spaces',()=>{
  const h=harness();h.spaceList.push({id:'other',name:'Studio',active:false,tabs:[]});
  h.preferences.set('space.colors',{here:'ansi1',other:'#123456'});h.props({role:'space-shortcuts'});
  let nodes=h.nodes();assert.equal(has(nodes,'space-shortcut-here').attrs.bg[0],'#d9649a');
  assert.equal(has(nodes,'space-shortcut-other').attrs.bg[0],'#123456');
  h.preferences.set('space.colors',{here:'ansi1',other:'#123456aa'});assert.equal(has(h.nodes(),'space-shortcut-other').attrs.bg[0],'#123456aa');
  assert(has(nodes,'space-shortcut-here').attrs.accessibility_label[0].includes('Selected space'));
  for(const name of ['flower','house','tree','star'])assert(readFileSync(new URL(`../mods/tinydust/space-${name}.svg`,import.meta.url),'utf8').includes('<svg'));
  has(nodes,'space-shortcut-other').attrs.on_click[0]();assert.equal(h.calls.at(-1)[0],'space.select');assert.equal(h.calls.at(-1)[1].id,'other');
  h.spaceList.pop();has(nodes,'space-shortcut-other').attrs.on_click[0]();assert.equal(h.calls.length,1);
  h.props({role:'space-shortcuts',demo:true});nodes=h.nodes();has(nodes,'space-shortcut-sample-a').attrs.on_click[0]();assert.equal(h.calls.length,1);
  assert.equal(h.preferences.get('space.colors').here,'ansi1');
});

test('compact spaces show colored icons, target the exact space, and keep demo actions safe',()=>{
  const h=harness();h.spaceList[0].status='working';h.spaceList.push({id:'other',name:'Studio',status:'blocked',tabs:[]});
  h.preferences.set('space.colors',{here:'ansi1',other:'#123456'});h.props({role:'compact-spaces'});
  let nodes=h.nodes();const here=has(nodes,'space-rail-here'),other=has(nodes,'space-rail-other');
  assert.equal(here.attrs.bg[0],'#d9649a');assert.equal(other.attrs.bg[0],'#123456');
  assert(here.attrs.accessibility_label[0].includes('working'));assert(other.attrs.accessibility_label[0].includes('blocked'));
  assert(nodes.some(n=>n.attrs?.image?.[0]?.includes('mods/tinydust/space-')));
  other.attrs.on_click[0]();assert.equal(h.calls.at(-1)[0],'space.select');assert.equal(h.calls.at(-1)[1].id,'other');
  let stopped=false;other.attrs.on_mouse_down[1]({}, {stop_propagation(){stopped=true;}});
  assert(stopped);assert.equal(h.calls.at(-1)[1].props.target.id,'other');
  h.spaceList.pop();const count=h.calls.length;other.attrs.on_click[0]();other.attrs.on_mouse_down[1]({}, {stop_propagation(){}});assert.equal(h.calls.length,count);
  h.props({role:'compact-spaces',demo:true});nodes=h.nodes();has(nodes,'space-rail-sample-a').attrs.on_click[0]();assert.equal(h.calls.length,count);
  h.props({role:'compact-spaces'});h.preferences.delete('space.colors');
  h.spaceList.splice(0,h.spaceList.length,{id:'A',name:'A'},{id:'B',name:'B'});nodes=h.nodes();
  assert.notEqual(has(nodes,'space-rail-A').attrs.bg[0],has(nodes,'space-rail-B').attrs.bg[0],'new spaces have stable colorful fallbacks');
});

test('sidebar switches only its own space list on width changes',()=>{
  const h=harness();h.props({role:'space-shortcuts'});
  let measure=has(h.nodes(),'space-shortcuts-bar').attrs.on_size_change[0];
  h.sidebar.size.px=44;measure({width:44,height:36},h.cx);assert.equal(h.calls.at(-1)[0],'layout.select');
  assert.equal(h.calls.at(-1)[1].stack,'spaces');assert.equal(h.calls.at(-1)[1].child,'tinydust-spaces-compact');
  h.spaceView.active='tinydust-spaces-compact';const count=h.calls.length;measure=has(h.nodes(),'space-shortcuts-bar').attrs.on_size_change[0];measure({width:44,height:36},h.cx);assert.equal(h.calls.length,count);
  h.sidebar.size.px=300;measure({width:300,height:36},h.cx);assert.equal(h.calls.at(-1)[1].child,'tinydust-spaces-native');
  h.props({role:'space-shortcuts',demo:true});const before=h.calls.length;measure=has(h.nodes(),'space-shortcuts-bar').attrs.on_size_change[0];measure({width:44,height:36},h.cx);assert.equal(h.calls.length,before);
  const alreadyFolded=harness();alreadyFolded.props({role:'space-shortcuts'});alreadyFolded.sidebar.size.px=44;
  alreadyFolded.nodes();assert.equal(alreadyFolded.calls.at(-1)[1].child,'tinydust-spaces-compact');
  const layoutFile=JSON.parse(readFileSync(new URL('../layouts/tinydust.json',import.meta.url),'utf8'));
  const visit=node=>[node,...(node.children??[]).flatMap(visit)], stack=visit(layoutFile).find(node=>node.id==='spaces');
  assert.equal(stack.type,'stack');assert.equal(stack.children.find(node=>node.id==='tinydust-spaces-native').content.mod,'spaces');
  assert.equal(stack.children.find(node=>node.id==='tinydust-spaces-compact').content.props.role,'compact-spaces');
});

test('sidebar toggle preserves width, uses the native rail, and is demo-safe',()=>{
  const h=harness();h.props({role:'space-shortcuts'});h.sidebar.size.px=360;h.garden.width=360;
  let nodes=h.nodes();assert.equal(has(nodes,'sidebar-toggle').attrs.accessibility_label[0],'Collapse sidebar');
  assert(has(nodes,'space-shortcut-here'));has(nodes,'sidebar-toggle').attrs.on_click[0]();
  assert.equal(h.preferences.get('tinydust.sidebarWidth'),360);assert.equal(h.calls.at(-1)[0],'layout.resize');
  assert.equal(h.calls.at(-1)[1].id,'sidebar');assert.equal(h.calls.at(-1)[1].px,44);
  h.sidebar.size.px=44;h.garden.width=44;nodes=h.nodes();
  assert.equal(has(nodes,'sidebar-toggle').attrs.accessibility_label[0],'Expand sidebar');assert(!has(nodes,'space-shortcut-here'));
  has(nodes,'sidebar-toggle').attrs.on_click[0]();assert.equal(h.calls.at(-1)[1].px,360);
  h.preferences.set('tinydust.sidebarWidth',999);has(nodes,'sidebar-toggle').attrs.on_click[0]();assert.equal(h.calls.at(-1)[1].px,300);
  h.windowState.platform='macos';h.sidebar.size.px=275;h.garden.width=275;has(h.nodes(),'sidebar-toggle').attrs.on_click[0]();assert.equal(h.calls.at(-1)[1].px,76);
  h.sidebar.size.px=76;h.garden.width=76;has(h.nodes(),'sidebar-toggle').attrs.on_click[0]();assert.equal(h.calls.at(-1)[1].px,275);
  h.sidebar.size={weight:1};h.garden.width=220;has(h.nodes(),'sidebar-toggle').attrs.on_click[0]();assert.equal(h.preferences.get('tinydust.sidebarWidth'),220);
  const count=h.calls.length;h.props({role:'space-shortcuts',demo:true});has(h.nodes(),'sidebar-toggle').attrs.on_click[0]();assert.equal(h.calls.length,count);
  h.props({role:'space-shortcuts'});h.rootLayout.children=[];has(h.nodes(),'sidebar-toggle').attrs.on_click[0]();assert.equal(h.calls.length,count);
});

test('macOS traffic lights keep New and Expand accessible on the rail',()=>{
  const h=harness();Object.assign(h.windowState,{platform:'macos',titlebar:'none',fullscreen:false});
  h.sidebar.size.px=76;h.garden.width=76;h.props({role:'brand'});
  assert(!has(h.nodes(),'create-open'));h.props({role:'space-shortcuts'});
  let nodes=h.nodes();assert(has(nodes,'create-open'));assert(has(nodes,'sidebar-toggle'));
  has(nodes,'create-open').attrs.on_click[0]();assert.equal(h.calls.at(-1)[1].props.role,'create-menu');
  h.props({role:'brand'});h.garden.width=300;nodes=h.nodes();
  assert(has(nodes,'brand-title'));assert(has(nodes,'create-open'));assert(has(nodes,'journal-toggle'));
  assert.equal(has(nodes,'tinydust-brand').attrs.pl[0],76);
  h.windowState.fullscreen=true;h.garden.width=76;assert(has(h.nodes(),'create-open'));
  h.props({role:'space-shortcuts'});assert(!has(h.nodes(),'create-open'));
});

test('title font is customizable, validated and demo-safe without touching other fonts',()=>{
  const h=harness();h.props({role:'brand'});let nodes=h.nodes();
  assert.equal(has(nodes,'brand-title').attrs.font_family[0],'Nads Handwriting');
  has(nodes,'font-open').attrs.on_click[0]();assert.equal(h.calls.at(-1)[1].props.role,'font-menu');
  h.props({role:'font-menu',overlay:'font-popup'});h.garden.init(null,h.cx);
  let stopped=false;has(h.nodes(),'font-menu').attrs.on_key_down[0]({key:'escape'},{stop_propagation(){stopped=true;}});
  assert(stopped);assert.equal(h.calls.at(-1)[0],'closeOverlay');
  h.garden.fontInput.set_value('x'.repeat(101));h.garden.saveFont(h.cx);
  assert(!h.preferences.has('tinydust.brandFont'));assert(h.garden.fontError);
  h.garden.fontInput.set_value('  Custom Display  ');h.garden.saveFont(h.cx);
  assert.equal(h.preferences.get('tinydust.brandFont'),'Custom Display');assert.equal(h.calls.at(-1)[0],'closeOverlay');
  h.props({role:'brand'});assert.equal(has(h.nodes(),'brand-title').attrs.font_family[0],'Custom Display');
  h.props({role:'font-menu',demo:true});h.garden.init(null,h.cx);h.garden.fontInput.set_value('Other');h.garden.saveFont(h.cx);
  assert.equal(h.preferences.get('tinydust.brandFont'),'Custom Display');
  h.props({role:'font-menu'});h.garden.init(null,h.cx);h.garden.fontInput.set_value('');h.garden.saveFont(h.cx);assert.equal(h.preferences.get('tinydust.brandFont'),null);
  h.props({role:'brand'});assert.equal(has(h.nodes(),'brand-title').attrs.font_family[0],'Nads Handwriting');
  h.preferences.set('tinydust.brandFont','Silkscreen');assert.equal(has(h.nodes(),'brand-title').attrs.font_family[0],'Silkscreen');
  h.props({role:'brand',demo:true});assert.equal(has(h.nodes(),'brand-title').attrs.font_family[0],'Nads Handwriting');
});

test('brand shows the TinyDust wordmark and cottage without abbreviating it',()=>{
  const h=harness();h.props({role:'brand'});
  assert(readFileSync(new URL('../mods/tinydust/logo.svg',import.meta.url),'utf8').includes('<svg'));
  for(const width of [160,220,260,300,480]){
    h.garden.width=width;const nodes=h.nodes();
    assert(has(nodes,'brand-logo'));assert(has(nodes,'brand-title'));assert(nodes.includes('TinyDust'));assert(!nodes.includes('TD'));
    assert(has(nodes,'create-open'));assert.equal(Boolean(has(nodes,'journal-toggle')),width>=220);
    assert.equal(Boolean(has(nodes,'font-open')),width>=300);
  }
  h.garden.width=80;let nodes=h.nodes();assert(has(nodes,'brand-logo'));assert(!has(nodes,'brand-title'));assert(has(nodes,'create-open'));
  h.garden.width=44;nodes=h.nodes();assert(!nodes.includes('TD'));assert(has(nodes,'create-open'));
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
  assert.equal(main.content.pane.header.content.mod,'tinydust');assert.equal(main.content.pane.header.content.props.role,'pane-header');
  assert.equal(layout.terminal_menu,'tinydust');assert.equal(main.content.pane.header.reveal,'always');
  assert.equal(main.content.pane.focus.color,'accent');assert.equal(main.content.pane.focus.width,2);
  assert.equal(layout.terminal_padding[0],14);assert.equal(layout.terminal_padding[1],12);
});

test('pane labels validate, remain scoped to the exact terminal, and support clearing',()=>{
  const empty=readPaneLabels(null),first={pane:'p1',terminal:'remote/t1'},second={pane:'p2',terminal:'remote/t2'};
  const one=setPaneLabel(empty,first,'  Build API  '),two=setPaneLabel(one,second,'Write tests');
  assert.equal(paneLabel(two,first),'Build API');assert.equal(paneLabel(two,{pane:'p1',terminal:'other'}),'');
  assert.equal(paneLabel(two,second),'Write tests');assert.equal(empty.labels.length,0);
  assert.equal(setPaneLabel(two,first,'Build API'),two);
  const cleared=setPaneLabel(two,first,'  ');assert.equal(paneLabel(cleared,first),'');assert.equal(paneLabel(cleared,second),'Write tests');
  assert.throws(()=>setPaneLabel(two,first,'x'.repeat(81)));assert.throws(()=>setPaneLabel(two,first,'bad\nname'));
  assert.throws(()=>setPaneLabel(two,{pane:'p1'},'name'));
  const list=[{pane:'p1',terminal:'remote/t1'},{pane:'p2',terminal:'remote/t2'}];
  assert.equal(matchingPane(list,first),list[0]);assert.equal(matchingPane(list,{pane:'p1',terminal:'other'}),null);
  for(const bad of [{version:2,labels:[]},{version:1,labels:null},{version:1,labels:[{...first,name:'x'},{...first,name:'y'}]},'broken'])assert.throws(()=>readPaneLabels(bad));
});

test('pane header shows its label while retaining exact native pane controls',()=>{
  const h=harness(),target={pane:'pane-here',terminal:'a0'};
  h.preferences.set(PANE_LABEL_KEY,{version:1,labels:[{...target,name:'Build API'}]});
  h.props({role:'pane-header',...target});let nodes=h.nodes();assert(nodes.includes('Build API'));
  const header=has(nodes,'pane-head-pane-here');header.attrs.on_click[0]();assert.equal(h.calls.at(-1)[0],'pane.focus');assert.equal(h.calls.at(-1)[1].pane,'pane-here');
  let stopped=false;header.attrs.on_mouse_down[1]({}, {stop_propagation(){stopped=true;}});assert(stopped);
  assert.equal(h.calls.at(-1)[1].props.target.pane,'pane-here');assert.equal(h.calls.at(-1)[1].props.target.terminal,'a0');
  header.attrs.on_hover[0](true,h.cx);nodes=h.nodes();
  for(const [id,command,args] of [['right','pane.split',{direction:'right'}],['down','pane.split',{direction:'down'}],['zoom','pane.zoom',{}],['close','pane.close',{}]]){
    has(nodes,`pane-${id}-pane-here`).attrs.on_click[0]({},h.cx);const call=h.calls.at(-1);
    assert.equal(call[0],command);assert.equal(call[1].pane,'pane-here');assert.equal(JSON.stringify({...call[1],pane:undefined}),JSON.stringify(args));
  }
  const before=h.calls.length;h.props({role:'pane-header',...target,demo:true});nodes=h.nodes();
  has(nodes,'pane-head-pane-here').attrs.on_click[0]();has(nodes,'pane-close-pane-here').attrs.on_click[0]({},h.cx);
  has(nodes,'pane-head-pane-here').attrs.on_mouse_down[1]({},h.cx);assert.equal(h.calls.length,before);
});

test('right-click menu renames the clicked target and delegates original Herdr actions',()=>{
  const h=harness(),target={pane:'pane-other',terminal:'a1'};
  h.props({tab:'pane',target,overlay:'context'});h.garden.init(null,h.cx);
  let nodes=h.nodes();assert.equal(has(nodes,'pane-menu-rename').attrs.disabled[0],false);
  has(nodes,'pane-menu-more').attrs.on_click[0]({},h.cx);
  assert.equal(h.calls.at(-2)[0],'closeOverlay');assert.equal(h.calls.at(-1)[1].mod,'menu');
  assert.equal(h.calls.at(-1)[1].props.target.pane,'pane-other');assert.equal(h.calls.at(-1)[1].props.target.terminal,'a1');
  h.props({tab:'pane',target,overlay:'context2'});h.garden.init(null,h.cx);nodes=h.nodes();
  has(nodes,'pane-menu-rename').attrs.on_click[0]({},h.cx);
  assert.equal(h.calls.at(-1)[1].props.role,'rename-pane');assert.equal(h.calls.at(-1)[1].props.target.pane,'pane-other');
  h.props({tab:'pane',target,overlay:'stale'});h.garden.init(null,h.cx);nodes=h.nodes();
  h.paneList[1].terminal='different';const count=h.calls.length;
  has(nodes,'pane-menu-rename').attrs.on_click[0]({},h.cx);assert.equal(h.calls.length,count);assert(h.garden.paneMenuError);
  h.props({tab:'pane',target:{pane:'standalone',terminal:'a0'},overlay:'standalone'});h.garden.init(null,h.cx);nodes=h.nodes();
  assert.equal(has(nodes,'pane-menu-rename').attrs.disabled[0],true);assert.equal(has(nodes,'pane-menu-more').attrs.disabled[0],false);
  has(nodes,'pane-menu-more').attrs.on_click[0]({},h.cx);assert.equal(h.calls.at(-1)[1].props.target.pane,'standalone');
});

test('pane rename saves safely, detects stale targets and concurrent edits, and preserves other labels',()=>{
  const h=harness(),target={pane:'pane-here',terminal:'a0'},other={pane:'pane-other',terminal:'a1'};
  h.preferences.set(PANE_LABEL_KEY,{version:1,labels:[{...other,name:'Review'}]});
  h.props({role:'rename-pane',target,overlay:'rename'});h.garden.init(null,h.cx);
  h.garden.paneInput.set_value('  Build API  ');h.garden.savePaneLabel(h.cx);
  let state=h.preferences.get(PANE_LABEL_KEY);assert.equal(paneLabel(state,target),'Build API');assert.equal(paneLabel(state,other),'Review');
  h.props({role:'rename-pane',target,overlay:'rename2'});h.garden.init(null,h.cx);
  h.preferences.set(PANE_LABEL_KEY,setPaneLabel(state,target,'Changed elsewhere'));
  h.garden.paneInput.set_value('Would overwrite');h.garden.savePaneLabel(h.cx);
  assert(h.garden.paneLabelError.includes('changed while editing'));assert.equal(paneLabel(h.preferences.get(PANE_LABEL_KEY),target),'Changed elsewhere');
  h.props({role:'rename-pane',target,overlay:'rename3'});h.garden.init(null,h.cx);h.paneList[0].terminal='new-terminal';
  h.garden.paneInput.set_value('Stale');h.garden.savePaneLabel(h.cx);assert(h.garden.paneLabelError.includes('changed or closed'));
  assert.equal(paneLabel(h.preferences.get(PANE_LABEL_KEY),target),'Changed elsewhere');
  h.paneList[0].terminal='a0';h.props({role:'rename-pane',target});h.garden.init(null,h.cx);
  h.garden.paneInput.set_value('');h.garden.savePaneLabel(h.cx);state=h.preferences.get(PANE_LABEL_KEY);
  assert.equal(paneLabel(state,target),'');assert.equal(paneLabel(state,other),'Review');
  const corrupt={version:2,labels:[]};h.preferences.set(PANE_LABEL_KEY,corrupt);h.props({role:'rename-pane',target});h.garden.init(null,h.cx);
  assert(h.garden.paneLabelLocked);assert(!has(h.nodes(),'pane-label-save'));h.garden.savePaneLabel(h.cx);assert.equal(h.preferences.get(PANE_LABEL_KEY),corrupt);
  const failing=new Map(),otherView=harness(failing);failing.set=()=>{throw new Error('Storage unavailable');};
  otherView.props({role:'rename-pane',target});otherView.garden.init(null,otherView.cx);otherView.garden.paneInput.set_value('Keep this draft');
  otherView.garden.savePaneLabel(otherView.cx);assert.equal(otherView.garden.paneInput.value(),'Keep this draft');assert(otherView.garden.paneLabelError.includes('Storage unavailable'));
});

test('pane rename validates drafts and demo mode cannot change saved labels',()=>{
  const h=harness(),target={pane:'pane-here',terminal:'a0'};
  h.props({role:'rename-pane',target,overlay:'rename'});h.garden.init(null,h.cx);
  h.garden.paneInput.set_value('x'.repeat(81));h.garden.savePaneLabel(h.cx);
  assert(h.garden.paneLabelError.includes('80'));assert.equal(h.garden.paneInput.value().length,81);assert(!h.preferences.has(PANE_LABEL_KEY));
  h.garden.paneInput.set_value('bad\nname');h.garden.savePaneLabel(h.cx);assert(h.garden.paneLabelError.includes('single-line'));assert(!h.preferences.has(PANE_LABEL_KEY));
  h.props({role:'rename-pane',target,demo:true,overlay:'sample'});h.garden.init(null,h.cx);
  h.garden.paneInput.set_value('Demo only');h.garden.savePaneLabel(h.cx);assert(!h.preferences.has(PANE_LABEL_KEY));
});

test('pane context menu supports keyboard navigation without sending commands to terminals',()=>{
  const h=harness(),target={pane:'pane-here',terminal:'a0'};h.props({tab:'pane',target,overlay:'context'});h.garden.init(null,h.cx);
  let stopped=0;const cx={notify(){},stop_propagation(){stopped++;}};
  has(h.nodes(),'pane-menu').attrs.on_key_down[0]({key:'down'},cx);assert.equal(h.garden.paneMenuIndex,1);
  has(h.nodes(),'pane-menu').attrs.on_key_down[0]({key:'enter'},cx);assert.equal(h.calls.at(-1)[1].mod,'menu');
  assert.equal(h.calls.at(-1)[1].props.target.terminal,'a0');assert.equal(stopped,2);
});

test('pane labels appear on the matching character, including the compact tooltip',()=>{
  const h=harness(),target={pane:'pane-here',terminal:'a0'};
  h.preferences.set(PANE_LABEL_KEY,{version:1,labels:[{...target,name:'Build API'}]});
  h.garden.height=800;let nodes=h.nodes();assert(nodes.includes('Build API'));
  assert(has(nodes,'farmer-a0').attrs.tooltip[0].includes('Build API'));assert.equal(has(nodes,'name-a0').attrs.tooltip[0],'Build API');
  h.garden.width=44;nodes=h.nodes();assert(has(nodes,'farmer-a0').attrs.tooltip[0].includes('Build API'));
  let stopped=false;has(nodes,'farmer-a0').attrs.on_mouse_down[1]({}, {stop_propagation(){stopped=true;}});
  assert(stopped);assert.equal(h.calls.at(-1)[1].props.target.pane,'pane-here');assert.equal(h.calls.at(-1)[1].props.target.terminal,'a0');
  h.data[0].address='another-terminal';nodes=h.nodes();assert(!has(nodes,'farmer-another-terminal').attrs.tooltip[0].includes('Build API'));
  h.props({role:'world',demo:true});h.garden.width=880;nodes=h.nodes();assert(nodes.includes('Plant the first seed'));assert(!nodes.includes('Build API'));
});

test('persistent grove counts stay honest and large scenes stay bounded',()=>{
  const list=Array.from({length:40},(_,i)=>({address:'a'+i,status:i<30?'working':'idle'}));
  assert.equal(grove(list).count,40);assert.equal(grove(list).visible.length,TREE_LIMIT);
  list[0].status='done';assert.equal(grove(list).count,40);
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

test('grove state deduplicates agent terminals per space without recording conversations',()=>{
  const base=readGroves(null), sample=[
    {space:'garden',address:'t1',status:'idle',program:{name:'Builder'},title:'private title'},
    {space:'garden',address:'t1',status:'working',program:{name:'Builder'}},
    {space:'studio',address:'t1',status:'done',program:{name:'Writer'}},
  ];
  const grown=rememberAgents(base,sample);assert.equal(base.spaces.length,0);
  assert.deepEqual(grown.spaces.map(s=>[s.id,s.trees.length]),[['garden',1],['studio',1]]);
  assert.deepEqual(grown.spaces[0].trees,[{address:'t1',name:'Builder'}]);
  assert.equal(rememberAgents(grown,sample),grown);
  assert.equal(rememberAgents(grown,[]),grown);
  const cleared=clearGrove(grown,'garden',sample);assert.equal(cleared.spaces[0].trees.length,0);
  assert.deepEqual(cleared.spaces[0].ignored,['t1']);assert.equal(cleared.spaces[1].trees.length,1);
  assert.equal(rememberAgents(cleared,sample),cleared);
  const newAgent={space:'garden',address:'t2',program:{name:'New'}};
  assert.deepEqual(rememberAgents(cleared,[...sample,newAgent]).spaces[0].trees,[{address:'t2',name:'New'}]);
});

test('invalid or future grove data is rejected without being reset',()=>{
  for(const value of ['broken',[],{version:2,spaces:[]},{version:1,spaces:null},
    {version:1,spaces:[{id:'x',trees:[{address:'a',name:'A'}],ignored:['a']}]},
    {version:1,spaces:[{id:'x',trees:[],ignored:[]},{id:'x',trees:[],ignored:[]}]}])
    assert.throws(()=>readGroves(value));
  const h=harness(),corrupt={version:2,spaces:[]};h.preferences.set(GROVE_KEY,corrupt);
  assert(h.nodes().some(n=>typeof n==='string'&&n.includes('Could not read or save the grove')));
  assert.equal(h.preferences.get(GROVE_KEY),corrupt);
  h.props({role:'clear-grove',spaceId:'here',overlay:'confirm'});h.garden.init(null,h.cx);h.garden.clearGrove(h.cx);
  assert(h.garden.clearError);assert.equal(h.preferences.get(GROVE_KEY),corrupt);
});

test('a synchronous shared-storage failure and demo mode never overwrite a grove',()=>{
  const prefs=new Map(),h=harness(prefs);prefs.set=()=>{throw new Error('storage unavailable');};
  assert(h.nodes().some(n=>typeof n==='string'&&n.includes('Could not read or save the grove')));
  assert.equal(prefs.size,0);
  const sample=harness();sample.props({role:'world',demo:true});sample.garden.width=880;
  assert(has(sample.nodes(),'tree-sample-1'));assert(!sample.preferences.has(GROVE_KEY));
  sample.props({role:'clear-grove',spaceId:'sample',demo:true,overlay:'demo-clear'});sample.garden.init(null,sample.cx);
  sample.garden.clearGrove(sample.cx);assert(!sample.preferences.has(GROVE_KEY));
});

test('groves survive completion, disappearance and a new view; other spaces stay separate',()=>{
  const h=harness();let nodes=h.nodes();assert(has(nodes,'tree-a0'));assert(has(nodes,'tree-a4'));
  h.data[0].status='done';h.data.splice(0,5);nodes=h.nodes();
  assert(has(nodes,'tree-a0'));assert(has(nodes,'tree-a4'));assert(!has(nodes,'tree-elsewhere'));
  has(nodes,'tree-a0').attrs.on_click[0]({},h.cx);assert(h.garden.treeMessage.includes('Agent 0'));
  const h2=harness(h.preferences);h2.data.splice(0,5);nodes=h2.nodes();
  assert(has(nodes,'tree-a0'));assert(has(nodes,'tree-a4'));assert(!has(nodes,'tree-elsewhere'));
  const state=h2.preferences.get(GROVE_KEY);assert.equal(state.spaces.find(s=>s.id==='here').trees.length,5);
  assert.equal(state.spaces.find(s=>s.id==='other').trees.length,1);
  h2.data.push({space:'here',address:'new-agent',status:'idle',program:{name:'New'}});
  assert(has(h2.nodes(),'tree-new-agent'));assert.equal(h2.preferences.get(GROVE_KEY).spaces.find(s=>s.id==='here').trees.length,6);
});

test('clearing asks for confirmation, targets only the selected space, and suppresses present agents',()=>{
  const h=harness();h.props({role:'world',overlay:'farm'});h.garden.width=880;
  const nodes=h.nodes();has(nodes,'clear-grove').attrs.on_click[0]();
  const spec=h.calls.at(-1)[1];assert.equal(spec.props.role,'clear-grove');assert.equal(spec.props.spaceId,'here');
  h.props({...spec.props,overlay:'confirm'});h.garden.init(null,h.cx);
  has(h.nodes(),'clear-confirm').attrs.on_click[0]({},h.cx);
  let state=h.preferences.get(GROVE_KEY),here=state.spaces.find(s=>s.id==='here');
  assert.equal(here.trees.length,0);assert.equal(here.ignored.length,5);assert.equal(state.spaces.find(s=>s.id==='other').trees.length,1);
  h.props({role:'world'});h.garden.width=880;assert(!has(h.nodes(),'tree-a0'));
  h.data.push({space:'here',address:'fresh',status:'working',program:{name:'Fresh'}});assert(has(h.nodes(),'tree-fresh'));
  state=h.preferences.get(GROVE_KEY);const before=JSON.stringify(state);
  h.spaceList[0].active=false;h.spaceList.push({id:'other',active:true,tabs:[]});
  h.props({role:'clear-grove',spaceId:'here',overlay:'stale'});h.garden.init(null,h.cx);h.garden.clearGrove(h.cx);
  assert(h.garden.clearError.includes('changed'));assert.equal(JSON.stringify(h.preferences.get(GROVE_KEY)),before);
});

test('sidebar scene is compact at every height and all agents remain reachable',()=>{
  const h=harness();h.garden.height=1000;
  let nodes=h.nodes();const scene=has(nodes,'living-farm');
  assert(scene.attrs.h[0]<310);assert(has(nodes,'unit-a0'));assert(!has(nodes,'unit-a3'));
  assert(has(nodes,'farmer-a3'));assert.equal(has(nodes,'farmer-a3').attrs.h[0],42);
  has(nodes,'next-field').attrs.on_click[0]({},h.cx);nodes=h.nodes();assert(has(nodes,'unit-a3'));
  has(nodes,'farmer-a4').attrs.on_click[0]({},h.cx);assert.equal(h.calls.at(-1)[1].terminal,'a4');
  h.props({role:'world'});h.garden.width=880;h.garden.page=0;nodes=h.nodes();assert(has(nodes,'unit-a3'));
});

test('compact trees fit the landscape and their hit targets do not overlap',()=>{
  const h=harness();h.garden.height=1000;
  h.data.splice(0,h.data.length,...Array.from({length:24},(_,i)=>({address:`tree-${i}`,space:'here',status:'working',program:{name:`Agent ${i}`} })));
  for(const width of [240,260,300,480]){
    h.garden.width=width;const nodes=h.nodes(), ground=Math.min(260,width)*0.7;
    const trees=Array.from({length:24},(_,i)=>has(nodes,`tree-tree-${i}`));
    assert(trees.every(Boolean));
    for(let i=0;i<trees.length;i++){
      const a=trees[i].attrs,x=a.left[0],y=a.top[0],w=a.w[0],height=a.h[0];
      assert(x>=0&&x+w<=width+0.001&&y+height<=ground+0.001);
      if(i%6<5)assert(x+w<=trees[i+1].attrs.left[0]+0.001);
      if(i<18)assert(y+height<=trees[i+6].attrs.top[0]+0.001);
    }
  }
});

test('live scene filters spaces, focuses exact agents, paginates and keeps trees after completion',()=>{
  const h=harness(),g=h.garden;
  let nodes=h.nodes();
  assert.deepEqual(h.order(),['a0','a1','a2','a3','a4','elsewhere']);
  assert(!has(nodes,'farmer-elsewhere'));assert(has(nodes,'tree-a0'));assert(has(nodes,'tree-a1'));assert(!has(nodes,'tree-elsewhere'));
  assert(has(nodes,'unit-a0'));assert(!has(nodes,'unit-a3'));
  has(nodes,'unit-a1').attrs.on_click[0]({},h.cx);assert.equal(h.calls[0][0],'agent.focus');assert.equal(h.calls[0][1].terminal,'a1');
  has(nodes,'next-field').attrs.on_click[0]({},h.cx);nodes=h.nodes();assert(has(nodes,'unit-a3'));
  has(nodes,'previous-field').attrs.on_click[0]({},h.cx);
  h.data[0].status='done';nodes=h.nodes();assert(has(nodes,'tree-a0'));assert(nodes.includes('Finished!'));
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
  assert(nodes.some(n=>n.attrs?.image?.[0]?.endsWith('-work-0.svg')),'compact agents keep their pixel portraits');
  assert.equal(has(nodes,'farmer-a0').attrs.border_color[0],'#bfd7b5');
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

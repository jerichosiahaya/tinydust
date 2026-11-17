import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function element(){
  const target={nodes:[],attrs:{},handlers:{}};
  return new Proxy(target,{get(t,key,self){
    if(key in t)return t[key];
    if(key==='when')return (on,fn)=>on?fn(self):self;
    if(key==='child')return value=>{t.nodes.push(value);return self;};
    if(key==='children')return values=>{t.nodes.push(...values);return self;};
    if(key==='on_mouse_down'||key==='on_mouse_up')return (button,fn)=>{t.handlers[`${key}:${button}`]=fn;return self;};
    if(key==='on_mouse_move')return fn=>{t.handlers[key]=fn;return self;};
    return (...args)=>{t.attrs[key]=args;return self;};
  }});
}
const flat=n=>typeof n==='string'?[n]:[n,...n.nodes.flatMap(flat)];
const has=(nodes,id)=>nodes.find(n=>n.attrs?.id?.[0]===id);

function harness(stored={}){
  const spaces=[{id:'one',name:'First space',active:true,machine:null,folder:'',status:'blocked',tabs:[]},
    {id:'two',name:'Second space',active:false,machine:null,folder:'',status:'done',tabs:[]}];
  const agents=[{space:'one',status:'working'},{space:'one',status:'done'},{space:'one',status:'blocked'},{space:'two',status:'done'}];
  const prefs=new Map([['space.colors',{one:'ansi1',two:'ansi4'}]]),calls=[],sidebar={id:'sidebar',size:{px:300}};
  const cx={notify(){},timer:{every(){throw Error('native check must not start timers');}},spawn(){throw Error('native check must not start processes');}};
  const theme={foreground:'#f2e7e2',background:'#28262b',chrome:'#302c33',selected:'#5a4b5d',hover:'#514854',dim:'#b6a9b8',muted:'#d0c2cc',accent:'#e8b4c4',ansi1:'#d6949c',ansi2:'#a8c5a0',blocked:'#efb5c4'};
  const env={View:class{},div:element,svg:path=>element().svg(path),h_flex:element,v_flex:element,ScrollHandle:{new:()=>({scroll_to_item(){}})},
    agents:()=>agents,spaces:()=>spaces,machines:()=>[],panes:()=>[],theme:()=>theme,window:()=>({active:false}),layout:()=>sidebar,
    shared:key=>prefs.get(key),setShared:(key,value)=>prefs.set(key,value),run:(...args)=>calls.push(args),openOverlay:spec=>calls.push(['openOverlay',spec]),
    exec(){throw Error('unexpected exec');},hc(){throw Error('unexpected hc');},watchFolder(){throw Error('unexpected watch');},checking:()=>true,localStorage:{getItem:key=>stored[key]??null,setItem(){throw Error('unexpected storage write');}}};
  vm.createContext(env);
  const status=readFileSync(new URL('../mods/tinydust-spaces/space-status.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export (function|const) /g,'$1 ');
  const native=readFileSync(new URL('../mods/tinydust-spaces/main.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export (function|const) /g,'$1 ').replace('export default class Spaces','class Spaces');
  vm.runInContext(status+'\n'+native+'\nthis.SpaceList=Spaces;',env);
  const list=new env.SpaceList();list.init(null,cx);
  return {list,cx,spaces,agents,prefs,calls,theme,sidebar,nodes:()=>flat(list.render())};
}

test('named spaces show distinct simultaneous status symbols and honor motion preferences',()=>{
  const h=harness();let nodes=h.nodes(),row=has(nodes,'space-one');
  for(const status of ['blocked','done','working'])assert(has(nodes,`space-sign-name-one-${status}`));
  assert(has(nodes,'space-sign-name-two-done'));assert(!has(nodes,'space-sign-name-two-working'));
  assert(flat(row).includes('!'));assert(flat(row).includes('✓'));assert(flat(row).includes('●'));
  for(const label of ['Needs attention','Finished, not yet seen','Working'])assert(row.attrs.accessibility_label[0].includes(label));
  assert(!has(nodes,'space-sign-name-one-working').attrs.loop);
  h.prefs.set('tinydust.motion',true);nodes=h.nodes();assert.equal(has(nodes,'space-sign-name-one-working').attrs.loop[0],'opacity');
  assert(!has(nodes,'space-sign-name-one-done').attrs.loop);assert(!has(nodes,'space-sign-name-one-blocked').attrs.loop);
  h.prefs.set('tinydust.quiet',true);nodes=h.nodes();assert(!has(nodes,'space-sign-name-one-working').attrs.loop);
  h.agents.find(a=>a.space==='one'&&a.status==='done').status='idle';nodes=h.nodes();
  assert(!has(nodes,'space-sign-name-one-done'));assert(has(nodes,'space-sign-name-two-done'));
  assert(has(nodes,'space-sign-name-one-working'));assert(has(nodes,'space-sign-name-one-blocked'));
});

test('named list retains native selection, reordering, menus and git labels',()=>{
  const h=harness();let nodes=h.nodes(),a=has(nodes,'space-one'),b=has(nodes,'space-two');
  a.handlers['on_mouse_down:left']();a.handlers['on_mouse_up:left']({},h.cx);
  assert.equal(h.calls.at(-1)[0],'space.select');assert.equal(h.calls.at(-1)[1].id,'one');
  a.handlers['on_mouse_down:left']();b.handlers.on_mouse_move({},h.cx);b.handlers['on_mouse_up:left']({},h.cx);
  assert.equal(h.calls.at(-1)[0],'space.move');assert.equal(h.calls.at(-1)[1].id,'one');assert.equal(h.calls.at(-1)[1].index,2);
  a.handlers['on_mouse_down:right']();assert.equal(h.calls.at(-1)[0],'openOverlay');assert.equal(h.calls.at(-1)[1].props.target.id,'one');
  const git={name:'sample-repo',branch:'garden',ahead:2,behind:1};
  const row=h.list.row({w:h.spaces[0],i:0,g:git,tree:null},h.theme),contents=flat(row);
  assert(contents.includes('sample-repo · garden'));assert(contents.includes('↑2'));assert(contents.includes('↓1'));
  h.sidebar.size.px=170;
  const narrow=flat(h.list.row({w:h.spaces[0],i:0,g:git,tree:null},h.theme));
  assert(!narrow.includes('↑2'));assert(!narrow.includes('↓1'));
  assert(narrow.some(n=>n.attrs?.tooltip?.[0]?.includes('sample-repo · garden ↑2 ↓1')),'hidden git details stay available on the space name');
});

test('the adapted list restores existing machine-folding and reconnect state',()=>{
  const h=harness({'machines.folded':'["sample-remote"]','machines.reconnecting':'{"sample-remote":{"busy":true,"removed":true}}'});
  assert(h.list.folded.has('sample-remote'));assert.equal(h.list.reconnecting['sample-remote'].removed,true);
  assert.equal(h.list.reconnecting['sample-remote'].busy,false);
});

test('both space surfaces use the same status rules',()=>{
  const file=name=>readFileSync(new URL(`../mods/${name}/space-status.js`,import.meta.url),'utf8');
  assert.equal(file('tinydust'),file('tinydust-spaces'));
});

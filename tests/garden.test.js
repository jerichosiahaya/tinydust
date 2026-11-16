import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

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
test('live garden filters spaces, focuses the right agent, and respects quiet/motion',()=>{
  let properties={}, order=[], calls=[];
  const preferences=new Map();
  const data=['working','blocked','done','idle','future'].map((status,i)=>({address:'a'+i,space:'here',status,program:{name:'Agent'},tab_name:'Work'}));
  data.push({address:'elsewhere',space:'other',status:'working'});
  const context={View:class{},div:element,image:path=>element().image(path),h_flex:element,v_flex:element,Button:{new:id=>element().id(id)},
    props:()=>properties,theme:()=>new Proxy({},{get:()=> '#aabbcc'}),shared:k=>preferences.get(k),setShared:(k,v)=>preferences.set(k,v),
    agents:()=>data,spaces:()=>[{id:'here',active:true}],setAgentOrder:v=>order=v,run:(...args)=>calls.push(args)};
  vm.createContext(context);
  const source=readFileSync(new URL('../mods/tinydust/main.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export function farmer','function farmer').replace('export default class TinyDust','class TinyDust')+'\nthis.Garden=TinyDust;';
  vm.runInContext(source,context);
  const garden=new context.Garden();garden.init();
  let nodes=flat(garden.render());
  assert.deepEqual(Array.from(order),['a0','a1','a2','a3','a4','elsewhere']);
  assert(!nodes.some(n=>n.attrs?.id?.[0]==='farmer-elsewhere'));
  assert(nodes.some(n=>n==='Status unknown'));
  nodes.find(n=>n.attrs?.id?.[0]==='farmer-a1').attrs.on_click[0]();
  assert.equal(calls[0][0],'agent.focus');assert.equal(calls[0][1].terminal,'a1');
  assert(!nodes.some(n=>n.attrs?.loop));
  preferences.set('tinydust.motion',true);assert(flat(garden.render()).some(n=>n.attrs?.loop));
  preferences.set('tinydust.quiet',true);nodes=flat(garden.render());
  assert(!nodes.some(n=>n.attrs?.loop||n.attrs?.image));
  garden.width=100;nodes=flat(garden.render());assert(!nodes.includes('Farmhands'));
  properties={demo:true};calls=[];nodes=flat(garden.render());
  nodes.find(n=>n.attrs?.id?.[0]==='farmer-sample-1').attrs.on_click[0]();assert.equal(calls.length,0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {EMPTY, decode, addTask, toggleTask, selectNow} from '../mods/tinydust-journal/state.js';

test('storage validates and preserves tasks',()=>{
  assert.deepEqual(decode(null),EMPTY());
  assert.deepEqual(decode(undefined),EMPTY());
  const data=addTask(EMPTY(),'  Write a small test  ','a');
  assert.equal(data.tasks[0].text,'Write a small test');
  assert.deepEqual(decode(JSON.stringify(data)),data);
  for(const value of ['{','null','{}',JSON.stringify({...data,tasks:[data.tasks[0],data.tasks[0]]})]) assert.throws(()=>decode(value));
  assert.throws(()=>addTask(data,'','b'));
  assert.throws(()=>addTask(data,'x'.repeat(241),'b'));
  assert.throws(()=>addTask(data,'another','a'));
});
test('only one Now task, completion releases it, reopening never auto-promotes',()=>{
  let data=addTask(addTask(EMPTY(),'One','a'),'Two','b');
  data=selectNow(data,'a');data=selectNow(data,'b');
  assert.equal(data.now,'b');
  data=toggleTask(data,'b');assert.equal(data.now,null);assert(data.tasks[1].done);
  data=selectNow(data,'b');assert.equal(data.now,null);
  data=toggleTask(data,'b');assert.equal(data.now,null);assert(!data.tasks[1].done);
  assert.equal(decode(JSON.stringify({...data,now:'missing'})).now,null);
});

function ui() {
  const node={nodes:[],attrs:{}};
  return new Proxy(node,{get(t,key,proxy){
    if(key in t)return t[key];
    if(key==='when')return (condition,fn)=>condition?fn(proxy):proxy;
    if(key==='child')return child=>{t.nodes.push(child);return proxy;};
    if(key==='children')return children=>{t.nodes.push(...children);return proxy;};
    return (...args)=>{t.attrs[key]=args;return proxy;};
  }});
}
function input(options={}) {
  return {text:options.value||'',events:{},value(){return this.text;},set_value(text){this.text=text;},on(name,fn){this.events[name]=fn;},focus(){},edit(text,cx){this.text=text;this.events.change?.({},cx);}};
}
const flatten=n=>typeof n==='string'?[n]:[n,...n.nodes.flatMap(flatten)];
function harness({raw=null,demo=false,broken=false}={}) {
  let stored=raw,writeFails=broken,writes=0;
  const shared=new Map();
  const cx={notify(){},focus_handle(){return {focus(){}};}};
  const context={View:class {},div:ui,h_flex:ui,v_flex:ui,
    Button:{new:id=>ui().id(id)},Input:{new:()=>ui()},Textarea:{new:()=>ui()},
    InputState:{new:input},TextareaState:{new:input},
    props:()=>({demo}),checking:()=>true,theme:()=>new Proxy({},{get:()=> '#aabbcc'}),
    shared:key=>shared.get(key),setShared:(key,value)=>shared.set(key,value),
    localStorage:{getItem(){if(demo)throw Error('Demo read personal storage');return stored;},setItem(key,value){if(writeFails)throw Error('Disk full');stored=value;writes++;}},
    EMPTY,decode,addTask,toggleTask,selectNow,
  };
  vm.createContext(context);
  const source=readFileSync(new URL('../mods/tinydust-journal/main.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export default class Journal','class Journal')+'\nthis.Journal=Journal;';
  vm.runInContext(source,context);
  const journal=new context.Journal();journal.init({},cx);
  const click=id=>{
    const node=flatten(journal.render()).find(n=>typeof n!=='string'&&n.attrs.id?.[0]===id);
    assert(node,`Missing button ${id}`);node.attrs.on_click[0]({},cx);
  };
  return {journal,cx,click,shared,storage:()=>stored,writes:()=>writes,failWrites:value=>writeFails=value};
}
test('notes/tasks survive reload; undo completion keeps subsequently added tasks',()=>{
  const h=harness(),j=h.journal;
  j.notes.edit('Remember the next step.\nUnicode: 🌱',h.cx);
  assert(!flatten(j.render()).some(n=>n.attrs?.id?.[0]==='add-task'), 'Task controls start collapsed');
  h.click('show-tasks');
  j.input.set_value('First');h.click('add-task');
  const id=j.data.tasks[0].id;h.click(`now-${id}`);h.click('current-done');
  j.input.set_value('Second');j.input.events.submit({},h.cx);
  h.click('undo');assert.equal(j.data.tasks.length,2);assert.equal(j.data.tasks[0].done,false);
  const reloaded=harness({raw:h.storage()});
  assert.equal(reloaded.journal.notes.value(),j.notes.value());
  assert.equal(reloaded.journal.data.tasks.length,2);
  const nowCard=flatten(j.render()).find(n=>typeof n!=='string'&&n.attrs.id?.[0]==='now-card');
  assert(!flatten(nowCard).includes('Notes'), 'Now card must not enclose the journal');
  h.click('quiet');assert.equal(h.shared.get('tinydust.quiet'),true);
  assert(!flatten(j.render()).some(n=>typeof n!=='string'&&n.attrs.id?.[0]==='add-task'));
});
test('corruption is not overwritten, storage errors retain input, demo never writes',()=>{
  const corrupt=harness({raw:'broken'});assert(corrupt.journal.locked);assert.equal(corrupt.writes(),0);
  assert(corrupt.journal.render());
  const fail=harness({broken:true});fail.click('show-tasks');fail.journal.input.set_value('Keep me');fail.click('add-task');
  assert.equal(fail.journal.input.value(),'Keep me');assert.equal(fail.journal.data.tasks.length,0);assert(!fail.journal.saved);
  fail.journal.notes.edit('Unsaved draft',fail.cx);fail.failWrites(false);fail.click('add-task');
  assert.equal(JSON.parse(fail.storage()).notes,'Unsaved draft');
  const demo=harness({demo:true});demo.journal.notes.edit('Sample only',demo.cx);assert.equal(demo.writes(),0);
  demo.shared.set('tinydust.quiet',true);
  assert(flatten(demo.journal.render()).some(n=>n.attrs?.id?.[0]==='show-tasks'), 'Sample ignores personal Quiet view');
  demo.click('quiet');assert.equal(demo.shared.get('tinydust.quiet'),true);
});

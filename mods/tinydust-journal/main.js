import { View, div } from "gpui-kit";
import { h_flex, v_flex, Button, Input, InputState, Textarea, TextareaState } from "gpui-base";
import { theme, shared, setShared, props, nextCommand, checking } from "herdr";
import { EMPTY, decode, addTask, toggleTask, selectNow } from "./state.js";

const KEY = "journal-v1";
const sample = () => ({version:1,notes:"A place to park a thought.\n\nStart small. The next step is enough.\n\nRemember: review the garden plan before planting.",now:"one",tasks:[
  {id:"one",text:"Plant the first seed",done:false},
  {id:"two",text:"Review the garden plan",done:false},
  {id:"three",text:"Explore a quieter color palette",done:false},
  {id:"four",text:"Make a little room to think",done:true},
]});

export default class Journal extends View {
  init(_props,cx) {
    this.demo = props()?.demo === true;
    this.error = ""; this.locked = false; this.saved = true; this.showDone = false; this.undo = null;
    try { this.data = this.demo ? sample() : decode(localStorage.getItem(KEY)); }
    catch { this.data = EMPTY(); this.locked = true; this.error = "Saved journal could not be read. Original data is untouched. Restore its backup before editing."; }
    this.input = InputState.new({placeholder:"One small next step…"});
    this.notes = TextareaState.new({value:this.data.notes,placeholder:"Park a thought here. You can come back to it.",rows:7});
    this.input.on("submit", (_e,cx) => this.add(cx));
    this.notes.on("change", (_e,cx) => {
      if (!this.locked) this.persist({...this.data,notes:this.notes.value()});
      cx.notify();
    });
    this.focused = "";
    for (const [name,input] of [["task",this.input],["notes",this.notes]]) {
      input.on("focus",(_e,cx)=>{this.focused=name;cx.notify();});
      input.on("blur",(_e,cx)=>{if(this.focused===name)this.focused="";cx.notify();});
    }
    this.handle = cx.focus_handle();
    if (!checking()) cx.spawn(async (cx) => {
      for (;;) { const command=await nextCommand(); if(command==="focus") (shared("tinydust.quiet")?this.notes:this.input).focus(); }
    });
  }
  persist(next) {
    if (this.locked) return false;
    try {
      next={...next,notes:this.notes?.value() ?? next.notes};
      if (!this.demo) localStorage.setItem(KEY,JSON.stringify(next));
      this.data = next; this.error = ""; this.saved = true; return true;
    } catch { this.error="Could not save. Keep this panel open and copy your notes somewhere safe.";this.saved=false;return false; }
  }
  add(cx) {
    if (this.locked) return;
    try {
      const next = addTask(this.data,this.input.value(),`${Date.now()}-${Math.random().toString(36).slice(2,9)}`);
      if (this.persist(next)) this.input.set_value("");
    } catch(error) {this.error=error.message;}
    cx.notify();
  }
  button(id,text,action,primary=false) {
    const t=theme();
    return Button.new(id).accessibility_label(text).h(32).px(10).items_center().rounded(3).text_size(12)
      .bg(primary?t.accent:t.raised).text_color(primary?t.accent_foreground:t.foreground)
      .on_click((_e,cx)=>{action(cx);}).child(text);
  }
  render() {
    const t=theme(), quiet=shared("tinydust.quiet")===true;
    const current=this.data.tasks.find(task=>task.id===this.data.now&&!task.done);
    const later=this.data.tasks.filter(task=>!task.done&&task.id!==this.data.now);
    const done=this.data.tasks.filter(task=>task.done);
    const label=(text)=>div().text_size(12).font_semibold().text_color(t.foreground).child(text);
    const change=(task,cx)=>{ const before={task:{...task},now:this.data.now}; if(this.persist(toggleTask(this.data,task.id)))this.undo=before;cx.notify(); };
    const row=(task)=>v_flex().mb(8).gap(5)
      .child(div().text_size(13).text_color(task.done?t.muted:t.foreground).child(task.text))
      .child(h_flex().gap(6)
        .child(this.button(`done-${task.id}`,task.done?"Reopen":"Done",cx=>change(task,cx)))
        .when(!task.done,e=>e.child(this.button(`now-${task.id}`,"Do now",cx=>{this.persist(selectNow(this.data,task.id));cx.notify();}))));
    return v_flex().id("journal-root").track_focus(this.handle).size_full().min_h(0).bg(t.chrome).text_color(t.foreground)
      .on_key_down((e,cx)=>{if(e.key==="escape"){this.handle.focus();cx.stop_propagation();}})
      .child(h_flex().h(48).px(16).items_center().justify_between().flex_none()
        .child(div().text_size(16).font_semibold().child("Field journal"))
        .child(this.button("quiet",quiet?"Show more":"Quiet view",()=>setShared("tinydust.quiet",!quiet))))
      .child(v_flex().id("journal-scroll").flex_1().min_h(0).overflow_y_scrollbar().px(16).pb(18).gap(12)
        .child(div().text_size(11).text_color(t.muted).child(this.demo?"Sample journal · not your personal data":"Private to this device · saved locally"))
        .when(Boolean(this.error),e=>e.child(div().p(10).bg(t.surface).text_size(12).text_color(t.blocked).child(this.error)))
        .when(!this.locked,e=>e
          .child(v_flex().id("now-card").p(14).gap(10).bg(t.surface).border(1).border_color(t.accent).rounded(3)
            .child(label("Now · just one thing"))
            .child(div().text_size(16).child(current?.text || "Choose one small step."))
            .when(Boolean(current),e=>e.child(h_flex().gap(6)
              .child(this.button("current-done","Mark done",cx=>change(current,cx),true))
              .child(this.button("current-later","Later",cx=>{this.persist(selectNow(this.data,null));cx.notify();})))))
          .when(Boolean(this.undo),e=>e.child(this.button("undo","Undo last completion",cx=>{
            const tasks=this.data.tasks.map(task=>task.id===this.undo.task.id?this.undo.task:task);
            const now=this.data.now || (this.undo.now===this.undo.task.id&&!this.undo.task.done?this.undo.now:null);
            if(this.persist({...this.data,tasks,now}))this.undo=null;cx.notify();
          })))
          .when(!quiet,e=>e
            .child(label("Next steps"))
            .child(Input.new(this.input).accessibility_label("New task").h(36).px(9).text_size(13).bg(t.background).border(1).border_color(this.focused==="task"?t.accent:t.input).rounded(3))
            .child(h_flex().justify_between().items_center()
              .child(div().text_size(11).text_color(t.muted).child("Enter to add"))
              .child(this.button("add-task","Add step",cx=>this.add(cx))))
            .when(!later.length,e=>e.child(div().text_size(12).text_color(t.muted).child("Nothing waiting. Leave some breathing room.")))
            .children(later.map(row)))
          .child(h_flex().justify_between().items_center().child(label("Scratchpad"))
            .child(div().text_size(10.5).text_color(t.muted).child(this.demo?"Sample only":this.saved?"Saved on this device":"Not saved")))
          .child(Textarea.new(this.notes).accessibility_label("Scratchpad notes").h(180).p(10).text_size(13).bg(t.background).text_color(t.foreground)
            .border(1).border_color(this.focused==="notes"?t.accent:t.input).rounded(3))
          .when(!quiet&&done.length>0,e=>e
            .child(this.button("show-completed",`${this.showDone?"Hide":"Show"} completed (${done.length})`,cx=>{this.showDone=!this.showDone;cx.notify();}))
            .when(this.showDone,e=>e.children(done.map(row))))
          .child(div().text_size(11).text_color(t.muted).child("No streaks. No overdue badges. Come back when you’re ready."))));
  }
}

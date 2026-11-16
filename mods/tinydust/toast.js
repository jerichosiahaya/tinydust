import {div,image} from "gpui-kit";
import {h_flex,v_flex,Button} from "gpui-base";
import {run,closeOverlay} from "herdr";
import {characterFor} from "./game.js";

// Skin Herdr's existing notification instead of observing status and posting twice.
export function toastView(p,t) {
  const target=p.action?.args?.terminal;
  const agent=typeof target==="string"&&["agent.focus","terminal.show","pane.focus"].includes(p.action?.name);
  // Herdr 0.1.16 emits completion as info + "<name> finished", not success.
  const done=agent&&(p.level==="success"||(p.level==="info"&&/\bfinished$/.test(p.title||"")));
  const color=p.level==="error"?t.blocked:done||p.level==="success"?t.done:t.accent;
  const open=()=>{
    closeOverlay(p.overlay);
    if(p.action?.name)run(p.action.name,p.action.args??{});
  };
  return h_flex().size_full().items_center().gap(10).px(12).bg(t.popover)
    .child(Button.new("notice-open").accessibility_label(`${p.title||"Notification"} ${p.body||""}`).tooltip(p.body||p.title||"Notification").flex_1().min_w(0).h_full().items_center().gap(10).on_click(open)
      .when(agent,e=>e.child(image(`mods/tinydust/${characterFor(target)[0]}${done?"-cheer":""}.svg`).w(40).h(48).flex_none()))
      .when(!agent,e=>e.child(p.icon?image(p.icon).w(22).h(22).flex_none():div().w(7).h(28).bg(color).flex_none()))
      .child(v_flex().flex_1().min_w(0).gap(3)
        .child(div().text_size(13).font_semibold().text_color(color).truncate().child(p.title||"TinyDust"))
        .when(Boolean(p.body),e=>e.child(div().text_size(11.5).text_color(t.foreground).truncate().child(p.body)))
        .when(done,e=>e.child(div().text_size(10.5).text_color(t.muted).child("Harvest ready · click to visit")))))
    .child(Button.new("notice-close").accessibility_label("Dismiss notification").w(26).h(30).text_color(t.muted).on_click(()=>closeOverlay(p.overlay)).child("×"));
}

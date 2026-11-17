import {div,image} from "gpui-kit";
import {h_flex,Button} from "gpui-base";

// Decorative only: pane headers and terminal hit targets remain untouched.
export function workbench(t,width) {
  return h_flex().id("workbench-trim").size_full().min_w(0).px(4).gap(8).items_center()
    .child(image("mods/tinydust/workbench-sprout.svg").w(24).h(24).flex_none())
    .child(div().min_w(0).truncate().text_size(11).font_semibold().text_color(t.foreground).child("The workbench"))
    .when(width>=200,e=>e.child(div().flex_1().min_w(0).h(1).bg(t.border))
      .child(div().w(4).h(4).flex_none().bg(t.working))
      .child(div().w(4).h(4).flex_none().bg(t.accent))
      .child(div().w(4).h(4).flex_none().bg(t.done)));
}

export function workbenchBar(t,width,onUsage,onBoard=()=>{}) {
  return h_flex().id("workbench-bar").size_full().min_w(0).gap(6).items_center()
    .when(width>=200,e=>e.child(div().flex_1().min_w(0).h_full().child(workbench(t,Math.max(0,width-132)))))
    .when(width<200,e=>e.child(div().flex_1()))
    .when(width>=80,e=>e.child(Button.new("noticeboard-open").accessibility_label("Open farm noticeboard").tooltip("Open farm noticeboard").h(26).px(width<130?7:9).flex_none().items_center().rounded(3)
      .bg(t.raised).text_color(t.foreground).text_size(11).on_click(onBoard).child(width<130?"!":"Board")))
    .child(Button.new("usage-open").accessibility_label("Open usage").tooltip("Open usage").h(26).px(9).flex_none().items_center().rounded(3)
      .bg(t.raised).text_color(t.foreground).text_size(11).on_click(onUsage).child("Usage"));
}

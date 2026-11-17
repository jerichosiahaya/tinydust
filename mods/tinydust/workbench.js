import {div,image} from "gpui-kit";
import {h_flex} from "gpui-base";

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

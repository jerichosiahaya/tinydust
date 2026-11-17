import {div,image} from "gpui-kit";
import {h_flex,v_flex,Button} from "gpui-base";
import {COMPANIONS} from "./farm-style.js";

const DECORATIONS=[["flowers","Flower patches","flowers"],["fence","Fence bunting","garland"],["pond","Pond lily pads","lily"]];

export function farmStyleView(style,t,{choose,close,error="",locked=false,demo=false}) {
  return v_flex().id("farm-style").size_full().min_h(0).bg(t.chrome).text_color(t.foreground)
    .child(h_flex().h(48).px(16).gap(10).items_center().flex_none()
      .child(div().flex_1().min_w(0).truncate().tooltip("Make this farm yours").text_size(16).font_semibold().child("Make this farm yours"))
      .child(Button.new("farm-style-close").accessibility_label("Close farm appearance").h(30).px(9).items_center().rounded(3)
        .bg(t.raised).text_color(t.foreground).text_size(11).on_click(close).child("Done")))
    .child(v_flex().id("farm-style-scroll").flex_1().min_h(0).px(16).pb(16).gap(8).overflow_y_scrollbar()
      .child(div().text_size(11).text_color(t.muted).child(demo?"Sample choices only · nothing is saved":"Choices are saved for this space. Change them whenever you like."))
      .when(Boolean(error),e=>e.child(div().p(8).rounded(3).bg(t.surface).text_size(11).text_color(t.blocked).child(error)))
      .child(div().pt(5).text_size(13).font_semibold().child("A little companion"))
      .child(div().text_size(11).text_color(t.muted).child("A friend on the farm—not another agent. Click them for a hello."))
      .children(Object.entries(COMPANIONS).map(([kind,name])=>{
        const selected=style.companion===kind;
        return Button.new(`farm-companion-${kind}`).accessibility_label(`${name}${selected?", selected":""}`).disabled(locked)
          .h(40).w_full().px(8).gap(10).items_center().rounded(3).bg(selected?t.selected:t.surface).border(1).border_color(selected?t.accent:t.border)
          .on_click((_e,cx)=>choose("companion",kind,cx))
          .child(kind==="none"?div().w(28).h(24).flex_none():image(`mods/tinydust/companion-${kind}.svg`).w(28).h(24).flex_none())
          .child(div().flex_1().min_w(0).truncate().text_size(12).child(name))
          .when(selected,e=>e.child(div().flex_none().text_size(13).text_color(t.foreground).child("✓")));
      }))
      .child(div().pt(8).text_size(13).font_semibold().child("Garden details"))
      .child(div().text_size(11).text_color(t.muted).child("All are yours to use, with no points or unlocks."))
      .children(DECORATIONS.map(([key,name,art])=>Button.new(`farm-decor-${key}`)
        .accessibility_label(`${name}, ${style[key]?"on":"off"}`).disabled(locked).h(38).w_full().px(8).gap(10).items_center().rounded(3)
        .bg(style[key]?t.selected:t.surface).border(1).border_color(style[key]?t.accent:t.border)
        .on_click((_e,cx)=>choose(key,!style[key],cx))
        .child(image(`mods/tinydust/decor-${art}.svg`).w(28).h(17).flex_none())
        .child(div().flex_1().min_w(0).truncate().text_size(12).child(name))
        .child(div().flex_none().text_size(11).text_color(t.foreground).child(style[key]?"✓ On":"Off")))));
}

// Screenshot-only content. Never installed by scripts/install.py.
import {View,div,image} from "gpui-kit";
import {v_flex,h_flex} from "gpui-base";
import {props,theme} from "herdr";
export default class Preview extends View {
  render() {
    const t=theme(), role=props()?.role;
    if(role==='spaces')return v_flex().size_full().p(12).gap(9)
      .child(div().text_size(11).text_color(t.muted).child('Spaces · sample workspace'))
      .child(div().p(9).rounded(3).bg(t.selected).text_size(13).child('Sunrise farm'));
    if(role==='tabs')return h_flex().size_full().items_center().px(14).gap(14)
      .child(div().text_size(13).font_semibold().text_color(t.accent).child('Welcome to TinyDust'))
      .child(div().flex_1()).child(div().text_size(11).text_color(t.muted).child('Herdr layout · sample-data preview'));
    if(role==='footer')return div().p(12).text_size(11).text_color(t.muted).child('A little space to think.');
    if(role==='status')return div().px(14).py(5).text_size(11).text_color(t.muted).child('TinyDust / one small step at a time / motion off');
    return v_flex().size_full().bg(t.background).p(32).gap(20)
      .child(div().text_size(12).text_color(t.accent).child('TINYDUST / FIELD NOTES'))
      .child(div().text_size(30).font_semibold().child('A little room to focus.'))
      .child(div().text_size(15).text_color(t.muted).child('Your agents in the garden. Your next step close at hand.'))
      .child(image('mods/tinydust/farm.svg').w(480).h(336).flex_none())
      .child(div().text_size(17).font_semibold().child('Start small. Leave room for later.'))
      .child(div().text_size(14).text_color(t.muted).child('01   Choose one task for Now.'))
      .child(div().text_size(14).text_color(t.muted).child('02   Park stray thoughts in your scratchpad.'))
      .child(div().text_size(14).text_color(t.muted).child('03   Use Quiet view when you want less on screen.'))
      .child(div().flex_1())
      .child(div().text_size(11).text_color(t.muted).child('Screenshot-only welcome panel. Your normal layout shows live terminals here.'));
  }
}

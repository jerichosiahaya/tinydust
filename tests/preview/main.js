// Screenshot-only chrome. Never installed by scripts/install.py.
import {View,div} from "gpui-kit";
import {v_flex,h_flex} from "gpui-base";
import {props,theme} from "herdr";
export default class Preview extends View {
  render() {
    const t=theme(),role=props()?.role;
    if(role==='spaces')return v_flex().size_full().p(12).gap(9)
      .child(div().text_size(11).text_color(t.muted).child('Spaces · sample workspace'))
      .child(div().p(9).rounded(3).bg(t.selected).text_size(13).child('Sunrise farm'));
    if(role==='tabs')return h_flex().size_full().items_center().px(14).gap(14)
      .child(div().text_size(13).font_semibold().text_color(t.accent).child('TinyDust · farm visit'))
      .child(div().flex_1()).child(div().text_size(11).text_color(t.muted).child('Herdr layout · sample-data preview'));
    if(role==='footer')return div().p(12).text_size(11).text_color(t.muted).child('A little space to think.');
    return div().px(14).py(5).text_size(11).text_color(t.muted).child('TinyDust / one small step at a time / sample data');
  }
}

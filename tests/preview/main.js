// Screenshot-only chrome. Never installed by scripts/install.py.
import {View,div} from "gpui-kit";
import {v_flex,h_flex} from "gpui-base";
import {props,theme} from "herdr";
import {workbench} from "./workbench.js";
export default class Preview extends View {
  init(){this.width=300;}
  render() {
    const t=theme(),role=props()?.role;
    if(role==='spaces')return v_flex().size_full().p(12).gap(9)
      .child(div().text_size(11).text_color(t.muted).child('Spaces · sample workspace'))
      .child(div().p(9).rounded(3).bg(t.selected).text_size(13).child('Sunrise farm'));
    if(role==='workbench')return workbench(t,this.width).on_size_change((size,cx)=>{if(size.width!==this.width){this.width=size.width;cx.notify();}});
    if(role==='terminal')return v_flex().size_full().min_w(0).min_h(0).rounded(6).border(2).border_color(t.accent).bg(t.background).overflow_hidden()
      .child(h_flex().h(30).px(10).gap(8).items_center().flex_none().border_b(1).border_color(t.border)
        .child(div().text_size(12).font_semibold().child('Sample shell'))
        .child(div().flex_1().min_w(0).truncate().text_size(12).text_color(t.dim).child('~/sample-garden')))
      .child(v_flex().p(14).gap(7).font_family('JetBrains Mono').text_size(14).text_color(t.foreground)
        .child(div().text_color(t.muted).child('# Sample terminal · no live output'))
        .child(div().child('$ cd little-garden'))
        .child(div().child('$ cat notes.txt'))
        .child(div().text_color(t.working).child('One small step is enough.'))
        .child(div().child('$ ▌')));
    if(role==='tabs')return h_flex().size_full().items_center().px(14).gap(14)
      .child(div().text_size(13).font_semibold().text_color(t.accent).child(props()?.terminal?'TinyDust · sample terminal':'TinyDust · farm visit'))
      .child(div().flex_1()).child(div().text_size(11).text_color(t.muted).child('Herdr layout · sample-data preview'));
    if(role==='footer')return div().p(12).text_size(11).text_color(t.muted).child('A little space to think.');
    return div().px(14).py(5).text_size(11).text_color(t.muted).child('TinyDust / one small step at a time / sample data');
  }
}

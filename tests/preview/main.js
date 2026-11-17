// Screenshot-only chrome. Never installed by scripts/install.py.
import {View,div} from "gpui-kit";
import {v_flex,h_flex} from "gpui-base";
import {props,theme} from "herdr";
import {workbenchBar} from "./workbench.js";
import {paneHeader} from "./pane-ui.js";
import {spaceStatuses,statusMarks} from "./space-status.js";
export default class Preview extends View {
  init(){this.width=300;}
  render() {
    const t=theme(),role=props()?.role;
    const sampleStates=spaceStatuses([{space:'sample-a',status:'working'},{space:'sample-a',status:'blocked'},{space:'sample-a',status:'done'},{space:'sample-c',status:'done'}]);
    const measure=(size,cx)=>{if(size.width!==this.width){this.width=size.width;cx.notify();}};
    if(role==='spaces')return v_flex().size_full().gap(2).on_size_change(measure)
      .when(this.width>=160,e=>e.px(8)
        .child(div().h(29).px(4).flex().items_center().text_size(11).text_color(t.muted).child('Spaces · sample'))
        .children([['sample-a','Sunrise farm','#d9649a',true],['sample-b','Garden studio','#22a99a',false],['sample-c','Meadow notes','#5b8def',false]].map(([id,name,color,active])=>
          h_flex().h(28).px(6).gap(8).items_center().rounded(4).when(active,el=>el.bg(t.selected))
            .child(div().w(18).h(18).rounded(4).bg(color).flex().items_center().justify_center().text_size(10).text_color('#ffffff').child(name[0]))
            .child(div().min_w(0).truncate().text_size(12).text_color(t.foreground).child(name))
            .when(Boolean(sampleStates.get(id)?.size),el=>el.child(statusMarks(id,sampleStates.get(id),t,false))))))
      .when(this.width<160,e=>e.items_center().child(div().h(29).flex().items_center().text_color(t.muted).child('+'))
        .children(['1','2','3'].map((name,i)=>div().w(32).h(26).flex().items_center().justify_center().rounded(4)
          .when(i===0,el=>el.bg(t.selected)).text_size(12).text_color(t.foreground).child(name))));
    if(role==='workbench')return workbenchBar(t,this.width,()=>{},()=>{}).on_size_change((size,cx)=>{if(size.width!==this.width){this.width=size.width;cx.notify();}});
    if(role==='terminal'){
      const target={pane:'sample-pane-1',terminal:'sample-1'},labels={version:1,labels:[{...target,name:'Plant the first seed'}]};
      const pane={...target,title:'Sample shell',cwd:'~/sample-garden',program:{name:'Sample shell',shell:true},status:'idle'};
      return v_flex().size_full().min_w(0).min_h(0).rounded(6).border(2).border_color(t.accent).bg(t.background).overflow_hidden()
      .child(div().h(30).flex_none().child(paneHeader({...target,demo:true},labels,t,false,()=>{},()=>{},pane)))
      .child(v_flex().p(14).gap(7).font_family('JetBrains Mono').text_size(14).text_color(t.foreground)
        .child(div().text_color(t.muted).child('# Sample terminal · no live output'))
        .child(div().child('$ cd little-garden'))
        .child(div().child('$ cat notes.txt'))
        .child(div().text_color(t.working).child('One small step is enough.'))
        .child(div().child('$ ▌')));
    }
    if(role==='tabs')return h_flex().size_full().items_center().px(14).gap(14)
      .child(div().text_size(13).font_semibold().text_color(t.accent).child(props()?.terminal?'TinyDust · sample terminal':'TinyDust · farm visit'))
      .child(div().flex_1()).child(div().text_size(11).text_color(t.muted).child('Herdr layout · sample-data preview'));
    if(role==='footer')return v_flex().size_full().on_size_change(measure)
      .when(this.width>=160,e=>e.child(div().p(12).text_size(11).text_color(t.muted).child('A little space to think.')))
      .when(this.width<160,e=>e.items_center().text_color(t.muted).child(div().h(28).child('⚙')).child(div().h(28).child('+')));
    return div().px(14).py(5).text_size(11).text_color(t.muted).child('TinyDust / one small step at a time / sample data');
  }
}

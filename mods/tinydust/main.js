import {View,div} from "gpui-kit";
import {h_flex,v_flex,Button} from "gpui-base";
import {agents,spaces,run,setAgentOrder,shared,setShared,props,theme,openOverlay,closeOverlay} from "herdr";
import {STATES,UNKNOWN,characterFor,scenePage,grove} from "./game.js";
import {actor,farmScene} from "./scene.js";
import {toastView} from "./toast.js";
import {creationTarget,creationMenu} from "./creation.js";

const SAMPLE=[
  {address:"sample-1",space:"sample",program:{name:"Builder"},tab_name:"Plant the first seed",status:"working"},
  {address:"sample-2",space:"sample",program:{name:"Reviewer"},tab_name:"Review the garden plan",status:"blocked"},
  {address:"sample-3",space:"sample",program:{name:"Explorer"},tab_name:"A small task, finished",status:"done"},
  {address:"sample-4",space:"sample",program:{name:"Writer"},tab_name:"Taking a little breather",status:"idle"},
  {address:"sample-5",space:"sample",program:{name:"Helper"},tab_name:"Looking after seedlings",status:"working"},
];
const button=(id,text,action)=>Button.new(id).accessibility_label(text).h(30).px(9).items_center().rounded(3)
  .bg(theme().raised).text_color(theme().foreground).text_size(11).on_click(action).child(text);

export default class TinyDust extends View {
  init(_p,cx) {
    if(props()?.role==="create-menu"){this.menuHandle=cx.focus_handle();this.menuHandle.focus();}
    this.width=props()?.role==="world"?880:300;this.height=600;this.page=0;
    this.demoMotion=false;this.demoSelected=null;this.lastFocused=null;
    this.shaken=null;this.treeTask=null;this.treeMessage="";
  }
  focus(a,cx) {
    if(props()?.demo){this.demoSelected=a.address;cx?.notify();return;}
    if(props()?.overlay)closeOverlay(props().overlay);
    run("agent.focus",{terminal:a.address});
  }
  touchTree(a,cx,motion) {
    this.treeMessage=`A tree for ${a.program?.name||"this agent"} · ${characterFor(a.address)[1]}`;
    this.treeTask?.cancel();this.treeTask=null;
    this.shaken=motion?a.address:null;
    if(motion)this.treeTask=cx.timer.after(1000,cx=>{this.shaken=null;this.treeTask=null;cx.notify();});
    cx.notify();
  }
  render() {
    const p=props()??{},demo=p.demo===true,expanded=p.role==="world",t=theme();
    if(p.role==="create-menu")return creationMenu(p,t).when(Boolean(this.menuHandle),e=>e.track_focus(this.menuHandle));
    if(p.overlay&&typeof p.title==="string")return toastView(p,t);
    const quiet=!demo&&shared("tinydust.quiet")===true;
    const motion=(demo?this.demoMotion:shared("tinydust.motion")===true)&&!quiet;
    const measure=(size,cx)=>{if(size.width!==this.width||size.height!==this.height){this.width=size.width;this.height=size.height;cx.notify();}};
    if(p.role==="brand")return h_flex().id("tinydust-brand").size_full().items_center().px(6).gap(6).on_size_change(measure)
      .when(this.width>=160,e=>e.child(div().text_size(17).font_bold().text_color(t.accent).child(this.width<240?"TD":"TinyDust")).child(div().flex_1()))
      .child(button("create-open",this.width>=160?"+ New":"+",()=>openOverlay({
        mod:"tinydust",kind:"popup",width:280,height:196,
        props:{role:"create-menu",target:demo?{}:creationTarget(),...(demo?{demo:true}:{})},
      })).accessibility_label("New tab, space, or terminal").tooltip("New tab, space, or terminal")
        .on_mouse_down("left",(_e,cx)=>cx.stop_propagation()))
      .when(this.width>=220,e=>e.child(button("journal-toggle","Journal",()=>run("layout.toggle",{id:"journal"}))));
    const all=demo?SAMPLE.map(a=>({...a,focused:a.address===this.demoSelected})):agents();
    const space=demo?{id:"sample",name:"Sunrise farm"}:spaces().find(s=>s.active);
    const list=all.filter(a=>a.space===space?.id);
    if(!demo&&!expanded)setAgentOrder([...list,...all.filter(a=>a.space!==space?.id)].map(a=>a.address));
    const narrow=this.width<240, capacity=expanded||this.height>=650?6:3;
    const focusIndex=list.findIndex(a=>a.focused);
    if(focusIndex>=0&&list[focusIndex].address!==this.lastFocused){this.lastFocused=list[focusIndex].address;this.page=Math.floor(focusIndex/capacity);}
    const page=scenePage(list,this.page,capacity),trees=grove(list);
    this.page=page.page;
    const garden=()=>farmScene(list,page.agents,{width:this.width,motion,expanded,shaken:this.shaken,
      onTree:(a,cx)=>this.touchTree(a,cx,motion),onAgent:(a,cx)=>this.focus(a,cx)});
    const controls=()=>h_flex().h(34).px(8).gap(6).items_center().flex_none()
      .child(button("motion",quiet?"Resume game":motion?"Motion on":"Motion off",(_e,cx)=>{
        if(demo){this.demoMotion=!motion;cx.notify();}else {if(quiet)setShared("tinydust.quiet",false);setShared("tinydust.motion",!motion);}
      }))
      .when(!expanded,e=>e.child(button("visit-farm","Visit farm",()=>openOverlay({mod:"tinydust",kind:"dialog",width:940,height:720,props:{role:"world",...(demo?{demo:true}:{})}}))))
      .when(expanded&&Boolean(p.overlay),e=>e.child(button("leave-farm","Back to work",()=>closeOverlay(p.overlay))))
      .child(div().flex_1())
      .when(expanded&&!demo,e=>e.child(button("alert-settings","Alert settings",()=>run("app.settings",{section:"alerts"}))));
    const pager=()=>h_flex().h(32).px(8).gap(5).items_center().flex_none()
      .child(div().flex_1().text_size(10.5).text_color(t.muted).child(`${page.page+1} / ${page.pages} · ${list.length} farmhands`))
      .when(page.pages>1,e=>e
        .child(button("previous-field","Previous",(_e,cx)=>{this.page=(page.page-1+page.pages)%page.pages;cx.notify();}))
        .child(button("next-field","Next",(_e,cx)=>{this.page=(page.page+1)%page.pages;cx.notify();})));
    return v_flex().id("garden-root").size_full().min_h(0).bg(t.chrome).text_color(t.foreground).on_size_change(measure)
      .when(!narrow,e=>e
        .child(h_flex().h(30).px(12).items_center().justify_between().flex_none()
          .child(div().text_size(expanded?16:12).font_semibold().child(expanded?"Your little corner · farm visit":"Your little corner"))
          .when(expanded&&demo,e=>e.child(div().text_size(11).text_color(t.muted).child("Sample farm · no live agents"))))
        .child(controls())
        .child(div().h(25).px(12).flex_none().text_size(11).text_color(t.muted)
          .tooltip("One tree per currently working agent in this space; up to 24 trees drawn. This is activity, not a productivity score.")
          .child(`${trees.count} working · ${trees.count} ${trees.count===1?"tree":"trees"}${trees.count>trees.visible.length?` (${trees.visible.length} shown)`:""}`)))
      .when(expanded,e=>e.child(v_flex().id("farm-visit-scroll").flex_1().min_h(0).items_center().overflow_y_scrollbar().child(garden())))
      .when(!expanded&&!narrow&&!quiet&&this.height>500,e=>e.child(garden()))
      .when(!narrow&&(expanded||(!quiet&&this.height>500)),e=>e.child(pager()))
      .when(!narrow&&Boolean(this.treeMessage),e=>e.child(div().px(10).py(4).text_size(10.5).text_color(t.muted).truncate().tooltip(this.treeMessage).child(this.treeMessage)))
      .when(!expanded,e=>e.child(v_flex().id("farmhands").flex_1().min_h(0).overflow_y_scrollbar()
        .when(!list.length,e=>e.child(div().p(12).text_size(12).text_color(t.muted).child(narrow?"–":"Start an agent in this space. Its character will join the farm.")))
        .children(list.map(a=>{
          const state=STATES[a.status]??UNKNOWN,name=a.program?.name||a.app||"Agent";
          return Button.new(`farmer-${a.address}`).accessibility_label(`${name}, ${state.label}, focus agent`).mx(narrow?4:8).mb(5).h(narrow?36:52).flex_none().px(6)
            .items_center().gap(8).rounded(3).bg(a.focused?t.selected:t.surface)
            .border(1).border_color(a.focused?t.accent:t.border)
            .tooltip(`${name} · ${characterFor(a.address)[1]} · ${state.label} · ${a.address}`)
            .on_click((_e,cx)=>this.focus(a,cx))
            .when(narrow,e=>e.child(div().text_color(state.color).child(state.symbol)))
            .when(!narrow,e=>e.child(actor(a.address,a.status,false,32)).child(v_flex().flex_1().min_w(0).gap(3)
              .child(div().text_size(12).font_semibold().truncate().child(name))
              .child(div().text_size(10.5).text_color(state.color).truncate().child(state.label))));
        }))));
  }
}

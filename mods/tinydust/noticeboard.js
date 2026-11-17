import {div,image} from "gpui-kit";
import {h_flex,v_flex,Button} from "gpui-base";
import {actor} from "./scene.js";
import {paneLabel} from "./labels.js";

const GROUPS=[{status:"blocked",symbol:"!",title:"Needs a hand",label:"Needs attention"},
  {status:"done",symbol:"✓",title:"Finished, not yet seen",label:"Finished, not yet seen"}];

export function noticeboardView(all,spaces,labels,t,{focus,close,error="",demo=false,selected=null}) {
  const bySpace=new Map(spaces.map(space=>[space.id,space]));
  const groups=GROUPS.map(group=>({...group,items:all.filter(a=>a.status===group.status&&typeof a.address==="string"&&a.address&&typeof a.space==="string"&&a.space)}));
  return v_flex().id("noticeboard").size_full().min_h(0).bg(t.chrome).text_color(t.foreground)
    .child(h_flex().h(52).px(16).gap(10).items_center().flex_none()
      .child(image("mods/tinydust/noticeboard.svg").w(30).h(30).flex_none())
      .child(div().flex_1().min_w(0).truncate().tooltip("Farm noticeboard").text_size(16).font_semibold().child("Farm noticeboard"))
      .child(Button.new("noticeboard-close").accessibility_label("Close noticeboard").h(30).px(9).items_center().rounded(3)
        .bg(t.raised).text_color(t.foreground).text_size(11).on_click(close).child("Close")))
    .child(v_flex().id("noticeboard-scroll").flex_1().min_h(0).px(16).pb(16).gap(10).overflow_y_scrollbar()
      .child(div().text_size(11).text_color(t.muted).child(demo?"Sample agents · no live actions":"A little place to check in across your spaces."))
      .when(Boolean(error),e=>e.child(div().p(8).rounded(3).bg(t.surface).text_size(11).text_color(t.blocked).child(error)))
      .when(Boolean(selected),e=>e.child(div().text_size(11).text_color(t.muted).child("Sample selected · no agent was focused.")))
      .when(groups.every(group=>!group.items.length),e=>e.child(div().py(14).text_size(12).text_color(t.muted)
        .child("Nothing needs attention or is waiting to be seen right now.")))
      .children(groups.filter(group=>group.items.length).map(group=>v_flex().gap(5)
        .child(h_flex().gap(7).items_center().pt(5)
          .child(div().w(18).flex_none().text_size(13).font_bold().text_color(t.foreground).child(group.symbol))
          .child(div().text_size(12).font_semibold().child(group.title)))
        .children(group.items.map(a=>{
          const space=bySpace.get(a.space),name=paneLabel(labels,{pane:a.pane,terminal:a.address})||a.program?.name||a.app||"Agent";
          const place=space?.name||a.space_name||"Other space",machine=space?.machine?` · ${space.machine}`:"";
          const detail=`${place}${machine}${a.tab_name&&a.tab_name!==name?` · ${a.tab_name}`:""}`,target={address:a.address,space:a.space};
          return Button.new(`noticeboard-agent-${a.address}`).accessibility_label(`${name}, ${group.label}, ${detail}; focus agent`)
            .tooltip(`${name} · ${group.label} · ${detail} · ${a.address}`)
            .w_full().h(52).px(8).gap(9).items_center().rounded(3).bg(t.surface).border(1).border_color(t.border)
            .on_click((_e,cx)=>focus(target,cx))
            .child(actor(a.address,a.status,false,28))
            .child(v_flex().flex_1().min_w(0).gap(3)
              .child(div().truncate().text_size(12).font_semibold().child(name))
              .child(div().truncate().text_size(11).text_color(t.muted).child(detail)))
            .child(div().flex_none().text_size(14).text_color(t.foreground).child("›"));
        }))))
      .child(div().pt(5).text_size(10.5).text_color(t.dim).child("Finished means the agent completed while you weren't looking. Herdr handles notifications.")));
}

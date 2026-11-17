// Pane-header behavior adapted from herdrdev/herdr-app v0.1.16 (Apache-2.0).
// TinyDust adds labels, menu routing and accessible controls; see HERDR-PANE-LICENSE.txt.
import {div,svg,image} from "gpui-kit";
import {h_flex,v_flex,Button} from "gpui-base";
import {panes,run,home,layout} from "herdr";
import {paneLabel} from "./labels.js";

function frame(node) {
  if(!node||node.hidden)return null;
  if(node.content?.tab&&node.content.pane)return node.content.pane;
  let children=node.children??[];
  if(node.type==="stack"){
    const shown=children.filter(child=>!child.hidden);
    children=[shown.find(child=>child.id===node.active)??shown[0]];
  }
  for(const child of children){const found=frame(child);if(found)return found;}
  return null;
}
function folder(cwd) {
  if(!cwd)return "";
  const base=home();return cwd===base?"~":cwd.startsWith(base+"/")?"~"+cwd.slice(base.length):cwd;
}
function action(t,pane,id,label,icon,command,args,demo) {
  return Button.new(`pane-${id}-${pane}`).accessibility_label(label).tooltip(label).w(22).h(22).flex_none().items_center().justify_center().rounded(4)
    .text_color(t.dim).hover(s=>s.bg(t.hover).text_color(t.foreground))
    .on_click((_e,cx)=>{cx.stop_propagation();if(!demo)run(command,{pane,...args});})
    .child(svg(`mods/pane/${icon}.svg`).size(14));
}
export function paneHeader(p,labels,t,hovered,onHover,onMenu,samplePane=null) {
  const pane=samplePane??panes().find(item=>item.pane===p.pane);
  if(!pane)return div();
  const target={pane:pane.pane,terminal:pane.terminal};
  const program=pane.program??{},native=((program.agent||program.shell)&&program.name)||pane.title||program.name||pane.mod||"shell";
  const name=paneLabel(labels,target)||native,icon=program.icon?(program.tint?svg(program.icon).size(14).flex_none().text_color(t.dim):image(program.icon).w(14).h(14).flex_none()):null;
  const bottom=frame(layout())?.header?.position==="bottom";
  return h_flex().id(`pane-head-${pane.pane}`).size_full().min_w(0).px(10).gap(8).items_center().bg(t.background)
    .when(bottom,e=>e.border_t(1)).when(!bottom,e=>e.border_b(1)).border_color(t.border).text_size(12)
    .on_hover(onHover).on_click(()=>{if(!p.demo)run("pane.focus",{pane:pane.pane});})
    .on_mouse_down("right",(_e,cx)=>{if(!p.demo&&target.terminal){cx.stop_propagation();onMenu(target);}})
    .when(Boolean(icon),e=>e.child(icon))
    .child(div().flex_initial().min_w(0).max_w(260).truncate().font_medium().text_color(t.foreground).tooltip(name).child(name))
    .child(div().flex_1().min_w(0).truncate().text_color(t.dim).child(folder(pane.cwd)))
    .when(pane.status==="working",e=>e.child(svg("mods/workspace-chrome/spinner.svg").size(12).flex_none().text_color(t.working).spin(900)))
    .when(pane.status==="blocked",e=>e.child(div().flex_none().px(6).h(18).flex().items_center().rounded(5).bg(t.blocked+"26").text_size(10.5).font_semibold().text_color(t.blocked).child("Needs you")))
    .when(pane.status==="done",e=>e.child(div().w(7).h(7).flex_none().rounded(4).bg(t.done)))
    .when(hovered,e=>e
      .child(action(t,pane.pane,"right","Split right","split-right","pane.split",{direction:"right"},p.demo))
      .child(action(t,pane.pane,"down","Split down","split-down","pane.split",{direction:"down"},p.demo))
      .child(action(t,pane.pane,"zoom",pane.zoomed?"Unzoom pane":"Zoom pane",pane.zoomed?"unzoom":"zoom","pane.zoom",{},p.demo))
      .child(action(t,pane.pane,"close","Close pane","close","pane.close",{},p.demo)));
}
export function paneMenu(target,available,t,selected,onChoose) {
  const valid=typeof target?.pane==="string"&&!!target.pane&&typeof target?.terminal==="string"&&!!target.terminal;
  const rows=[{id:"rename",title:"Rename pane…",detail:available?"Label this pane in TinyDust":"This terminal has no available pane",enabled:available},
    {id:"more",title:"More Herdr actions…",detail:"Split, zoom, close and other options",enabled:valid}];
  return v_flex().id("pane-menu").size_full().p(6).gap(4).bg(t.popover).text_color(t.foreground)
    .child(div().h(22).px(8).text_size(11).text_color(t.muted).child("Pane"))
    .children(rows.map((row,i)=>Button.new(`pane-menu-${row.id}`).accessibility_label(row.title).w_full().h(48).flex_none().px(9).rounded(3)
      .disabled(!row.enabled).bg(i===selected?t.selected:t.surface).text_color(row.enabled?t.foreground:t.dim)
      .on_click((_e,cx)=>{if(row.enabled)onChoose(row.id,cx);})
      .child(v_flex().gap(3).child(div().text_size(13).font_semibold().child(row.title))
        .child(div().text_size(10.5).text_color(t.muted).child(row.detail)))));
}

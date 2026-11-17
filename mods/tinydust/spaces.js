import {div,image} from "gpui-kit";
import {h_flex,v_flex,Button} from "gpui-base";
import {spaces,shared,run,openOverlay} from "herdr";

// Match Herdr's space-avatar colors without changing its saved assignments.
const COLORS={ansi6:"#22a99a",ansi3:"#e3814f",ansi4:"#5b8def",ansi5:"#8b7cf6",ansi2:"#3fae6a",ansi1:"#d9649a"};
const ICONS=["flower","house","tree","star"];
const SPACE_SAMPLE=[{id:"sample-a",name:"Sunrise farm",active:true,status:"blocked"},{id:"sample-b",name:"Garden studio",status:"idle"},{id:"sample-c",name:"Meadow notes",status:"done"}];
const PALETTE=Object.keys(COLORS);
const spaceHash=id=>{let hash=0;for(const char of String(id))hash=(hash*31+char.codePointAt(0))>>>0;return hash;};
export function spaceIcon(id) {return ICONS[spaceHash(id)%ICONS.length];}
function badge(s,t,colors,demo,rail) {
  const color=colors&&typeof colors==='object'?colors[s.id]:null;
  const fill=Object.prototype.hasOwnProperty.call(COLORS,color)?COLORS[color]:
    typeof color==='string'&&/^#[\da-f]{6}([\da-f]{2})?$/i.test(color)?color:
    typeof color==='string'&&typeof t[color]==='string'?t[color]:COLORS[PALETTE[spaceHash(s.id)%PALETTE.length]];
  const status=["working","blocked","done","idle"].includes(s.status)?s.status:null;
  const label=`${s.active?"Selected space":"Switch to space"}: ${s.name}${s.machine?` · ${s.machine}`:""}${status?` · ${status}`:""}`;
  return Button.new(`${rail?"space-rail":"space-shortcut"}-${s.id}`).accessibility_label(label).tooltip(label)
    .relative().w(28).h(28).flex_none().items_center().justify_center().rounded(5).bg(fill)
    .border(s.active?2:1).border_color(s.active?t.foreground:t.border)
    .on_click(()=>{if(!demo&&spaces().some(space=>space.id===s.id))run("space.select",{id:s.id});})
    .on_mouse_down("right",(_e,cx)=>{if(!demo&&rail&&spaces().some(space=>space.id===s.id)){cx.stop_propagation();openOverlay({mod:"menu",kind:"popup",width:200,height:260,props:{tab:"space",target:{id:s.id}}});}})
    .child(image(`mods/tinydust/space-${spaceIcon(s.id)}.svg`).w(16).h(16).flex_none())
    .when(rail&&Boolean(status),e=>e.child(div().absolute().right(0).bottom(0).w(7).h(7).rounded(4).bg(t[status]??t.unknown).border(1).border_color(t.chrome)));
}
function entries(demo) {return [demo?SPACE_SAMPLE:spaces(),demo?{"sample-a":"ansi1","sample-b":"ansi6","sample-c":"ansi4"}:shared("space.colors")];}
export function spaceShortcuts(t,demo=false) {
  const [list,colors]=entries(demo);
  return h_flex().id("space-shortcuts").size_full().min_w(0).px(8).gap(6).items_center().overflow_x_scrollbar()
    .children(list.map(s=>badge(s,t,colors,demo,false)));
}
export function compactSpaces(t,demo=false) {
  const [list,colors]=entries(demo);
  return v_flex().id("compact-spaces-list").size_full().min_h(0).items_center().gap(4).pt(4).overflow_y_scrollbar()
    .children(list.map(s=>badge(s,t,colors,demo,true)));
}

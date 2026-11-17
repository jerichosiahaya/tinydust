import {image} from "gpui-kit";
import {h_flex,Button} from "gpui-base";
import {spaces,shared,run} from "herdr";

// Match Herdr's space-avatar colors without changing its saved assignments.
const COLORS={ansi6:"#22a99a",ansi3:"#e3814f",ansi4:"#5b8def",ansi5:"#8b7cf6",ansi2:"#3fae6a",ansi1:"#d9649a"};
const ICONS=["flower","house","tree","star"];
const SPACE_SAMPLE=[{id:"sample-a",name:"Sunrise farm",active:true},{id:"sample-b",name:"Garden studio"},{id:"sample-c",name:"Meadow notes"}];
export function spaceIcon(id) {
  let hash=0;
  for(const char of String(id))hash=(hash*31+char.codePointAt(0))>>>0;
  return ICONS[hash%ICONS.length];
}
export function spaceShortcuts(t,demo=false) {
  const list=demo?SPACE_SAMPLE:spaces(), colors=demo?{"sample-a":"ansi1","sample-b":"ansi6","sample-c":"ansi4"}:shared("space.colors");
  return h_flex().id("space-shortcuts").size_full().min_w(0).px(8).gap(6).items_center().overflow_x_scrollbar()
    .children(list.map(s=>{
      const color=colors&&typeof colors==='object'?colors[s.id]:null;
      const fill=Object.prototype.hasOwnProperty.call(COLORS,color)?COLORS[color]:
        typeof color==='string'&&/^#[\da-f]{6}([\da-f]{2})?$/i.test(color)?color:
        typeof color==='string'&&typeof t[color]==='string'?t[color]:COLORS.ansi6;
      const label=`${s.active?"Selected space":"Switch to space"}: ${s.name}${s.machine?` · ${s.machine}`:""}`;
      return Button.new(`space-shortcut-${s.id}`).accessibility_label(label).tooltip(label)
        .w(28).h(28).flex_none().items_center().justify_center().rounded(5).bg(fill)
        .border(s.active?2:1).border_color(s.active?t.foreground:t.border)
        .on_click(()=>{if(!demo&&spaces().some(space=>space.id===s.id))run("space.select",{id:s.id});})
        .child(image(`mods/tinydust/space-${spaceIcon(s.id)}.svg`).w(16).h(16).flex_none());
    }));
}

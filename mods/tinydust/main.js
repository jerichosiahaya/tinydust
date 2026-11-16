import { View, div, image } from "gpui-kit";
import { h_flex, v_flex, Button } from "gpui-base";
import { agents, spaces, run, setAgentOrder, shared, setShared, props, theme } from "herdr";

const STATES = {
  working: ["Working · tending crops", "#bfd7b5", "•"],
  blocked: ["Needs you · at the gate", "#efb5c4", "!"],
  done: ["Done · harvest ready", "#e9d3a3", "+"],
  idle: ["Idle · resting", "#c6bbd9", "–"],
};
const SAMPLE = [
  { address: "sample-1", space: "sample", program: { name: "Builder" }, tab_name: "Plant the first seed", status: "working" },
  { address: "sample-2", space: "sample", program: { name: "Reviewer" }, tab_name: "Review the garden plan", status: "blocked" },
  { address: "sample-3", space: "sample", program: { name: "Explorer" }, tab_name: "A small task, finished", status: "done" },
  { address: "sample-4", space: "sample", program: { name: "Writer" }, tab_name: "Taking a little breather", status: "idle" },
  { address: "sample-5", space: "sample", program: { name: "Helper" }, tab_name: "Looking after the seedlings", status: "working" },
];
const r = (x,y,w,h,c) => div().absolute().left(x).top(y).w(w).h(h).bg(c);

const CAST = [
  ["cat", "Miso the cat", "#514759"], ["rabbit", "Clover the rabbit", "#5c454e"],
  ["fox", "Maple the fox", "#554939"], ["bear", "Cocoa the bear", "#4c4558"],
  ["frog", "Fern the frog", "#405247"], ["duck", "Sunny the duck", "#56503f"],
  ["farmer", "Rowan the farmer", "#425052"], ["gardener", "Sage the gardener", "#51465a"],
];

export function characterFor(address) {
  let hash=0;
  for (const letter of address) hash=(hash*31+letter.codePointAt(0))>>>0;
  return CAST[hash % CAST.length];
}

export function farmer(address, state, motion) {
  const [kind,,background]=characterFor(address);
  let body=div().absolute().left(4).top(0).w(54).h(62)
    .child(image(`mods/tinydust/${kind}.svg`).w(54).h(62));
  if (motion && state === "working") body=body.loop("top",{from:-1,to:1,period:1300,easing:"ease-in-out"});
  return div().relative().w(62).h(62).flex_none().overflow_hidden().rounded(3).bg(background).children([
    r(0,53,62,9,"#302e3144"),body,
    ...(state === "working" ? [r(43,40,11,8,"#91b7b5"),r(44,40,9,2,"#c1d9cc"),r(53,37,5,3,"#709694")] : []),
    ...(state === "done" ? [r(44,42,12,9,"#bea475"),r(45,39,4,5,"#e6cb8e"),r(50,38,3,5,"#adbf8e")] : []),
    ...(state === "blocked" ? [div().absolute().left(47).top(3).text_size(15).font_bold().text_color("#f5c4d3").child("!")] : []),
  ]);
}

const button = (id, text, action) => Button.new(id).accessibility_label(text).h(30).px(9).items_center().rounded(3)
  .bg(theme().raised).text_color(theme().foreground).text_size(11).on_click(action).child(text);

export default class TinyDust extends View {
  init() { this.width = 300; this.height = 500; this.demoMotion = false; }
  render() {
    const demo = props()?.demo === true;
    const role = props()?.role;
    const t = theme();
    const quiet = !demo && shared("tinydust.quiet") === true;
    const motion = (demo ? this.demoMotion : shared("tinydust.motion") === true) && !quiet;
    if (role === "brand") return h_flex().id("tinydust-brand").size_full().items_center().px(10).gap(8)
      .on_size_change((size,cx)=>{if(size.width!==this.width){this.width=size.width;cx.notify();}})
      .child(div().text_size(17).font_bold().text_color(t.accent).child(this.width<160?"TD":"TinyDust"))
      .when(this.width>=160,e=>e.child(div().flex_1())
        .child(button("journal-toggle", "Journal", () => run("layout.toggle", {id:"journal"}))));
    const all = demo ? SAMPLE : agents();
    const space = demo ? {id:"sample",name:"Sunrise farm"} : spaces().find(s => s.active);
    const list = all.filter(a => a.space === space?.id);
    if (!demo) setAgentOrder([...list, ...all.filter(a => a.space !== space?.id)].map(a => a.address));
    const narrow = this.width < 160;
    return v_flex().id("garden-root").size_full().min_h(0).bg(t.chrome)
      .on_size_change((size,cx) => { if(size.width !== this.width || size.height !== this.height) {this.width=size.width;this.height=size.height;cx.notify();} })
      .when(!narrow, e => e
        .child(h_flex().h(38).px(12).flex_none().items_center().justify_between()
          .child(div().text_size(12).font_semibold().child("Your little corner"))
          .when(!quiet,e=>e.child(button("motion", motion ? "Motion on" : "Motion off", (_e,cx) => {if(demo){this.demoMotion=!motion;cx.notify();}else setShared("tinydust.motion", !motion);}))))
        .when(!quiet && this.height > 330, e => e.child(image("mods/tinydust/farm.svg").w(this.width).h(this.width * 0.7).flex_none()))
        .child(h_flex().h(38).px(12).flex_none().items_center().justify_between()
          .child(div().text_size(12).font_semibold().child("Farmhands"))
          .child(div().text_size(11).text_color(t.muted).child(`${list.length} in this space`))))
      .child(v_flex().id("farmhands").flex_1().min_h(0).overflow_y_scrollbar()
        .when(!list.length, e => e.child(div().p(12).text_size(12).text_color(t.muted).child(narrow ? "–" : "Start an agent in this space. Its farmer will appear here.")))
        .children(list.map(a => {
          const [label,color,symbol] = STATES[a.status] ?? ["Status unknown", t.muted,"?"];
          const name = a.program?.name || a.app || "Agent";
          return Button.new(`farmer-${a.address}`).accessibility_label(`${name}, ${label}, focus agent`).mx(narrow?4:8).mb(6).h(narrow?36:80).flex_none().px(narrow?4:6)
            .items_center().gap(10).rounded(3).bg(a.focused?t.selected:t.surface)
            .border(1).border_color(a.focused?t.accent:t.border)
            .tooltip(`${name} · ${characterFor(a.address)[1]} · ${label} · ${a.address}`)
            .on_click(() => {if(!demo) run("agent.focus",{terminal:a.address});})
            .when(narrow,e=>e.child(div().text_color(color).child(symbol)))
            .when(!narrow,e=>e.child(farmer(a.address,a.status,motion)).child(v_flex().flex_1().min_w(0).gap(3)
              .child(div().text_size(13).font_semibold().truncate().child(name))
              .child(div().text_size(11).text_color(color).truncate().child(label))
              .child(div().text_size(10.5).text_color(t.muted).truncate().child(`${a.tab_name || "Agent"} · ${a.address}`))));
        })));
  }
}

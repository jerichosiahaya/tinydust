import { View, div, image } from "gpui-kit";
import { h_flex, v_flex, Button } from "gpui-base";
import { agents, spaces, run, setAgentOrder, shared, setShared, props, theme } from "herdr";

const STATES = {
  working: ["Working · tending crops", "#bed895", "•"],
  blocked: ["Needs you · at the gate", "#f0b196", "!"],
  done: ["Done · harvest ready", "#f3d792", "+"],
  idle: ["Idle · resting", "#c3c9ad", "–"],
};
const SAMPLE = [
  { address: "sample-1", space: "sample", program: { name: "Builder" }, tab_name: "Plant the first seed", status: "working" },
  { address: "sample-2", space: "sample", program: { name: "Reviewer" }, tab_name: "Review the garden plan", status: "blocked" },
  { address: "sample-3", space: "sample", program: { name: "Explorer" }, tab_name: "A small task, finished", status: "done" },
];
const r = (x,y,w,h,c) => div().absolute().left(x).top(y).w(w).h(h).bg(c);

export function farmer(index, state, motion) {
  const colors = ["#7795a0", "#bc8060", "#939b69", "#a18aab"];
  const coat = colors[index % colors.length];
  let body = div().absolute().left(10).top(6).w(32).h(44).children([
    r(8,0,18,4,"#e0bd78"), r(5,4,24,4,"#997044"),r(5,4,22,2,"#f1d594"),
    r(10,8,14,12,"#d9aa7c"),r(10,8,14,3,"#70503c"),r(10,11,3,7,"#efc697"),
    r(14,13,2,2,"#3c382c"),r(21,13,2,2,"#3c382c"),
    r(8,20,18,13,coat),r(8,20,4,11,"#b4c4b6"),r(22,22,4,11,"#586255"),
    r(5,22,3,9,"#eac193"),r(26,22,3,9,"#c79b70"),r(11,33,6,8,"#454635"),r(20,33,6,8,"#454635"),
    r(9,39,8,3,"#352f29"),r(20,39,8,3,"#352f29"),
    ...(state === "working" ? [r(27,29,10,7,"#82a9a4"),r(34,26,5,3,"#4f7773"),r(27,29,8,2,"#b5d1bf")] : []),
    ...(state === "done" ? [r(26,29,12,9,"#b08b4c"),r(27,27,3,4,"#ddbb69"),r(32,26,3,5,"#a9b76b")] : []),
  ]);
  if (motion && state === "working") body = body.loop("top", {from:5,to:7,period:1300,easing:"ease-in-out"});
  return div().relative().w(62).h(62).flex_none().overflow_hidden().bg("#728a50").children([
    r(0,45,62,17,"#624b32"),r(0,46,62,3,"#8e6842"),r(15,49,32,6,"#463e2b"),r(21,55,27,3,"#57472e"),
    r(47,39,2,11,"#b2c778"),r(43,38,6,3,"#88a450"),r(48,35,6,3,"#d0d28e"),body,
    ...(state === "blocked" ? [div().absolute().left(44).top(4).text_size(15).font_bold().text_color("#fff0c8").child("!")] : []),
  ]);
}

const button = (id, text, action) => Button.new(id).accessibility_label(text).h(30).px(9).items_center().rounded(3)
  .bg(theme().raised).text_color(theme().foreground).text_size(11).on_click(action).child(text);

export default class TinyDust extends View {
  init() { this.width = 300; this.height = 500; }
  render() {
    const demo = props()?.demo === true;
    const role = props()?.role;
    const t = theme();
    const quiet = shared("tinydust.quiet") === true;
    const motion = shared("tinydust.motion") === true && !quiet;
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
          .when(!quiet,e=>e.child(button("motion", motion ? "Motion on" : "Motion off", () => setShared("tinydust.motion", !motion)))))
        .when(!quiet && this.height > 330, e => e.child(image("mods/tinydust/farm.svg").w(this.width).h(this.width * 0.7).flex_none()))
        .child(h_flex().h(38).px(12).flex_none().items_center().justify_between()
          .child(div().text_size(12).font_semibold().child("Farmhands"))
          .child(div().text_size(11).text_color(t.muted).child(`${list.length} in this space`))))
      .child(v_flex().id("farmhands").flex_1().min_h(0).overflow_y_scrollbar()
        .when(!list.length, e => e.child(div().p(12).text_size(12).text_color(t.muted).child(narrow ? "–" : "Start an agent in this space. Its farmer will appear here.")))
        .children(list.map((a,i) => {
          const [label,color,symbol] = STATES[a.status] ?? ["Status unknown", t.muted,"?"];
          const name = a.program?.name || a.app || "Agent";
          return Button.new(`farmer-${a.address}`).accessibility_label(`${name}, ${label}, focus agent`).mx(narrow?4:8).mb(6).h(narrow?36:80).flex_none().px(narrow?4:6)
            .items_center().gap(10).rounded(3).bg(a.focused?t.selected:t.surface)
            .border(1).border_color(a.focused?t.accent:t.border)
            .tooltip(`${name} · ${label} · ${a.address}`)
            .on_click(() => {if(!demo) run("agent.focus",{terminal:a.address});})
            .when(narrow,e=>e.child(div().text_color(color).child(symbol)))
            .when(!narrow,e=>e.child(farmer(i,a.status,motion)).child(v_flex().flex_1().min_w(0).gap(3)
              .child(div().text_size(13).font_semibold().truncate().child(name))
              .child(div().text_size(11).text_color(color).truncate().child(label))
              .child(div().text_size(10.5).text_color(t.muted).truncate().child(`${a.tab_name || "Agent"} · ${a.address}`))));
        })));
  }
}

import {div} from "gpui-kit";
import {h_flex,v_flex} from "gpui-base";

const SIGNS=[
  {status:"blocked",symbol:"!",label:"Needs attention"},
  {status:"done",symbol:"✓",label:"Finished, not yet seen"},
  {status:"working",symbol:"●",label:"Working"},
];

export function spaceStatuses(agents) {
  const spaces=new Map();
  for(const agent of agents){
    if(typeof agent?.space!=="string"||!SIGNS.some(sign=>sign.status===agent.status))continue;
    if(!spaces.has(agent.space))spaces.set(agent.space,new Set());
    spaces.get(agent.space).add(agent.status);
  }
  return spaces;
}
export function statusDescription(states) {
  return SIGNS.filter(sign=>states?.has(sign.status)).map(sign=>sign.label).join(" · ");
}
export function statusMarks(id,states,t,motion,compact=false) {
  const box=compact?v_flex().w(9).h(30).flex_none():h_flex().h(18).gap(2).items_center().flex_none();
  return box.children(SIGNS.map(sign=>{
    if(!states?.has(sign.status))return compact?div().w(9).h(10).flex_none():null;
    const glyph=div().text_color(t.foreground).text_size(compact?9:11).font_bold()
      .when(motion&&sign.status==="working",e=>e.loop("opacity",{from:0.8,to:1,period:1800,easing:"ease-in-out"}))
      .child(sign.symbol);
    return div().id(`space-sign-${compact?"icon":"name"}-${id}-${sign.status}`)
      .w(compact?9:15).h(compact?10:17).flex_none().flex().items_center().justify_center().rounded(2)
      .when(compact,e=>e.bg(t.raised))
      .accessibility_label(sign.label).tooltip(sign.label).child(glyph);
  }).filter(Boolean));
}

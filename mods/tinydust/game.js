// Pure scene rules. Status comes from Herdr, never guessed from terminal output.
export const TREE_LIMIT = 24;
export const SCENE_PAGE_SIZE = 6;
export const STATES = {
  working: {label:"Working · tending crops", short:"Working", color:"#bfd7b5", symbol:"•", zone:"Crops"},
  blocked: {label:"Needs you · at the gate", short:"Help!", color:"#efb5c4", symbol:"!", zone:"Gate"},
  done: {label:"Done · harvest ready", short:"Finished!", color:"#e9d3a3", symbol:"+", zone:"Delivery"},
  idle: {label:"Idle · resting", short:"Resting", color:"#c6bbd9", symbol:"–", zone:"Picnic"},
};
export const UNKNOWN = {label:"Status unknown",short:"Unknown",color:"#c6bbd9",symbol:"?",zone:"Path"};
const CAST = [
  ["cat", "Miso the cat", "#514759"], ["rabbit", "Clover the rabbit", "#5c454e"],
  ["fox", "Maple the fox", "#554939"], ["bear", "Cocoa the bear", "#4c4558"],
  ["frog", "Fern the frog", "#405247"], ["duck", "Sunny the duck", "#56503f"],
  ["farmer", "Rowan the farmer", "#425052"], ["gardener", "Sage the gardener", "#51465a"],
];
export function characterFor(address) {
  let hash=0;
  for(const letter of address)hash=(hash*31+letter.codePointAt(0))>>>0;
  return CAST[hash % CAST.length];
}
export function scenePage(list, requested=0, size=SCENE_PAGE_SIZE) {
  const capacity=size===3?3:SCENE_PAGE_SIZE;
  const pages=Math.max(1,Math.ceil(list.length/capacity));
  const page=Math.max(0,Math.min(pages-1,Number.isFinite(requested)?Math.floor(requested):0));
  return {page,pages,agents:list.slice(page*capacity,(page+1)*capacity)};
}
export function grove(trees) {
  return {count:trees.length,visible:trees.slice(0,TREE_LIMIT)};
}
export function sceneSpot(index,status,width) {
  // Each agent has a lane; status moves it inside the lane, not over other agents.
  const column=index%3, row=Math.floor(index/3), cell=(width-24)/3;
  const shift=status==="idle"?8:status==="done"?-5:0;
  return {x:12+column*cell+(cell-54)/2+shift,y:row*110+(status==="working"?9:status==="idle"?16:3),cell};
}

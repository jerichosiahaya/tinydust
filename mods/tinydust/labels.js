// Labels are local to TinyDust and tied to both a pane and its terminal.
export const PANE_LABEL_KEY="tinydust.paneLabels.v1";
export const PANE_LABEL_LIMIT=80;
export function readPaneLabels(value) {
  if(value==null)return {version:1,labels:[]};
  const bad=()=>{throw new Error("Pane labels are invalid or from a newer version.");};
  if(!value||typeof value!=="object"||Array.isArray(value)||value.version!==1||!Array.isArray(value.labels))bad();
  const seen=new Set();
  for(const item of value.labels){
    if(!item||typeof item.pane!=="string"||!item.pane||typeof item.terminal!=="string"||!item.terminal||
       typeof item.name!=="string"||!item.name.trim()||item.name.length>PANE_LABEL_LIMIT||/[\x00-\x1f\x7f]/.test(item.name))bad();
    const key=JSON.stringify([item.pane,item.terminal]);if(seen.has(key))bad();seen.add(key);
  }
  return value;
}
export function matchingPane(panes,target) {
  if(typeof target?.pane!=="string"||!target.pane||typeof target?.terminal!=="string"||!target.terminal)return null;
  return panes.find(p=>p.pane===target.pane&&p.terminal===target.terminal)??null;
}
export function paneLabel(state,target) {
  return state.labels.find(item=>item.pane===target?.pane&&item.terminal===target?.terminal)?.name??"";
}
export function setPaneLabel(state,target,input) {
  if(typeof target?.pane!=="string"||!target.pane||typeof target?.terminal!=="string"||!target.terminal)throw new Error("Pane target is invalid.");
  if(typeof input!=="string"||/[\x00-\x1f\x7f]/.test(input))throw new Error("Use a single-line pane label.");
  const name=input.trim();
  if(name.length>PANE_LABEL_LIMIT)throw new Error(`Use at most ${PANE_LABEL_LIMIT} characters.`);
  const previous=paneLabel(state,target);
  if(name===previous)return state;
  const labels=state.labels.filter(item=>item.pane!==target.pane||item.terminal!==target.terminal);
  if(name)labels.push({pane:target.pane,terminal:target.terminal,name});
  return {...state,labels};
}

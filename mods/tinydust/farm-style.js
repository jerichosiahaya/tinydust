// Farm choices contain space IDs and appearance settings only, never agent data.
export const FARM_STYLE_KEY="tinydust.farmStyle.v1";
export const COMPANIONS={cat:"Pip the cat",rabbit:"Dot the rabbit",chick:"Pippin the chick",none:"No companion"};
export const DEFAULT_FARM_STYLE={companion:"cat",flowers:false,fence:false,pond:false};
export function readFarmStyles(value) {
  if(value==null)return {version:1,spaces:[]};
  const bad=()=>{throw new Error("Farm appearance data is invalid or from a newer version.");};
  if(!value||typeof value!=="object"||Array.isArray(value)||value.version!==1||!Array.isArray(value.spaces))bad();
  const seen=new Set();
  for(const item of value.spaces){
    if(!item||typeof item.id!=="string"||!item.id||seen.has(item.id)||!Object.hasOwn(COMPANIONS,item.companion)||
      ["flowers","fence","pond"].some(key=>typeof item[key]!=="boolean"))bad();
    seen.add(item.id);
  }
  return value;
}
export function farmStyle(state,id) {
  return state.spaces.find(item=>item.id===id)??DEFAULT_FARM_STYLE;
}
export function setFarmStyle(state,id,key,value) {
  if(typeof id!=="string"||!id||!(key==="companion"?Object.hasOwn(COMPANIONS,value):["flowers","fence","pond"].includes(key)&&typeof value==="boolean"))
    throw new Error("Invalid farm appearance choice.");
  const previous=farmStyle(state,id);
  if(previous[key]===value)return state;
  const spaces=state.spaces.slice(),index=spaces.findIndex(item=>item.id===id);
  const next={...previous,id,[key]:value};
  if(index<0)spaces.push(next);else spaces[index]=next;
  return {...state,spaces};
}

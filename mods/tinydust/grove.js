// The grove records only space IDs, terminal addresses, and short program names.
export const GROVE_KEY="tinydust.groves.v1";
export function readGroves(value) {
  if(value==null)return {version:1,spaces:[]};
  const bad=()=>{throw new Error("Grove data is invalid or from a newer version.");};
  if(!value||typeof value!=="object"||Array.isArray(value)||value.version!==1||!Array.isArray(value.spaces))bad();
  const spaces=new Set();
  for(const space of value.spaces){
    if(!space||typeof space.id!=="string"||!space.id||spaces.has(space.id)||!Array.isArray(space.trees)||!Array.isArray(space.ignored))bad();
    spaces.add(space.id);
    const seen=new Set();
    for(const tree of space.trees){
      if(!tree||typeof tree.address!=="string"||!tree.address||typeof tree.name!=="string"||seen.has(tree.address))bad();
      seen.add(tree.address);
    }
    for(const address of space.ignored){
      if(typeof address!=="string"||!address||seen.has(address))bad();
      seen.add(address);
    }
  }
  return value;
}

export function rememberAgents(state,agents) {
  const bySpace=new Map(state.spaces.map(space=>[space.id,space]));
  const additions=new Map();
  for(const agent of agents){
    if(typeof agent.space!=="string"||!agent.space||typeof agent.address!=="string"||!agent.address)continue;
    if(!additions.has(agent.space))additions.set(agent.space,[]);
    additions.get(agent.space).push(agent);
  }
  let changed=false;
  for(const [id,list] of additions){
    const old=bySpace.get(id)??{id,trees:[],ignored:[]};
    const seen=new Set([...old.trees.map(tree=>tree.address),...old.ignored]);
    const fresh=[];
    for(const agent of list){
      if(seen.has(agent.address))continue;
      seen.add(agent.address);
      const raw=typeof agent.program?.name==="string"?agent.program.name:typeof agent.app==="string"?agent.app:"Agent";
      fresh.push({address:agent.address,name:raw.replace(/\s+/g," ").trim().slice(0,80)||"Agent"});
    }
    if(fresh.length){changed=true;bySpace.set(id,{...old,trees:[...old.trees,...fresh]});}
  }
  return changed?{...state,spaces:[...bySpace.values()]}:state;
}

export function clearGrove(state,id,agents) {
  const ignored=[...new Set(agents.filter(a=>a.space===id&&typeof a.address==="string"&&a.address).map(a=>a.address))];
  const spaces=state.spaces.slice(), index=spaces.findIndex(space=>space.id===id);
  const previous=index<0?{id}:spaces[index];
  const cleared={...previous,trees:[],ignored};
  if(index<0)spaces.push(cleared);else spaces[index]=cleared;
  return {...state,spaces};
}

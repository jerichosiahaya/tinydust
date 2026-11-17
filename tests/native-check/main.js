// Runs all dynamic branches through Herdr's real renderer; no writes, agents or alerts.
import {View,div} from "gpui-kit";
import {farmScene} from "./scene.js";
import {grove} from "./game.js";
import {toastView} from "./toast.js";
import {creationMenu} from "./creation.js";
import {workbench,workbenchBar} from "./workbench.js";
import {usageView,sampleUsage} from "./usage-ui.js";
import {spaceShortcuts,compactSpaces} from "./spaces.js";
import {spaceStatuses,statusMarks} from "./space-status.js";
import {paneHeader,paneMenu} from "./pane-ui.js";
import {theme} from "herdr";
export default class NativeCheck extends View {
  render() {
    const list=["working","blocked","done","idle","working","idle"].map((status,i)=>({address:`check-${i}`,program:{name:`Sample ${i}`},status,focused:i===0}));
    const trees=grove(list.map(a=>({address:a.address,name:a.program.name})));
    const target={pane:"sample-pane",terminal:"sample-terminal"},labels={version:1,labels:[{...target,name:"Plant the first seed"}]};
    const samplePane={...target,title:"Sample shell",cwd:"/sample",program:{name:"Sample",icon:"mods/workspace-chrome/monitor.svg",tint:true},status:"working"};
    const states=spaceStatuses(["working","done","blocked"].map(status=>({space:"sample",status}))).get("sample");
    return div().flex().flex_col().children([
      div().w(280).h(196).child(creationMenu({target:{}},theme())),
      div().w(280).h(26).child(workbench(theme(),280)),
      div().w(120).h(26).child(workbench(theme(),120)),
      div().w(400).h(26).child(workbenchBar(theme(),400,()=>{})),
      div().w(560).h(640).child(usageView({data:sampleUsage(),busy:false,error:"",period:"today",demo:true},theme(),{scan:()=>{},period:()=>{},close:()=>{}})),
      div().w(220).h(36).child(spaceShortcuts(theme(),true)),
      div().w(44).h(150).child(compactSpaces(theme(),true)),
      statusMarks("sample",states,theme(),true),statusMarks("sample",states,theme(),true,true),
      div().w(360).h(30).child(paneHeader(target,labels,theme(),true,()=>{},()=>{},samplePane)),
      div().w(220).h(180).child(paneMenu(target,true,theme(),0,()=>{})),
      farmScene(trees,list,{width:300,motion:true,shaken:"check-0",onTree:()=>{},onAgent:()=>{}}),
      farmScene(trees,list,{width:880,motion:false,expanded:true,onTree:()=>{},onAgent:()=>{}}),
      farmScene(trees,list,{width:880,motion:false,dancing:true,expanded:true,onTree:()=>{},onAgent:()=>{}}),
      div().h(80).child(toastView({overlay:"check-only",title:"Sample finished",body:"Sample workspace",level:"info",action:{name:"agent.focus",args:{terminal:"check-2"}}},theme())),
      div().h(80).child(toastView({overlay:"check-only",title:"A generic message",body:"Sample body",level:"error"},theme())),
    ]);
  }
}

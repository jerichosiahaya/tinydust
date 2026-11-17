// Runs all dynamic branches through Herdr's real renderer; no writes, agents or alerts.
import {View,div} from "gpui-kit";
import {farmScene} from "./scene.js";
import {grove} from "./game.js";
import {toastView} from "./toast.js";
import {creationMenu} from "./creation.js";
import {workbench} from "./workbench.js";
import {spaceShortcuts} from "./spaces.js";
import {theme} from "herdr";
export default class NativeCheck extends View {
  render() {
    const list=["working","blocked","done","idle","working","idle"].map((status,i)=>({address:`check-${i}`,program:{name:`Sample ${i}`},status,focused:i===0}));
    const trees=grove(list.map(a=>({address:a.address,name:a.program.name})));
    return div().flex().flex_col().children([
      div().w(280).h(196).child(creationMenu({target:{}},theme())),
      div().w(280).h(26).child(workbench(theme(),280)),
      div().w(120).h(26).child(workbench(theme(),120)),
      div().w(220).h(36).child(spaceShortcuts(theme(),true)),
      farmScene(trees,list,{width:300,motion:true,shaken:"check-0",onTree:()=>{},onAgent:()=>{}}),
      farmScene(trees,list,{width:880,motion:false,expanded:true,onTree:()=>{},onAgent:()=>{}}),
      div().h(80).child(toastView({overlay:"check-only",title:"Sample finished",body:"Sample workspace",level:"info",action:{name:"agent.focus",args:{terminal:"check-2"}}},theme())),
      div().h(80).child(toastView({overlay:"check-only",title:"A generic message",body:"Sample body",level:"error"},theme())),
    ]);
  }
}

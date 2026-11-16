// Runs all dynamic branches through Herdr's real renderer; no writes, agents or alerts.
import {View,div} from "gpui-kit";
import {farmScene} from "./scene.js";
import {toastView} from "./toast.js";
import {theme} from "herdr";
export default class NativeCheck extends View {
  render() {
    const list=["working","blocked","done","idle","working","idle"].map((status,i)=>({address:`check-${i}`,program:{name:`Sample ${i}`},status,focused:i===0}));
    return div().flex().flex_col().children([
      farmScene(list,list,{width:300,motion:true,shaken:"check-0",onTree:()=>{},onAgent:()=>{}}),
      farmScene(list,list,{width:880,motion:false,expanded:true,onTree:()=>{},onAgent:()=>{}}),
      div().h(80).child(toastView({overlay:"check-only",title:"Sample finished",body:"Sample workspace",level:"info",action:{name:"agent.focus",args:{terminal:"check-2"}}},theme())),
      div().h(80).child(toastView({overlay:"check-only",title:"A generic message",body:"Sample body",level:"error"},theme())),
    ]);
  }
}

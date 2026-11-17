import {View,div,image} from "gpui-kit";
import {h_flex,v_flex,Button,Input,InputState} from "gpui-base";
import {agents,spaces,panes,run,setAgentOrder,shared,setShared,props,theme,openOverlay,closeOverlay,layout,window,checking,exec,appHome} from "herdr";
import {STATES,UNKNOWN,characterFor,scenePage,grove} from "./game.js";
import {actor,farmScene} from "./scene.js";
import {toastView} from "./toast.js";
import {creationTarget,creationMenu} from "./creation.js";
import {workbenchBar} from "./workbench.js";
import {usageView,decodeUsage,sampleUsage} from "./usage-ui.js";
import {spaceShortcuts,compactSpaces} from "./spaces.js";
import {GROVE_KEY,readGroves,rememberAgents,clearGrove} from "./grove.js";
import {PANE_LABEL_KEY,readPaneLabels,matchingPane,paneLabel,setPaneLabel} from "./labels.js";
import {paneHeader,paneMenu} from "./pane-ui.js";

const SAMPLE=[
  {address:"sample-1",pane:"sample-pane-1",space:"sample",program:{name:"Builder"},tab_name:"Plant the first seed",status:"working"},
  {address:"sample-2",pane:"sample-pane-2",space:"sample",program:{name:"Reviewer"},tab_name:"Review the garden plan",status:"blocked"},
  {address:"sample-3",pane:"sample-pane-3",space:"sample",program:{name:"Explorer"},tab_name:"A small task, finished",status:"done"},
  {address:"sample-4",pane:"sample-pane-4",space:"sample",program:{name:"Writer"},tab_name:"Taking a little breather",status:"idle"},
  {address:"sample-5",pane:"sample-pane-5",space:"sample",program:{name:"Helper"},tab_name:"Looking after seedlings",status:"working"},
];
const SAMPLE_PANE_LABELS={version:1,labels:SAMPLE.map(a=>({pane:a.pane,terminal:a.address,name:a.tab_name}))};
const findNode=(node,id)=>node?.id===id?node:(node?.children??[]).map(child=>findNode(child,id)).find(Boolean);
const DEFAULT_BRAND_FONT="Nads Handwriting";
const button=(id,text,action)=>Button.new(id).accessibility_label(text).h(30).px(9).items_center().rounded(3)
  .bg(theme().raised).text_color(theme().foreground).text_size(11).on_click(action).child(text);
const macLights=()=>{const w=window();return w?.platform==="macos"&&w.titlebar==="none"&&!w.fullscreen;};
const newButton=(text,demo)=>button("create-open",text,()=>openOverlay({
  mod:"tinydust",kind:"popup",width:280,height:196,
  props:{role:"create-menu",target:demo?{}:creationTarget(),...(demo?{demo:true}:{})},
})).accessibility_label("New tab, space, or terminal").tooltip("New tab, space, or terminal")
  .on_mouse_down("left",(_e,cx)=>cx.stop_propagation());

export default class TinyDust extends View {
  init(_p,cx) {
    const p=props()??{};
    if(p.role==="create-menu"||p.role==="clear-grove"||p.role==="pane-menu"||(p.tab==="pane"&&p.target)){
      this.menuHandle=cx.focus_handle();this.menuHandle.focus();this.clearError="";
      this.paneMenuIndex=(p.demo&&p.target?.pane&&p.target?.terminal)||matchingPane(panes(),p.target)?0:1;this.paneMenuError="";
    }
    if(p.role==="rename-pane"){
      this.paneLabelError="";this.paneLabelLocked=false;
      try {this.paneLabelInitial=paneLabel(p.demo?SAMPLE_PANE_LABELS:readPaneLabels(shared(PANE_LABEL_KEY)),p.target);}
      catch {this.paneLabelInitial="";this.paneLabelLocked=true;this.paneLabelError="Saved pane labels could not be read. Original data was not changed.";}
      this.paneInput=InputState.new({value:this.paneLabelInitial,placeholder:"What is this pane working on?"});
      this.paneInput.on("submit",(_e,cx)=>this.savePaneLabel(cx));
      this.paneInput.on("change",(_e,cx)=>{if(!this.paneLabelLocked)this.paneLabelError="";cx.notify();});
      this.menuHandle=cx.focus_handle();
      if(!checking()){this.paneInput.focus();this.paneFocusTask=cx.timer.after(600,()=>this.paneInput.focus());}
    }
    this.paneHovered=false;
    if(p.role==="usage"){
      this.usageData=p.demo?sampleUsage():null;this.usageBusy=false;this.usageError="";this.usagePeriod="today";this.usageGeneration=0;this.usageClosed=false;
      this.menuHandle=cx.focus_handle();this.menuHandle.focus();
    }
    if(props()?.role==="font-menu"){
      const current=props()?.demo?null:shared("tinydust.brandFont");
      this.fontInput=InputState.new({value:typeof current==="string"?current:"",placeholder:`${DEFAULT_BRAND_FONT} (default)`});
      this.fontInput.on("submit",(_e,cx)=>this.saveFont(cx));
      this.fontInput.on("change",(_e,cx)=>{this.fontError="";cx.notify();});this.fontError="";
      this.menuHandle=cx.focus_handle();this.menuHandle.focus();
    }
    this.width=props()?.role==="world"?880:300;this.height=600;this.page=0;
    this.demoMotion=false;this.demoSelected=null;this.lastFocused=null;
    this.shaken=null;this.treeTask=null;this.treeMessage="";this.treeAddress=null;
  }
  close() {
    this.usageClosed=true;this.usageGeneration=(this.usageGeneration??0)+1;
    try {this.usageTask?.cancel();} catch {}
  }
  scanUsage(prices,cx) {
    if(props()?.demo||this.usageBusy||this.usageClosed)return;
    this.usageBusy=true;this.usageError="";const generation=++this.usageGeneration;cx.notify();
    const script=`${appHome().replace(/[\\/]+$/,"")}/mods/tinydust/usage_scan.py`;
    // shortcut: a host exec may outlive the dialog until its bounded scan ends; cancel the process when the host exposes cancellation.
    this.usageTask=cx.spawn(async taskCx=>{
      try {
        const result=await exec("python3",[script,...(prices?["--prices"]:[])],{timeout:40000});
        if(result.code!==0)throw new Error("Scan failed");
        const data=decodeUsage(result.stdout);
        if(!this.usageClosed&&generation===this.usageGeneration)this.usageData=data;
      } catch {
        if(!this.usageClosed&&generation===this.usageGeneration)this.usageError="Could not scan usage. Check that Python 3 is available, then try again.";
      } finally {
        if(!this.usageClosed&&generation===this.usageGeneration){this.usageBusy=false;taskCx.notify();}
      }
    });
  }
  saveFont(cx) {
    const font=this.fontInput.value().trim();
    if(font.length>100||/[\x00-\x1f\x7f]/.test(font)){this.fontError="Use a font family name of at most 100 characters.";cx.notify();return;}
    if(!props()?.demo)setShared("tinydust.brandFont",font||null);
    if(props()?.overlay)closeOverlay(props().overlay);
  }
  openPaneMenu(target) {
    if(props()?.demo||!matchingPane(panes(),target))return;
    openOverlay({mod:"tinydust",kind:"popup",width:240,height:160,props:{role:"pane-menu",target:{pane:target.pane,terminal:target.terminal}}});
  }
  choosePaneMenu(kind,cx) {
    const p=props()??{},target=p.target??{};
    if(p.demo)return;
    if(kind==="rename"){
      if(!matchingPane(panes(),target)){this.paneMenuError="This pane changed. Reopen the menu.";cx.notify();return;}
      if(p.overlay)closeOverlay(p.overlay);
      openOverlay({mod:"tinydust",kind:"dialog",width:380,height:230,props:{role:"rename-pane",target:{pane:target.pane,terminal:target.terminal}}});
    } else if(kind==="more"&&typeof target.pane==="string"&&target.pane&&typeof target.terminal==="string"&&target.terminal){
      if(p.overlay)closeOverlay(p.overlay);
      openOverlay({mod:"menu",kind:"popup",width:220,height:260,props:{tab:"pane",target:{pane:target.pane,terminal:target.terminal}}});
    }
  }
  paneMenuKey(event,cx) {
    const p=props()??{},key=String(event.key).toLowerCase();
    if(key==="escape"){if(p.overlay)closeOverlay(p.overlay);cx.stop_propagation();return;}
    const available=Boolean(matchingPane(panes(),p.target)),valid=typeof p.target?.pane==="string"&&!!p.target.pane&&typeof p.target?.terminal==="string"&&!!p.target.terminal;
    const choices=[...(available?[0]:[]),...(valid?[1]:[])];
    if(!choices.length)return;
    if(key==="up"||key==="down"){
      const at=choices.indexOf(this.paneMenuIndex),step=key==="down"?1:-1;
      this.paneMenuIndex=choices[(Math.max(at,0)+step+choices.length)%choices.length];cx.notify();cx.stop_propagation();
    } else if(key==="enter"){this.choosePaneMenu(this.paneMenuIndex===0?"rename":"more",cx);cx.stop_propagation();}
  }
  savePaneLabel(cx) {
    const p=props()??{};
    if(p.demo){if(p.overlay)closeOverlay(p.overlay);return;}
    if(this.paneLabelLocked)return;
    if(!matchingPane(panes(),p.target)){this.paneLabelError="This pane changed or closed. Nothing was saved.";cx.notify();return;}
    try {
      const saved=readPaneLabels(shared(PANE_LABEL_KEY));
      if(paneLabel(saved,p.target)!==this.paneLabelInitial)throw new Error("This label changed while editing. Reopen the dialog.");
      const next=setPaneLabel(saved,p.target,this.paneInput.value());
      if(next!==saved)setShared(PANE_LABEL_KEY,next);
      if(p.overlay)closeOverlay(p.overlay);
    } catch(error){this.paneLabelError=error?.message||"Could not save the pane label.";cx.notify();}
  }
  clearGrove(cx) {
    const p=props()??{};
    if(p.demo){if(p.overlay)closeOverlay(p.overlay);return;}
    if(!p.spaceId||spaces().find(s=>s.active)?.id!==p.spaceId){this.clearError="The selected space changed. Nothing was cleared.";cx.notify();return;}
    try {
      const state=readGroves(shared(GROVE_KEY));
      setShared(GROVE_KEY,clearGrove(state,p.spaceId,agents()));
      if(p.overlay)closeOverlay(p.overlay);
    } catch {this.clearError="Could not clear the grove. Saved data was not intentionally replaced.";cx.notify();}
  }
  syncSpaceView(width) {
    if(props()?.demo)return;
    const stack=findNode(layout(),"spaces"),child=width<160?"tinydust-spaces-compact":"tinydust-spaces-native";
    if(stack?.type==="stack"&&stack.active!==child&&stack.children?.some(node=>node.id===child))
      run("layout.select",{stack:"spaces",child});
  }
  toggleSidebar() {
    if(props()?.demo)return;
    const sidebar=findNode(layout(),"sidebar");
    if(!sidebar||sidebar.hidden)return;
    const width=typeof sidebar.size?.px==="number"?sidebar.size.px:this.width;
    if(!Number.isFinite(width)||width<=0)return;
    if(width>=160){
      setShared("tinydust.sidebarWidth",Math.min(480,width));
      run("layout.resize",{id:"sidebar",px:window()?.platform==="macos"?76:44});
    } else {
      const saved=shared("tinydust.sidebarWidth");
      run("layout.resize",{id:"sidebar",px:typeof saved==="number"&&Number.isFinite(saved)&&saved>=160&&saved<=480?saved:300});
    }
  }
  focus(a,cx) {
    if(props()?.demo){this.demoSelected=a.address;cx?.notify();return;}
    if(props()?.overlay)closeOverlay(props().overlay);
    run("agent.focus",{terminal:a.address});
  }
  touchTree(a,cx,motion) {
    this.treeMessage=`A tree for ${a.name||"this agent"} · ${characterFor(a.address)[1]}`;this.treeAddress=a.address;
    this.treeTask?.cancel();this.treeTask=null;
    this.shaken=motion?a.address:null;
    if(motion)this.treeTask=cx.timer.after(1000,cx=>{this.shaken=null;this.treeTask=null;cx.notify();});
    cx.notify();
  }
  render() {
    const p=props()??{},demo=p.demo===true,expanded=p.role==="world",t=theme();
    if(p.role==="create-menu")return creationMenu(p,t).when(Boolean(this.menuHandle),e=>e.track_focus(this.menuHandle));
    if(p.role==="usage")return usageView({data:this.usageData,busy:this.usageBusy,error:this.usageError,period:this.usagePeriod,demo},t,{
      scan:(prices,cx)=>this.scanUsage(prices,cx),period:(period,cx)=>{this.usagePeriod=period;cx.notify();},close:()=>{if(p.overlay)closeOverlay(p.overlay);},
    }).when(Boolean(this.menuHandle),e=>e.track_focus(this.menuHandle))
      .on_key_down((event,cx)=>{if(String(event.key).toLowerCase()==="escape"&&p.overlay){closeOverlay(p.overlay);cx.stop_propagation();}});
    if(p.role==="pane-menu"||(p.tab==="pane"&&p.target)){
      const available=Boolean((demo&&p.target?.pane&&p.target?.terminal)||matchingPane(panes(),p.target));
      return paneMenu(p.target,available,t,this.paneMenuIndex,(kind,cx)=>this.choosePaneMenu(kind,cx))
        .when(Boolean(this.menuHandle),e=>e.track_focus(this.menuHandle))
        .on_key_down((event,cx)=>this.paneMenuKey(event,cx))
        .when(Boolean(this.paneMenuError),e=>e.child(div().px(8).text_size(11).text_color(t.blocked).child(this.paneMenuError)));
    }
    if(p.role==="rename-pane")return v_flex().id("rename-pane").size_full().p(16).gap(9).bg(t.popover)
      .when(Boolean(this.menuHandle),e=>e.track_focus(this.menuHandle))
      .on_key_down((event,cx)=>{if(String(event.key).toLowerCase()==="escape"&&p.overlay){closeOverlay(p.overlay);cx.stop_propagation();}})
      .child(div().text_size(14).font_semibold().text_color(t.foreground).child("Rename pane"))
      .child(div().text_size(11).text_color(t.muted).child("Shown in TinyDust's pane header and agent list. Leave blank to use the automatic name."))
      .when(!this.paneLabelLocked,e=>e.child(Input.new(this.paneInput).accessibility_label("Pane label").h(34).px(8).text_size(12).bg(t.background).text_color(t.foreground).border(1).border_color(t.input).rounded(3)))
      .when(Boolean(this.paneLabelError),e=>e.child(div().text_size(11).text_color(t.blocked).child(this.paneLabelError)))
      .child(h_flex().gap(6).when(!this.paneLabelLocked,e=>e.child(button("pane-label-save","Save",(_e,cx)=>this.savePaneLabel(cx))))
        .child(button("pane-label-cancel","Cancel",()=>{if(p.overlay)closeOverlay(p.overlay);})))
      .child(div().text_size(10).text_color(t.dim).child("This does not rename the terminal itself."));
    if(p.role==="pane-header"){
      let labels;try {labels=p.demo?SAMPLE_PANE_LABELS:readPaneLabels(shared(PANE_LABEL_KEY));}catch {labels=readPaneLabels(null);}
      return paneHeader(p,labels,t,this.paneHovered,(hovered,cx)=>{this.paneHovered=hovered;cx.notify();},target=>this.openPaneMenu(target));
    }
    if(p.role==="clear-grove")return v_flex().id("clear-grove-menu").size_full().p(12).gap(10).bg(t.popover)
      .when(Boolean(this.menuHandle),e=>e.track_focus(this.menuHandle))
      .on_key_down((event,cx)=>{if(String(event.key).toLowerCase()==="escape"&&p.overlay){closeOverlay(p.overlay);cx.stop_propagation();}})
      .child(div().text_size(14).font_semibold().text_color(t.foreground).child("Clear this grove?"))
      .child(div().text_size(11).text_color(t.muted).child("This clears this space's trees and cannot be undone. Agents already here will not immediately replant."))
      .when(Boolean(this.clearError),e=>e.child(div().text_size(11).text_color(t.blocked).child(this.clearError)))
      .child(h_flex().gap(6).child(button("clear-confirm","Clear grove",(_e,cx)=>this.clearGrove(cx)).bg(t.blocked).text_color(t.accent_foreground))
        .child(button("clear-cancel","Cancel",()=>{if(p.overlay)closeOverlay(p.overlay);})))
      .child(div().text_size(10).text_color(t.dim).child("Other spaces are unchanged."));
    if(p.role==="font-menu")return v_flex().id("font-menu").size_full().p(12).gap(9).bg(t.popover)
      .when(Boolean(this.menuHandle),e=>e.track_focus(this.menuHandle))
      .on_key_down((event,cx)=>{if(String(event.key).toLowerCase()==="escape"&&p.overlay){closeOverlay(p.overlay);cx.stop_propagation();}})
      .child(div().text_size(14).font_semibold().text_color(t.foreground).child("TinyDust title font"))
      .child(div().text_size(11).text_color(t.muted).child(`Enter an installed font family; leave blank for ${DEFAULT_BRAND_FONT}.`))
      .child(Input.new(this.fontInput).accessibility_label("Title font family").h(34).px(8).text_size(12).bg(t.background).text_color(t.foreground).border(1).border_color(t.input).rounded(3))
      .when(Boolean(this.fontError),e=>e.child(div().text_size(11).text_color(t.blocked).child(this.fontError)))
      .child(h_flex().gap(6).child(button("font-save","Save",(_e,cx)=>this.saveFont(cx)))
        .child(button("font-cancel","Cancel",()=>{if(p.overlay)closeOverlay(p.overlay);})))
      .child(div().text_size(10).text_color(t.dim).child("If a font is unavailable, your system uses a fallback."));
    if(p.overlay&&typeof p.title==="string")return toastView(p,t);
    const measure=(size,cx)=>{
      if(p.role==="space-shortcuts")this.syncSpaceView(size.width);
      if(size.width!==this.width||size.height!==this.height){this.width=size.width;this.height=size.height;cx.notify();}
    };
    if(p.role==="compact-spaces")return compactSpaces(t,demo);
    if(p.role==="space-shortcuts"){
      // Reconcile even when a live layout update leaves the sidebar width unchanged.
      if(!demo){const sidebar=findNode(layout(),"sidebar");this.syncSpaceView(typeof sidebar?.size?.px==="number"?sidebar.size.px:this.width);}
      const collapsed=this.width<160,label=collapsed?"Expand sidebar":"Collapse sidebar";
      return h_flex().id("space-shortcuts-bar").size_full().items_center().gap(4).on_size_change(measure)
        .when(!collapsed,e=>e.pr(8).child(div().flex_1().min_w(0).h_full().child(spaceShortcuts(t,demo))))
        .when(collapsed,e=>e.justify_center())
        .when(collapsed&&macLights(),e=>e.child(newButton("+",demo)))
        .child(Button.new("sidebar-toggle").accessibility_label(label).when(!demo,e=>e.tooltip(label)).w(28).h(28).flex_none().items_center().justify_center().rounded(4)
          .bg(t.raised).text_color(t.foreground).text_size(19).on_click(()=>this.toggleSidebar()).child(collapsed?"›":"‹"));
    }
    const quiet=!demo&&shared("tinydust.quiet")===true;
    const motion=(demo?this.demoMotion:shared("tinydust.motion")===true)&&!quiet;
    if(p.role==="workbench")return workbenchBar(t,this.width,()=>openOverlay({mod:"tinydust",kind:"dialog",width:560,height:640,props:{role:"usage",...(demo?{demo:true}:{})}})).on_size_change(measure);
    if(p.role==="brand"){
      const requested=demo?null:shared("tinydust.brandFont"),font=typeof requested==="string"&&requested.trim()?requested.trim():DEFAULT_BRAND_FONT;
      const lights=macLights(),usable=lights?Math.max(0,this.width-70):this.width,macRail=lights&&this.width<160;
      return h_flex().id("tinydust-brand").size_full().items_center().px(6).pl(lights?76:6).gap(6).on_size_change(measure)
      .when(usable>=80,e=>e.child(h_flex().id("brand-identity").flex_1().min_w(0).gap(5).items_center().tooltip("TinyDust")
        .child(image("mods/tinydust/logo.svg").id("brand-logo").w(24).h(24).flex_none())
        .when(usable>=160,e=>e.child(div().id("brand-title").min_w(0).truncate().text_size(font==="Silkscreen"?14:19).font_family(font).text_color(t.accent).child("TinyDust")))))
      .when(usable>=300,e=>e.child(button("font-open","Aa",()=>openOverlay({mod:"tinydust",kind:"popup",width:320,height:240,props:{role:"font-menu",...(demo?{demo:true}:{})}}))
        .accessibility_label("Change TinyDust title font").tooltip("Change TinyDust title font").on_mouse_down("left",(_e,cx)=>cx.stop_propagation())))
      .when(!macRail,e=>e.child(newButton(usable>=260?"+ New":"+",demo)))
      .when(usable>=220,e=>e.child(button("journal-toggle","Journal",()=>run("layout.toggle",{id:"journal"}))));
    }
    let paneNames,paneNamesError="";
    try {paneNames=demo?SAMPLE_PANE_LABELS:readPaneLabels(shared(PANE_LABEL_KEY));}
    catch {paneNames=readPaneLabels(null);paneNamesError="Saved pane labels could not be read; original data was not changed.";}
    const all=(demo?SAMPLE.map(a=>({...a,focused:a.address===this.demoSelected})):agents()).map(a=>({
      ...a,displayName:paneLabel(paneNames,{pane:a.pane,terminal:a.address})||a.program?.name||a.app||"Agent",
    }));
    const space=demo?{id:"sample",name:"Sunrise farm"}:spaces().find(s=>s.active);
    const list=all.filter(a=>a.space===space?.id);
    if(!demo&&!expanded)setAgentOrder([...list,...all.filter(a=>a.space!==space?.id)].map(a=>a.address));
    const narrow=this.width<240, capacity=expanded?6:3;
    const focusIndex=list.findIndex(a=>a.focused);
    if(focusIndex>=0&&list[focusIndex].address!==this.lastFocused){this.lastFocused=list[focusIndex].address;this.page=Math.floor(focusIndex/capacity);}
    let archive=null,gardenError="";
    try {
      const saved=readGroves(demo?null:shared(GROVE_KEY));
      archive=rememberAgents(saved,all);
      if(!demo&&archive!==saved)setShared(GROVE_KEY,archive);
    } catch {archive=null;gardenError="Could not read or save the grove; its stored data was not reset.";}
    const page=scenePage(list,this.page,capacity),trees=grove(archive?.spaces.find(item=>item.id===space?.id)?.trees??[]);
    if(this.treeAddress&&!trees.visible.some(tree=>tree.address===this.treeAddress)){
      this.treeTask?.cancel();this.treeTask=null;this.shaken=null;this.treeAddress=null;this.treeMessage="";
    }
    this.page=page.page;
    const garden=()=>farmScene(trees,page.agents,{width:this.width,motion,expanded,shaken:this.shaken,
      onTree:(a,cx)=>this.touchTree(a,cx,motion),onAgent:(a,cx)=>this.focus(a,cx)});
    const controls=()=>h_flex().h(34).px(8).gap(6).items_center().flex_none()
      .child(button("motion",quiet?"Resume game":motion?"Motion on":"Motion off",(_e,cx)=>{
        if(demo){this.demoMotion=!motion;cx.notify();}else {if(quiet)setShared("tinydust.quiet",false);setShared("tinydust.motion",!motion);}
      }))
      .when(!expanded,e=>e.child(button("visit-farm","Visit farm",()=>openOverlay({mod:"tinydust",kind:"dialog",width:940,height:720,props:{role:"world",...(demo?{demo:true}:{})}}))))
      .when(expanded&&Boolean(p.overlay),e=>e.child(button("leave-farm","Back to work",()=>closeOverlay(p.overlay))))
      .child(div().flex_1())
      .when(expanded,e=>e.child(button("clear-grove","Clear grove",()=>openOverlay({mod:"tinydust",kind:"popup",width:340,height:220,props:{role:"clear-grove",spaceId:space?.id,...(demo?{demo:true}:{})}})).disabled(!space||!archive||!trees.count)))
      .when(expanded&&!demo,e=>e.child(button("alert-settings","Alert settings",()=>run("app.settings",{section:"alerts"}))));
    const pager=()=>h_flex().h(32).px(8).gap(5).items_center().flex_none()
      .child(div().flex_1().text_size(10.5).text_color(t.muted).child(`${page.page+1} / ${page.pages} · ${list.length} farmhands`))
      .when(page.pages>1,e=>e
        .child(button("previous-field","Previous",(_e,cx)=>{this.page=(page.page-1+page.pages)%page.pages;cx.notify();}))
        .child(button("next-field","Next",(_e,cx)=>{this.page=(page.page+1)%page.pages;cx.notify();})));
    return v_flex().id("garden-root").size_full().min_h(0).bg(t.chrome).text_color(t.foreground).on_size_change(measure)
      .when(!narrow,e=>e
        .child(h_flex().h(30).px(12).items_center().justify_between().flex_none()
          .child(div().text_size(expanded?16:12).font_semibold().child(expanded?"Your little corner · farm visit":"Your little corner"))
          .when(expanded&&demo,e=>e.child(div().text_size(11).text_color(t.muted).child("Sample farm · no live agents"))))
        .child(controls())
        .child(div().h(25).px(12).flex_none().truncate().text_size(11).text_color(gardenError?t.blocked:t.muted)
          .tooltip(gardenError||"One tree for each agent terminal seen in this space. Trees stay after agents leave; up to 24 are drawn.")
          .child(gardenError||`${trees.count} ${trees.count===1?"tree":"trees"}${trees.count>trees.visible.length?` (${trees.visible.length} shown)`:""} · ${list.filter(a=>a.status==="working").length} working`)))
      .when(!narrow&&Boolean(paneNamesError),e=>e.child(div().px(10).py(4).text_size(10.5).text_color(t.blocked).truncate().tooltip(paneNamesError).child(paneNamesError)))
      .when(expanded,e=>e.child(v_flex().id("farm-visit-scroll").flex_1().min_h(0).items_center().overflow_y_scrollbar().child(garden())))
      .when(!expanded&&!narrow&&!quiet&&this.height>500,e=>e.child(garden()))
      .when(!narrow&&(expanded||(!quiet&&this.height>500)),e=>e.child(pager()))
      .when(!narrow&&Boolean(this.treeMessage),e=>e.child(div().px(10).py(4).text_size(10.5).text_color(t.muted).truncate().tooltip(this.treeMessage).child(this.treeMessage)))
      .when(!expanded,e=>e.child(v_flex().id("farmhands").flex_1().min_h(0).overflow_y_scrollbar()
        .when(!list.length,e=>e.child(div().p(12).text_size(12).text_color(t.muted).child(narrow?"–":"Start an agent in this space. Its character will join the farm.")))
        .children(list.map(a=>{
          const state=STATES[a.status]??UNKNOWN,program=a.program?.name||a.app||"Agent",name=a.displayName;
          return Button.new(`farmer-${a.address}`).accessibility_label(`${name}, ${state.label}, focus agent`).mx(narrow?4:8).mb(4).h(narrow?36:42).flex_none().px(6)
            .items_center().gap(8).rounded(3).bg(a.focused?t.selected:t.surface)
            .border(1).border_color(a.focused?t.accent:t.border)
            .tooltip(`${name}${name!==program?` · ${program}`:""} · ${characterFor(a.address)[1]} · ${state.label} · ${a.address}`)
            .on_click((_e,cx)=>this.focus(a,cx))
            .on_mouse_down("right",(_e,cx)=>{const target={pane:a.pane,terminal:a.address};if(!demo&&matchingPane(panes(),target)){cx.stop_propagation();this.openPaneMenu(target);}})
            .when(narrow,e=>e.px(0).justify_center().border_color(a.focused?t.accent:state.color).child(actor(a.address,a.status,false,22)))
            .when(!narrow,e=>e.child(actor(a.address,a.status,false,26)).child(v_flex().flex_1().min_w(0).gap(2)
              .child(div().text_size(12).font_semibold().truncate().child(name))
              .child(div().text_size(10.5).text_color(state.color).truncate().child(`${state.label}${name!==program?` · ${program}`:""}`))));
        }))));
  }
}

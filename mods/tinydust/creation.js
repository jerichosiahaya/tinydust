import {div} from "gpui-kit";
import {v_flex,Button} from "gpui-base";
import {spaces,panes,run,closeOverlay} from "herdr";

export function creationTarget() {
  const space=spaces().find(s=>s.active);
  const pane=panes().find(p=>p.focused&&space?.tabs?.some(tab=>tab.id===p.tab));
  return {space:space?.id??null,machine:space?.machine??"",pane:pane?.pane??null};
}

export function creationAction(kind,p) {
  if(p.demo)return null;
  const target=p.target??{};
  const space=spaces().find(s=>s.id===target.space);
  const pane=panes().find(p=>p.pane===target.pane&&space?.tabs?.some(tab=>tab.id===p.tab));
  if(kind==="tab"&&space)return {name:"tab.new",args:{space:space.id}};
  if(kind==="space")return {name:"space.new",args:{machine:target.machine??""}};
  if(kind==="terminal"&&pane)return {name:"pane.split",args:{pane:pane.pane,direction:"right"}};
  return null;
}

export function creationMenu(p,t) {
  const options=[
    ["tab","New tab","A shell in the current space","Create a space first"],
    ["space","New space","A workspace with its own shell",""],
    ["terminal","New terminal","Split a shell beside the current pane","Focus a pane first"],
  ];
  return v_flex().id("creation-menu").size_full().p(6).gap(4).bg(t.popover).text_color(t.foreground)
    .child(div().h(22).px(8).text_size(11).text_color(t.muted).child(p.demo?"Create · sample preview":"Create"))
    .children(options.map(([kind,title,hint,unavailable])=>{
      const enabled=Boolean(creationAction(kind,p));
      return Button.new(`create-${kind}`).accessibility_label(title).w_full().h(48).flex_none().px(9).rounded(3)
        .disabled(!enabled).bg(t.surface).text_color(enabled?t.foreground:t.dim)
        .on_click(()=>{
          // Recheck the captured targets: never silently act on a different pane/space.
          const action=creationAction(kind,p);
          if(!action)return;
          closeOverlay(p.overlay);run(action.name,action.args);
        })
        .child(v_flex().gap(3).child(div().text_size(13).font_semibold().child(title))
          .child(div().text_size(10.5).text_color(t.muted).child(p.demo?hint:enabled?hint:unavailable)));
    }));
}

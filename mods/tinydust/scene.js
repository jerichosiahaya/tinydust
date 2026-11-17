import {div,image} from "gpui-kit";
import {Button} from "gpui-base";
import {characterFor,STATES,UNKNOWN,sceneSpot} from "./game.js";
import {COMPANIONS} from "./farm-style.js";

const r=(x,y,w,h,c)=>div().absolute().left(x).top(y).w(w).h(h).bg(c);

export function actor(address,status,motion,size=54) {
  const [kind]=characterFor(address);
  const suffix=status==="idle"?"-rest":status==="done"?"-cheer":status==="working"?"-work-0":"";
  const sprite=path=>image(`mods/tinydust/${path}.svg`).absolute().left(0).top(0).w(size).h(size*28/24);
  let body=div().relative().w(size).h(size*28/24).child(sprite(kind+suffix));
  if(motion&&status==="working")body=div().relative().w(size).h(size*28/24)
    .child(sprite(kind+"-work-0").loop("opacity",{from:5,to:-4,period:850,easing:"linear"}))
    .child(sprite(kind+"-work-1").loop("opacity",{from:-4,to:5,period:850,easing:"linear"}));
  if(motion&&status==="done")body=body.loop("top",{from:0,to:-5,period:800,easing:"ease-in-out"});
  return body;
}

// One visible plot per character. Native motion only; no frame-polling timer.
export function farmScene(land,shown,{width,motion,dancing=false,expanded=false,shaken=null,onTree,onAgent,style=null,waving=null,onCompanion=()=>{}}) {
  const sceneWidth=Math.max(240,expanded?Math.min(width,960):width);
  const artWidth=expanded?Math.min(420,sceneWidth*0.5):Math.min(260,sceneWidth), top=artWidth*0.7;
  const rows=Math.max(1,Math.ceil(shown.length/3));
  const rowHeight=expanded?140:96, size=expanded?72:46, scale=size/54;
  const height=top+rows*rowHeight+16;
  const orchardX=expanded?artWidth+20:sceneWidth*0.51;
  const orchardW=sceneWidth-orchardX-8;
  const cols=expanded?8:6;
  const treeW=Math.min(expanded?48:25,orchardW/cols);
  const treeStep=expanded?treeW*1.15:Math.max(28,treeW*1.25);
  const companion=style?.companion,petSize=expanded?42:28,petX=artWidth*0.36,petY=top*0.70;
  let pet=null;
  if(companion&&companion!=="none"&&Object.hasOwn(COMPANIONS,companion)){
    pet=Button.new(`companion-${companion}`).accessibility_label(`${COMPANIONS[companion]}, say hello`)
      .tooltip(`${COMPANIONS[companion]} · say hello`).absolute().left(petX).top(petY).w(petSize).h(petSize*20/24)
      .on_click((_e,cx)=>onCompanion(companion,cx))
      .child(image(`mods/tinydust/companion-${companion}.svg`).w(petSize).h(petSize*20/24));
    if(motion&&waving===companion)pet=pet.loop("top",{from:petY,to:petY-4,period:380,easing:"ease-in-out"});
  }
  const trees=land.visible.map((a,i)=>{
    const x=orchardX+(i%cols)*(orchardW/cols),y=(expanded?top*38/112+15:Math.max(0,top-treeStep*4))+Math.floor(i/cols)*treeStep;
    let art=image("mods/tinydust/tree.svg").w(treeW).h(treeW*1.25);
    if(motion&&shaken===a.address)art=art.relative().loop("left",{from:-2,to:2,period:170,easing:"ease-in-out"});
    return Button.new(`tree-${a.address}`).accessibility_label(`Tree for ${a.name||"agent"} ${a.address}`)
      .absolute().left(x).top(y).w(expanded?Math.max(20,treeW):treeW).h(Math.max(28,treeW*1.25))
      .tooltip(`A tree for ${a.name||"agent"} · planted in this space`)
      .on_click((_e,cx)=>onTree(a,cx)).child(art);
  });
  return div().id("living-farm").relative().w(sceneWidth).h(height).flex_none().overflow_hidden().bg("#8eaa83")
    .child(image("mods/tinydust/farm-ground.svg").absolute().left(0).top(0).w(artWidth).h(top))
    .when(artWidth<sceneWidth,e=>e.children([
      r(artWidth,0,sceneWidth-artWidth,top*38/112,"#d7c4cf"),
      r(artWidth,top*24/112,sceneWidth-artWidth,top*14/112,"#b1b8b7"),
    ]))
    .when(expanded,e=>e.children([
      r(artWidth+90,top*29/112,160,top*9/112,"#96a79f"),
      r(artWidth+300,top*32/112,180,top*6/112,"#9caea4"),
      div().absolute().left(orchardX).top(top*38/112-4).text_size(11).text_color("#2b3d32").font_semibold().child("Your grove"),
    ]))
    .when(style?.flowers,e=>e.children([0.025,0.39].map((x,i)=>image("mods/tinydust/decor-flowers.svg").id(`decor-flowers-${i}`)
      .absolute().left(artWidth*x).top(top*(i?0.88:0.80)).w(artWidth*0.125).h(artWidth*0.05))))
    .when(style?.fence,e=>e.child(image("mods/tinydust/decor-garland.svg").id("decor-fence")
      .absolute().left(artWidth*67/160).top(top*58/112).w(artWidth*27/160).h(artWidth*27/160/4)))
    .when(style?.pond,e=>e.child(image("mods/tinydust/decor-lily.svg").id("decor-pond")
      .absolute().left(artWidth*0.76).top(top*80/112).w(artWidth*0.09).h(artWidth*0.09*9/16)))
    .children(trees)
    .when(Boolean(pet),e=>e.child(pet))
    .child(r(0,top-5,sceneWidth,9,"#c3ad88"))
    .children(shown.flatMap((a,index)=>{
      const state=STATES[a.status]??UNKNOWN,name=a.displayName||a.program?.name||"Agent";
      const spot=sceneSpot(index,a.status,sceneWidth), rowY=top+Math.floor(index/3)*rowHeight;
      const floorY=expanded?82:56, unitX=spot.x-(size-54)/2;
      const cellX=12+(index%3)*spot.cell, patchW=Math.min(100,spot.cell-8), patchX=cellX+(spot.cell-patchW)/2;
      const working=a.status==="working",idle=a.status==="idle",done=a.status==="done";
      const patch=[r(patchX,rowY+floorY,patchW,expanded?31:27,working?"#8c684e":idle?"#c19da5":"#b8a281")];
      if(working)for(let y=0;y<3;y++){
        patch.push(r(patchX+3,rowY+floorY+5+y*8,patchW-6,2,"#664c3d"));
        patch.push(r(patchX+patchW-15,rowY+floorY+2+y*8,4,4,"#c2d4a0"));
      }
      if(idle)for(let x=0;x<4;x++)patch.push(r(patchX+x*patchW/4,rowY+floorY+2,patchW/8,expanded?26:22,"#e1bec155"));
      if(a.status==="blocked")patch.push(r(patchX+patchW-12,rowY+floorY-25,4,30,"#76564a"),r(patchX+patchW-22,rowY+floorY-24,22,12,"#d9b3ad"));
      const actorTop=top+spot.y+Math.floor(index/3)*(rowHeight-110);
      const bubble=done?"Finished!":a.status==="blocked"?"Help!":dancing?(index<3?"♪":null):idle?"z z z":null;
      let unit=Button.new(`unit-${a.address}`).accessibility_label(`${name}, ${state.label}, focus agent`)
        .w(size).h(size*28/24).tooltip(`${characterFor(a.address)[1]} · ${name} · ${state.label}`)
        .on_click((_e,cx)=>onAgent(a,cx)).child(actor(a.address,dancing?"done":a.status,dancing?false:motion,size));
      if(dancing){
        const sway=Math.max(0,Math.min(12,unitX-cellX-2,cellX+spot.cell-2-size-unitX));
        unit=div().id(`dance-sway-${a.address}`).absolute().left(unitX).top(actorTop-10).w(size).h(size*28/24+10)
          .loop("left",{from:unitX+(index%2?-sway:sway),to:unitX+(index%2?sway:-sway),period:1360,easing:"ease-in-out"})
          .child(unit.relative().left(0).top(10).loop("top",{from:10,to:0,period:680,easing:"ease-in-out"}));
      } else {
        unit=unit.absolute().left(unitX).top(actorTop);
        if(motion)unit=unit.transition("left",{duration:650,easing:"ease-in-out"}).transition("top",{duration:650,easing:"ease-in-out"});
      }
      const effects=[];
      if(working&&!dancing)for(let i=0;i<3;i++){
        let drop=r(unitX+(49+i*2)*scale,actorTop+(48+i*3)*scale,2*scale,4*scale,"#d1ebed");
        if(motion)drop=drop.loop("top",{from:actorTop+(45+i*3)*scale,to:actorTop+67*scale,period:650+i*120,easing:"linear"});
        effects.push(drop);
      }
      return [
        ...patch,...(a.focused?[r(unitX+7*scale,actorTop+57*scale,40*scale,3,"#fff0bd")]:[]),unit,...effects,
        ...(bubble?[div().id(`bubble-${a.address}`).absolute().left(cellX+2).top(rowY-(dancing&&index<3?13:3)).w(spot.cell-4).flex().justify_center()
          .child(div().px(5).py(2).rounded(3).bg(done?"#f2dca9":idle?"#e4d5e7":"#f0becb").text_color("#423541").text_size(10).font_semibold().child(bubble))]:[]),
        Button.new(`name-${a.address}`).accessibility_label(`Focus ${name} ${a.address}`).tooltip(name)
          .absolute().left(cellX+(spot.cell-Math.min(120,spot.cell-4))/2).top(rowY+rowHeight-19).w(Math.min(120,spot.cell-4)).h(17).bg("#35473be6").rounded(2).on_click((_e,cx)=>onAgent(a,cx))
          .child(div().w_full().px(3).truncate().text_size(10).text_color("#f5ece0").child(name)),
      ];
    }));
}

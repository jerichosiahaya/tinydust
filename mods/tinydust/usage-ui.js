import {div} from "gpui-kit";
import {h_flex,v_flex,Button} from "gpui-base";

const PERIODS=[["today","Today"],["week","7 days"],["month","30 days"]];
const number=value=>typeof value==="number"&&Number.isFinite(value)&&value>=0;
const clean=value=>typeof value==="string"?value.replace(/[\x00-\x1f\x7f]/g," ").slice(0,160):"";
function readBucket(row) {
  if(!row||![row.tokens,row.usd,row.priced,row.unpriced].every(number)||
    ![row.tokens,row.priced,row.unpriced].every(Number.isSafeInteger)||row.priced+row.unpriced!==row.tokens)throw new Error("Invalid usage summary.");
  return {tokens:row.tokens,usd:row.usd,priced:row.priced,unpriced:row.unpriced};
}
export function decodeUsage(raw) {
  const value=typeof raw==="string"?JSON.parse(raw):raw;
  if(!value||value.kind!=="tinydust-usage"||value.version!==1||!value.periods||!value.pricing)throw new Error("Invalid usage summary.");
  const periods={};
  for(const [key] of PERIODS){
    const row=value.periods[key];
    if(!row||!Array.isArray(row.sources)||row.sources.length>8||!Array.isArray(row.models)||row.models.length>8)throw new Error("Invalid usage summary.");
    periods[key]={...readBucket(row),
      sources:row.sources.map(s=>({...readBucket(s),name:clean(s.name),checked:s.checked===true,found:s.found===true,scanned:number(s.scanned)?s.scanned:0,issues:number(s.issues)?s.issues:0})),
      models:row.models.map(m=>({...readBucket(m),name:clean(m.name),source:clean(m.source)}))};
  }
  return {kind:value.kind,version:1,generatedAt:clean(value.generatedAt),partial:value.partial===true,
    notes:Array.isArray(value.notes)?value.notes.slice(0,20).map(clean).filter(Boolean):[],
    pricing:{requested:value.pricing.requested===true,available:value.pricing.available===true},periods};
}
export function compactTokens(n) {
  if(n<1000)return String(Math.floor(n));
  for(const [size,suffix] of [[1e9,"B"],[1e6,"M"],[1e3,"K"]])if(n>=size){const v=n/size;return `${v>=100?v.toFixed(0):v>=10?v.toFixed(1):v.toFixed(2)}${suffix}`;}
  return String(n);
}
export function usageMoney(row) {
  if(!row.priced)return "—";
  return `$${row.usd>0&&row.usd<0.01?row.usd.toFixed(4):row.usd.toFixed(2)}`;
}
const sampleBucket=(tokens,usd,priced,unpriced)=>({tokens,usd,priced,unpriced});
export function sampleUsage() {
  const one=(factor)=>({ ...sampleBucket(18500*factor,0.12*factor,12000*factor,6500*factor),
    sources:[{...sampleBucket(12000*factor,0.12*factor,12000*factor,0),name:"Pi",checked:true,found:true,scanned:2,issues:0},
      {...sampleBucket(6500*factor,0,0,6500*factor),name:"Claude Code",checked:true,found:true,scanned:1,issues:0},
      {...sampleBucket(0,0,0,0),name:"Codex",checked:true,found:false,scanned:0,issues:0},
      {...sampleBucket(0,0,0,0),name:"OpenCode",checked:true,found:false,scanned:0,issues:0}],
    models:[{...sampleBucket(12000*factor,0.12*factor,12000*factor,0),name:"sample-model",source:"Pi"},
      {...sampleBucket(6500*factor,0,0,6500*factor),name:"sample-claude",source:"Claude Code"}]});
  return {kind:"tinydust-usage",version:1,generatedAt:"Sample only",partial:false,notes:[],pricing:{requested:false,available:false},periods:{today:one(1),week:one(3),month:one(8)}};
}
const btn=(id,label,action,t,disabled=false,selected=false)=>Button.new(id).accessibility_label(label).h(30).px(9).items_center().rounded(3)
  .disabled(disabled).bg(selected?t.selected:t.raised).text_color(disabled?t.dim:t.foreground).text_size(11).on_click(action).child(label);
function sourceLine(row,t) {
  const detail=!row.checked?"Not checked":!row.found?"Not found":!row.scanned?"No recent files":`${compactTokens(row.tokens)} tokens${row.issues?" · some skipped":""}`;
  return h_flex().w_full().gap(8).items_center().py(5).border_b(1).border_color(t.border)
    .child(div().w(100).flex_none().truncate().text_size(12).text_color(t.foreground).tooltip(row.name).child(row.name))
    .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.muted).child(detail))
    .child(div().flex_none().text_size(11).text_color(t.muted).child(usageMoney(row)));
}
export function usageView(state,t,handlers) {
  const {data,busy,error,period,demo}=state,row=data?.periods?.[period];
  const scan=(id,label,prices)=>btn(id,label,(_e,cx)=>handlers.scan(prices,cx),t,busy);
  return v_flex().id("usage-root").size_full().min_h(0).bg(t.chrome).text_color(t.foreground)
    .child(h_flex().h(48).px(16).items_center().gap(8).flex_none()
      .child(div().flex_1().min_w(0).text_size(16).font_semibold().child("Usage · this device"))
      .child(btn("usage-close","Close",handlers.close,t)))
    .child(v_flex().id("usage-scroll").flex_1().min_h(0).overflow_y_scrollbar().px(16).pb(16).gap(12)
      .child(div().text_size(11).text_color(t.muted).child(demo?"Sample data only · no scan":"On demand · local session files"))
      .child(div().text_size(12).text_color(t.muted).child("Scans local Pi, Claude Code, Codex and OpenCode session files. Conversation text is read only to extract usage; it is not saved or sent."))
      .child(div().text_size(11).text_color(t.dim).child("Public prices are optional: the request goes to OpenRouter and includes no session content. No automatic scans; an in-flight scan may finish after closing."))
      .child(h_flex().gap(6).flex_wrap().child(scan("usage-offline",data?"Refresh offline":"Scan offline",false))
        .child(scan("usage-prices",data?"Refresh + prices":"Scan + public prices",true)))
      .when(busy,e=>e.child(div().text_size(12).text_color(t.muted).child("Scanning recent sessions…")))
      .when(Boolean(error),e=>e.child(div().p(8).rounded(3).bg(t.surface).text_size(12).text_color(t.blocked).child(error)))
      .when(Boolean(row),e=>e
        .child(h_flex().gap(6).children(PERIODS.map(([key,label])=>btn(`usage-period-${key}`,label,(_e,cx)=>handlers.period(key,cx),t,busy,period===key))))
        .child(h_flex().gap(12).flex_wrap()
          .child(v_flex().flex_1().min_w(130).p(10).rounded(3).bg(t.surface).gap(4)
            .child(div().text_size(11).text_color(t.muted).child("Tokens recorded"))
            .child(div().text_size(21).text_color(t.foreground).child(compactTokens(row.tokens))))
          .child(v_flex().flex_1().min_w(130).p(10).rounded(3).bg(t.surface).gap(4)
            .child(div().text_size(11).text_color(t.muted).child("Recorded / estimated value"))
            .child(div().text_size(21).text_color(t.foreground).child(usageMoney(row)))))
        .child(div().text_size(11).text_color(t.muted).child(`${compactTokens(row.priced)} tokens with a value · ${compactTokens(row.unpriced)} unpriced. Reported estimates can omit costs; this is not an invoice or quota.`))
        .when(data.partial,e=>e.child(div().p(8).rounded(3).bg(t.surface).text_size(11).text_color(t.blocked).child("Partial scan: some recent records were not included.")))
        .children(data.notes.map(note=>div().text_size(11).text_color(t.muted).child(note)))
        .child(div().text_size(13).font_semibold().child("Sources"))
        .children(row.sources.map(source=>sourceLine(source,t)))
        .when(row.models.length>0,e=>e.child(div().pt(4).text_size(13).font_semibold().child("Models · top 8"))
          .children(row.models.map(model=>sourceLine({...model,checked:true,found:true,scanned:1,issues:0,name:`${model.name} · ${model.source}`},t))))
        .child(div().text_size(10.5).text_color(t.dim).child("Recent files modified in the last 30 days. Scans are bounded; missing prices and unrecognized records can make totals incomplete."))));
}

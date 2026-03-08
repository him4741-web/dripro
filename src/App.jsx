import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
//  DATA
// ============================================================
const U = { name: "田中太郎", company: "〇〇福祉会", avatar: "田", plan: "Pro" };

const NEWS = [
  { id: 1, cat: "law", title: "GH「総量規制」導入 — 厚労省が正式提案", summary: "社会保障審議会障害者部会にてGH新規指定を自治体判断で制限できる「総量規制」を提案。既存事業所の競争環境が大きく変わる可能性。", source: "厚生労働省", date: "2025-12-08", imp: "high", advice: "既存事業所にはプラス材料。「重度対応」への体制強化で例外枠を確保する戦略が有効。", read: "3分" },
  { id: 2, cat: "reward", title: "【速報】2026年6月〜 新規GHの基本報酬引き下げ", summary: "令和6年度報酬改定により新規指定GHの基本報酬引き下げ。既存事業所は対象外だが影響は広範囲。", source: "厚生労働省", date: "2025-12-16", imp: "high", advice: "新規参入検討中なら「2026年5月末までに指定取得」が最優先アクション。", read: "4分" },
  { id: 3, cat: "law", title: "地域連携推進会議の義務化（令和7年度〜）", summary: "障害者総合支援法改正に基づき外部の目を入れる会議設置が義務化。年2回以上の開催と議事録公開が求められる。", source: "厚生労働省", date: "2025-04-01", imp: "high", advice: "民生委員・地域包括の職員に早めに声かけ。議事録はWebで公開し透明性をアピール。", read: "3分" },
  { id: 4, cat: "reward", title: "人員配置体制加算の完全ガイド（83単位/日）", summary: "12:1以上の手厚い人員配置で83単位/日を算定。シフト工夫で達成可能なケースが多い。", source: "厚生労働省", date: "2025-10-01", imp: "med", advice: "常勤換算の計算方法とシフト例をまとめました。月間約25,000円/人の増収。", read: "5分" },
  { id: 5, cat: "reward", title: "処遇改善加算の一本化（最大14.7%）届出準備", summary: "旧3加算を一本化。キャリアパス要件・職場環境改善が必須。届出期限は2026年4月15日頃。", source: "厚生労働省", date: "2025-06-01", imp: "med", advice: "必要書類チェックリストと記入例を用意しました。早めの着手を。", read: "6分" },
  { id: 10, cat: "subsidy", title: "介護テクノロジー導入支援 — GH最大150万円", summary: "見守りセンサー・ICT機器の導入費を補助。タブレット・介護ソフト・インカム・AIカメラが対象。", source: "厚生労働省", date: "2026-02-01", imp: "high", advice: "都道府県の障害福祉課に要事前相談。見積書は2社以上。研修動画視聴が申請要件。", read: "4分", cs: { co: "NPO法人インクル（愛知県）", r: "タブレット+介護ソフト導入で記録時間を1日40分短縮。離職率15%低下。", amt: "95万円（補助率3/4）" } },
  { id: 11, cat: "subsidy", title: "デジタル化・AI導入補助金 2026（最大450万円）", summary: "介護記録ソフト・勤怠管理・請求システム等の導入費を補助。gBizIDプライム取得が前提。", source: "中小企業庁", date: "2026-01-07", imp: "high", advice: "IT導入支援事業者との連携が必要。SECURITY ACTION宣言も事前に済ませること。", read: "5分", cs: { co: "あきた創生マネジメント", r: "3ツール導入で事務作業を月30時間削減。", amt: "120万円（補助率1/2）" } },
  { id: 13, cat: "subsidy", title: "人材確保・職場環境改善事業（5.4万円/人）", summary: "処遇改善加算算定事業所に職員1人あたり約5.4万円の一時金を補助。", source: "厚生労働省", date: "2025-07-01", imp: "high", advice: "業務の見える化・改善活動体制の構築も支給要件。都道府県の委託先事務局へ申請。", read: "3分" },
];

const MSGS = [
  { id: 1, user: "佐藤花子", av: "佐", co: "△△ケア", text: "処遇改善加算の届出、皆さんもう準備始めてますか？", time: "08:32", likes: 3, replies: 2 },
  { id: 2, user: "鈴木一郎", av: "鈴", co: "□□介護", text: "キャリアパス要件の資料を揃え始めました。常勤換算の計算が毎回悩みます…", time: "08:45", likes: 5, replies: 1 },
  { id: 3, user: "ドリプロ", av: "D", co: "運営", text: "処遇改善加算の届出期限について詳しくまとめました。新聞タブからチェックしてください！", time: "09:01", likes: 8, replies: 0, admin: true },
  { id: 4, user: "山本次郎", av: "山", co: "◇◇福祉", text: "連携推進会議、民生委員さんに声かけしたら快く引き受けてくれた。意外とハードル低い。", time: "09:15", likes: 12, replies: 4 },
  { id: 5, user: "高橋美咲", av: "高", co: "☆☆GH", text: "重度対応シフトに切り替えて月の収益18%アップ！ドリプロの記事がきっかけです", time: "昨日", likes: 21, replies: 6 },
];

const EVTS = [
  { id: 1, title: "加算取得の実務と常勤換算のコツ", type: "study", date: "3/20（金）", time: "14:00〜15:30", cap: 30, applied: 18, tag: "会員無料" },
  { id: 2, title: "【人気】加算取得 完全攻略セミナー", type: "seminar", date: "4/10（木）", time: "14:00〜16:00", cap: 100, applied: 55, tag: "無料" },
  { id: 3, title: "報酬改定 個別コンサルティング", type: "consul", date: "随時受付", time: "", cap: 5, applied: 2, tag: "残3枠" },
];

const DEADLINES = [
  { label: "報酬引き下げ開始", date: "2026-06-01", color: "#ef4444", icon: "🚨" },
  { label: "処遇改善届出期限", date: "2026-04-15", color: "#f59e0b", icon: "📋" },
  { label: "連携推進会議義務化", date: "2027-04-01", color: "#8b5cf6", icon: "⚖️" },
];

const NG = ["バカ","ばか","アホ","あほ","死ね","しね","クソ","くそ","うざい","きもい","消えろ"];
const OT = ["ランチ","ラーメン","天気","サッカー","野球","映画","ゲーム"];

// THEME
const C = {
  bg: "#0b0d11", s: "#0f1218", card: "#151921", card2: "#1a1f2b",
  bd: "#1f2535", bdL: "#2a3148",
  acc: "#4f8ff7", accS: "rgba(79,143,247,0.10)", accG: "linear-gradient(135deg,#4f8ff7,#7c5cfc)",
  grn: "#34d399", grnS: "rgba(52,211,153,0.10)",
  org: "#fbbf24", orgS: "rgba(251,191,36,0.10)",
  red: "#f87171", redS: "rgba(248,113,113,0.10)",
  pur: "#a78bfa", purS: "rgba(167,139,250,0.10)",
  t1: "#eef2f7", t2: "#8893a7", t3: "#4a5568",
};
const catC = { law: C.acc, reward: C.grn, subsidy: C.pur };
const catL = { law: "法改正", reward: "報酬加算", subsidy: "補助金" };
const catE = { law: "⚖️", reward: "💰", subsidy: "🏦" };

function useM() {
  const [m, s] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : true);
  useEffect(() => { const h = () => s(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return m;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Noto+Sans+JP:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
::-webkit-scrollbar{width:3px;height:0}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:3px}
body{background:${C.bg};overflow-x:hidden}
@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
@keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes glow{0%,100%{box-shadow:0 0 24px rgba(79,143,247,0.15)}50%{box-shadow:0 0 48px rgba(79,143,247,0.3)}}
.sg>*{animation:up .35s ease both}
${Array.from({length:15},(_,i)=>`.sg>*:nth-child(${i+1}){animation-delay:${i*0.035}s}`).join("")}
.gl{background:rgba(15,18,24,0.75);backdrop-filter:blur(24px) saturate(1.3);-webkit-backdrop-filter:blur(24px) saturate(1.3)}
.tp{transition:transform .12s,opacity .12s;cursor:pointer;user-select:none}.tp:active{transform:scale(0.975);opacity:0.85}
.hv{transition:border-color .2s,box-shadow .2s,transform .2s}.hv:hover{border-color:${C.bdL};box-shadow:0 6px 32px rgba(0,0,0,0.25);transform:translateY(-1px)}
input,textarea{font-family:'Outfit','Noto Sans JP',sans-serif}
`;
const F = "'Outfit','Noto Sans JP',sans-serif";
const FM = "'JetBrains Mono',monospace";

const Badge = ({ children, color = C.acc, filled }) => (
  <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 8, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, color: filled ? "#fff" : color, background: filled ? color : `${color}15`, lineHeight: 1.3 }}>{children}</span>
);
const Card = ({ children, onClick, glow, pad = 18, style: s }) => (
  <div onClick={onClick} className={`hv ${onClick ? "tp" : ""}`} style={{ background: C.card, borderRadius: 18, padding: pad, border: `1px solid ${glow ? `${C.acc}35` : C.bd}`, position: "relative", overflow: "hidden", ...s }}>
    {glow && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: C.accG }} />}
    {children}
  </div>
);
const Chip = ({ children, active, onClick, color = C.acc }) => (
  <button onClick={onClick} className="tp" style={{ padding: "8px 16px", borderRadius: 24, border: `1.5px solid ${active ? color : C.bd}`, background: active ? `${color}12` : "transparent", color: active ? color : C.t2, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{children}</button>
);

// BOOKING
function BookingModal({ news, onClose }) {
  const [type, setType] = useState(news ? news.cat : "general");
  const [step, setStep] = useState(1);
  const CON = [{id:"subsidy",label:"🏦 補助金"},{id:"reward",label:"💰 加算"},{id:"law",label:"⚖️ 法改正"},{id:"general",label:"💼 経営全般"}];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", background: C.s, borderRadius: "24px 24px 0 0", border: `1px solid ${C.bd}`, animation: "slideUp .3s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}><div style={{ width: 36, height: 4, borderRadius: 2, background: C.t3 }} /></div>
        <div style={{ padding: "8px 24px 32px" }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: C.t1, margin: "0 0 4px" }}>無料相談を予約</h3>
          <p style={{ fontSize: 12, color: C.t3, margin: "0 0 18px" }}>Zoom · 約30分 · 費用無料</p>
          {step === 1 ? (
            <div className="sg">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {CON.map(c => <button key={c.id} className="tp" onClick={() => setType(c.id)} style={{ padding: 14, borderRadius: 14, border: `2px solid ${type===c.id?C.grn:C.bd}`, background: type===c.id?C.grnS:"transparent", cursor: "pointer" }}><span style={{ fontSize: 13, fontWeight: 600, color: type===c.id?C.grn:C.t1 }}>{c.label}</span></button>)}
              </div>
              <button className="tp" onClick={() => setStep(2)} style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", background: C.grn, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>📅 空き日程を見る</button>
            </div>
          ) : (
            <div className="sg">
              <div style={{ background: C.card, borderRadius: 14, border: `1px dashed ${C.bd}`, padding: 24, textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>📅</div>
                <p style={{ fontSize: 13, color: C.t2, marginBottom: 12 }}>TimeRex カレンダー</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                  {["3/10 10:00","3/10 14:00","3/11 11:00","3/12 16:00"].map(s => <button key={s} className="tp" onClick={() => { alert(`✅ ${s} で予約完了！`); onClose(); }} style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.bd}`, background: C.grnS, color: C.grn, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{s}</button>)}
                </div>
              </div>
              <button className="tp" onClick={() => setStep(1)} style={{ width: "100%", padding: 12, borderRadius: 12, border: `1px solid ${C.bd}`, background: "transparent", color: C.t3, fontSize: 13, cursor: "pointer" }}>← 戻る</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// NEWS TAB
function NewsTab() {
  const [exp, setExp] = useState(null);
  const [filter, setFilter] = useState("all");
  const [booking, setBooking] = useState(null);
  const filtered = filter === "all" ? NEWS : NEWS.filter(n => n.cat === filter);
  return (
    <div className="sg">
      {booking && <BookingModal news={booking} onClose={() => setBooking(null)} />}
      {/* Deadlines */}
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
        {DEADLINES.map((d, i) => { const days = Math.max(0, Math.ceil((new Date(d.date)-new Date())/86400000)); return (
          <div key={i} style={{ flex: "0 0 auto", minWidth: 140, background: C.card, borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.bd}`, borderLeft: `3px solid ${d.color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}><span style={{ fontSize: 14 }}>{d.icon}</span><span style={{ fontSize: 10, color: C.t3, fontWeight: 600 }}>{d.label}</span></div>
            <span style={{ fontSize: 32, fontWeight: 900, color: d.color, fontFamily: FM, lineHeight: 1 }}>{days}</span><span style={{ fontSize: 11, color: C.t3, marginLeft: 2 }}>日</span>
          </div>
        ); })}
      </div>
      {/* Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        {[{id:"all",label:"すべて"},{id:"subsidy",label:"🏦 補助金"},{id:"law",label:"⚖️ 法改正"},{id:"reward",label:"💰 報酬加算"}].map(f =>
          <Chip key={f.id} active={filter===f.id} onClick={() => setFilter(f.id)} color={f.id==="all"?C.acc:catC[f.id]}>{f.label}</Chip>
        )}
      </div>
      {/* News */}
      {filtered.map(n => (
        <Card key={n.id} onClick={() => setExp(exp===n.id?null:n.id)} glow={exp===n.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${catC[n.cat]}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>{catE[n.cat]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap", marginBottom: 5 }}>
                <Badge color={catC[n.cat]}>{catL[n.cat]}</Badge>
                {n.imp==="high" && <Badge color={C.red} filled>重要</Badge>}
                <span style={{ fontSize: 10, color: C.t3, marginLeft: "auto" }}>{n.read}</span>
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.t1, lineHeight: 1.55, margin: 0 }}>{n.title}</h3>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 5 }}>{n.source} · {n.date}</div>
            </div>
          </div>
          {exp===n.id && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.bd}`, animation: "up .2s ease" }}>
              <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.75, marginBottom: 14 }}>{n.summary}</p>
              <div style={{ padding: 14, borderRadius: 14, background: `${catC[n.cat]}08`, border: `1px solid ${catC[n.cat]}15`, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: catC[n.cat], fontWeight: 700, marginBottom: 5 }}>💡 推奨アクション</div>
                <p style={{ fontSize: 12, color: C.t1, lineHeight: 1.7, margin: 0 }}>{n.advice}</p>
              </div>
              {n.cs && <div style={{ padding: 14, borderRadius: 14, background: C.orgS, border: `1px solid ${C.org}15`, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: C.org, fontWeight: 700, marginBottom: 5 }}>📋 導入事例</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.org }}>{n.cs.co}</div>
                <p style={{ fontSize: 12, color: C.t2, margin: "4px 0", lineHeight: 1.65 }}>{n.cs.r}</p>
                <Badge color={C.grn}>💰 {n.cs.amt}</Badge>
              </div>}
              <button className="tp" onClick={e => { e.stopPropagation(); setBooking(n); }} style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: C.accG, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>💬 この内容について無料相談する</button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// CHAT
function ChatTab() {
  const [msgs, setMsgs] = useState(MSGS);
  const [input, setInput] = useState("");
  const [liked, setLiked] = useState({});
  const [reported, setReported] = useState({});
  const [reportId, setReportId] = useState(null);
  const [warn, setWarn] = useState(null);
  const ref = useRef(null);
  const send = () => { if (!input.trim()) return; if (NG.find(w=>input.includes(w))) { setWarn("ng"); return; } if (OT.some(w=>input.includes(w))) { setWarn("ot"); return; } doSend(); };
  const doSend = () => { setMsgs(p=>[...p,{id:Date.now(),user:U.name,av:U.avatar,co:U.company,text:input,time:new Date().toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"}),likes:0,replies:0}]); setInput(""); setWarn(null); setTimeout(()=>ref.current?.scrollIntoView({behavior:"smooth"}),100); };
  const Modal = ({children,onClose}) => (<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}><div style={{width:"100%",maxWidth:360,background:C.s,borderRadius:22,border:`1px solid ${C.bd}`,padding:24,animation:"scaleIn .2s ease"}} onClick={e=>e.stopPropagation()}>{children}</div></div>);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
      {warn && <Modal onClose={()=>setWarn(null)}><div style={{textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>{warn==="ng"?"🚫":"💭"}</div><h3 style={{fontSize:16,fontWeight:800,color:warn==="ng"?C.red:C.org,marginBottom:6}}>{warn==="ng"?"投稿できません":"トピック確認"}</h3><p style={{fontSize:12,color:C.t2,lineHeight:1.6,marginBottom:16}}>{warn==="ng"?"ガイドラインに反する表現が含まれています。":"テーマに沿った投稿をお願いします。"}</p><div style={{display:"flex",gap:8}}><button className="tp" onClick={()=>setWarn(null)} style={{flex:1,padding:13,borderRadius:12,border:"none",background:C.acc,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>修正する</button>{warn==="ot"&&<button className="tp" onClick={doSend} style={{flex:1,padding:13,borderRadius:12,border:`1px solid ${C.bd}`,background:"transparent",color:C.t3,fontSize:13,cursor:"pointer"}}>投稿</button>}</div></div></Modal>}
      {reportId && <Modal onClose={()=>setReportId(null)}><h3 style={{fontSize:15,fontWeight:800,color:C.t1,marginBottom:14}}>🚨 通報理由</h3>{["暴言・誹謗中傷","営業・スパム","個人情報","無関係","その他"].map(r=><button key={r} className="tp" onClick={()=>{setReported(p=>({...p,[reportId]:true}));setReportId(null);}} style={{width:"100%",padding:13,borderRadius:12,border:`1px solid ${C.bd}`,background:"transparent",color:C.t1,fontSize:13,cursor:"pointer",marginBottom:6,textAlign:"left"}}>{r}</button>)}</Modal>}
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 8 }} className="sg">
        {msgs.map(m => (
          <div key={m.id} style={{ display: "flex", gap: 10, padding: "12px 0", opacity: reported[m.id]?0.2:1, borderBottom: `1px solid ${C.bd}08` }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: m.admin?`linear-gradient(135deg,${C.org},${C.red})`:C.accG, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{m.av}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: m.admin?C.org:C.t1 }}>{m.user}</span>
                {m.admin && <Badge color={C.org}>運営</Badge>}
                <span style={{ fontSize: 10, color: C.t3 }}>{m.co}</span>
                <span style={{ fontSize: 10, color: C.t3, marginLeft: "auto" }}>{m.time}</span>
              </div>
              <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.65, margin: 0 }}>{reported[m.id]?"通報済み（確認中）":m.text}</p>
              <div style={{ display: "flex", gap: 16, marginTop: 7 }}>
                <button onClick={()=>setLiked(p=>({...p,[m.id]:!p[m.id]}))} style={{background:"none",border:"none",fontSize:11,color:liked[m.id]?C.red:C.t3,cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:3}}>{liked[m.id]?"❤️":"🤍"} {m.likes+(liked[m.id]?1:0)}</button>
                <span style={{fontSize:11,color:C.t3}}>💬 {m.replies}</span>
                {!m.admin&&!reported[m.id]&&<button onClick={()=>setReportId(m.id)} style={{background:"none",border:"none",fontSize:10,color:C.t3,cursor:"pointer",marginLeft:"auto",opacity:0.3}}>🚨</button>}
              </div>
            </div>
          </div>
        ))}
        <div ref={ref} />
      </div>
      <div style={{ padding: "14px 0 0", borderTop: `1px solid ${C.bd}` }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="メッセージを入力…" style={{ flex: 1, padding: "14px 18px", borderRadius: 16, border: `1px solid ${C.bd}`, background: C.card, color: C.t1, fontSize: 13, outline: "none" }} />
          <button className="tp" onClick={send} style={{ width: 46, height: 46, borderRadius: 16, border: "none", background: C.acc, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>↑</button>
        </div>
      </div>
    </div>
  );
}

// EVENTS
function EventsTab() {
  const [applied, setApplied] = useState({});
  const tC={study:C.acc,seminar:C.grn,consul:C.org};
  const tL={study:"📖 勉強会",seminar:"🎤 セミナー",consul:"💼 コンサル"};
  return (
    <div className="sg">
      {EVTS.map(ev => { const pct=Math.round((ev.applied/ev.cap)*100); const done=applied[ev.id]; const left=ev.cap-ev.applied; return (
        <Card key={ev.id} style={{ marginBottom: 12 }}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><Badge color={tC[ev.type]}>{tL[ev.type]}</Badge><Badge color={left<=5?C.red:C.grn} filled>{ev.tag}</Badge></div>
          <h3 style={{fontSize:15,fontWeight:700,color:C.t1,lineHeight:1.45,margin:"0 0 10px"}}>{ev.title}</h3>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,fontSize:12,color:C.t3,marginBottom:14}}><span>📅 {ev.date}</span>{ev.time&&<span>🕐 {ev.time}</span>}</div>
          <div style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:11,color:C.t3}}>{ev.applied}/{ev.cap}名</span><span style={{fontSize:11,fontWeight:700,color:left<=5?C.red:C.grn}}>残{left}席</span></div><div style={{height:5,borderRadius:3,background:C.bd}}><div style={{height:"100%",borderRadius:3,width:`${pct}%`,background:pct>80?C.red:C.grn,transition:"width .5s"}} /></div></div>
          <button className="tp" onClick={()=>setApplied(p=>({...p,[ev.id]:true}))} disabled={done} style={{width:"100%",padding:14,borderRadius:14,border:done?`1.5px solid ${C.grn}`:"none",background:done?"transparent":C.acc,color:done?C.grn:"#fff",fontSize:13,fontWeight:700,cursor:done?"default":"pointer"}}>{done?"✅ 申込済み":"申し込む"}</button>
        </Card>
      ); })}
    </div>
  );
}

// PROFILE
function ProfileTab() {
  const [eN,setEN]=useState(true);const [pN,setPN]=useState(true);
  const Tg=({on,set})=>(<button onClick={()=>set(!on)} className="tp" style={{width:50,height:30,borderRadius:15,border:"none",background:on?C.grn:C.bd,cursor:"pointer",position:"relative",transition:"background .2s"}}><div style={{width:24,height:24,borderRadius:12,background:"#fff",position:"absolute",top:3,left:on?23:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}} /></button>);
  return (
    <div className="sg">
      <Card style={{marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:14}}><div style={{width:56,height:56,borderRadius:18,background:C.accG,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:22,fontWeight:800}}>{U.avatar}</div><div style={{flex:1}}><div style={{fontSize:17,fontWeight:800,color:C.t1}}>{U.name}</div><div style={{fontSize:12,color:C.t3}}>{U.company}</div></div><Badge color={C.acc} filled>Pro</Badge></div></Card>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:C.t3,marginBottom:14}}>🔔 通知設定</div>
        {[{label:"メール通知",desc:"新着ニュース・重要なお知らせ",on:eN,set:setEN},{label:"プッシュ通知",desc:"緊急速報・期限リマインド",on:pN,set:setPN}].map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",borderBottom:i===0?`1px solid ${C.bd}`:"none"}}><div><div style={{fontSize:13,fontWeight:600,color:C.t1}}>{s.label}</div><div style={{fontSize:11,color:C.t3,marginTop:2}}>{s.desc}</div></div><Tg on={s.on} set={s.set} /></div>
        ))}
      </Card>
      <Card><button className="tp" style={{width:"100%",padding:13,borderRadius:12,border:`1px solid ${C.red}25`,background:"transparent",color:C.red,fontSize:13,fontWeight:600,cursor:"pointer"}}>退会する</button></Card>
    </div>
  );
}

// ICONS
const INews=()=><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>;
const IChat=()=><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>;
const ICal=()=><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const IUser=()=><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IBell=()=><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;

// MAIN
export default function App() {
  const [tab, setTab] = useState("news");
  const [splash, setSplash] = useState(true);
  const mobile = useM();
  useEffect(() => { const t = setTimeout(() => setSplash(false), 1600); return () => clearTimeout(t); }, []);
  const titles={news:"ドリプロ新聞",chat:"コミュニティ",events:"セミナー",profile:"マイページ"};
  const nav=[{id:"news",label:"新聞",Icon:INews,badge:NEWS.filter(n=>n.imp==="high").length},{id:"chat",label:"トーク",Icon:IChat,badge:2},{id:"events",label:"セミナー",Icon:ICal,badge:0},{id:"profile",label:"設定",Icon:IUser,badge:0}];

  if (splash) return (<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:`radial-gradient(ellipse at 50% 35%,#111b33 0%,${C.bg} 65%)`,fontFamily:F}}><style>{CSS}</style><div style={{width:68,height:68,borderRadius:20,background:C.accG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,animation:"glow 2s infinite",marginBottom:16}}>📰</div><div style={{fontSize:24,fontWeight:900,color:"#fff",animation:"up .4s ease .2s both"}}>ドリプロ</div><div style={{fontSize:11,color:C.t3,marginTop:5,animation:"up .4s ease .35s both",letterSpacing:2.5}}>障害福祉GH特化ニュース</div></div>);

  const Content=()=>({news:<NewsTab/>,chat:<ChatTab/>,events:<EventsTab/>,profile:<ProfileTab/>})[tab]||<NewsTab/>;

  if (!mobile) return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:F,display:"flex"}}><style>{CSS}</style>
      <aside style={{width:230,minHeight:"100vh",background:C.s,borderRight:`1px solid ${C.bd}`,position:"fixed",left:0,top:0,bottom:0,display:"flex",flexDirection:"column",zIndex:40}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"24px 22px 28px"}}><div style={{width:36,height:36,borderRadius:11,background:C.accG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>📰</div><div><span style={{fontSize:17,fontWeight:900,color:C.t1}}>ドリプロ</span><div style={{fontSize:9,color:C.t3,letterSpacing:1}}>GH特化ニュース</div></div></div>
        <nav style={{flex:1,padding:"0 8px"}}>{nav.map(({id,label,Icon,badge})=>{const a=tab===id;return(<button key={id} onClick={()=>setTab(id)} className="tp" style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 16px",border:"none",borderRadius:12,background:a?C.accS:"transparent",cursor:"pointer",color:a?C.acc:C.t2,marginBottom:2}}><Icon/><span style={{fontSize:13,fontWeight:a?700:500}}>{label}</span>{badge>0&&<span style={{marginLeft:"auto",minWidth:20,height:20,borderRadius:10,background:C.red,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{badge}</span>}</button>);})}</nav>
        <div style={{padding:"16px 18px",borderTop:`1px solid ${C.bd}`,display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:11,background:C.accG,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:700}}>{U.avatar}</div><div><div style={{fontSize:12,fontWeight:600,color:C.t1}}>{U.name}</div><div style={{fontSize:10,color:C.t3}}>{U.company}</div></div></div>
      </aside>
      <div style={{flex:1,marginLeft:230,minHeight:"100vh"}}>
        <header className="gl" style={{position:"sticky",top:0,zIndex:30,borderBottom:`1px solid ${C.bd}`,padding:"15px 28px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><h1 style={{fontSize:18,fontWeight:900,color:C.t1,margin:0}}>{titles[tab]}</h1><div style={{width:38,height:38,borderRadius:12,border:`1px solid ${C.bd}`,background:"rgba(255,255,255,0.03)",display:"flex",alignItems:"center",justifyContent:"center",color:C.t2,position:"relative",cursor:"pointer"}}><IBell/><div style={{position:"absolute",top:-2,right:-2,width:8,height:8,borderRadius:4,background:C.red}}/></div></header>
        <main style={{padding:"22px 28px",maxWidth:820,animation:"fadeIn .2s ease"}}><Content/></main>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:F,maxWidth:480,margin:"0 auto",position:"relative"}}><style>{CSS}</style>
      <header className="gl" style={{position:"sticky",top:0,zIndex:50,borderBottom:`1px solid ${C.bd}`,padding:"12px 16px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:10,background:C.accG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>📰</div><span style={{fontSize:16,fontWeight:900,color:C.t1}}>{titles[tab]}</span></div><div style={{display:"flex",gap:8,alignItems:"center"}}><div style={{width:34,height:34,borderRadius:10,border:`1px solid ${C.bd}`,display:"flex",alignItems:"center",justifyContent:"center",color:C.t2,position:"relative"}}><IBell/><div style={{position:"absolute",top:-1,right:-1,width:7,height:7,borderRadius:4,background:C.red}}/></div><div style={{width:32,height:32,borderRadius:10,background:C.accG,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700}}>{U.avatar}</div></div></div></header>
      <main style={{padding:"14px 14px 100px",animation:"fadeIn .2s ease"}}><Content/></main>
      <nav className="gl" style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,borderTop:`1px solid ${C.bd}`,display:"flex",padding:"4px 6px 24px",zIndex:50}}>
        {nav.map(({id,label,Icon,badge})=>{const a=tab===id;return(<button key={id} onClick={()=>setTab(id)} className="tp" style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,border:"none",background:"none",cursor:"pointer",padding:"8px 0",color:a?C.acc:C.t3}}><div style={{position:"relative",width:46,height:30,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:15,background:a?C.accS:"transparent",transition:"background .2s"}}><Icon/>{badge>0&&<div style={{position:"absolute",top:-2,right:1,minWidth:16,height:16,borderRadius:8,background:C.red,color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px",border:`2px solid ${C.bg}`}}>{badge}</div>}</div><span style={{fontSize:10,fontWeight:a?700:500}}>{label}</span></button>);})}
      </nav>
    </div>
  );
}

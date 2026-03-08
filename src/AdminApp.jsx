import { useState, useEffect } from "react";

// ===== Admin Demo Data =====
const DEMO_MEMBERS = [
  { uid: "u1", email: "tanaka@sample.co.jp", company: "〇〇福祉会", role: "admin", status: "active", emailNotify: true, fcmToken: "tok1", createdAt: "2026-01-10" },
  { uid: "u2", email: "sato@care.jp", company: "△△ケアサービス", role: "member", status: "active", emailNotify: true, fcmToken: "tok2", createdAt: "2026-01-15" },
  { uid: "u3", email: "suzuki@kaigo.jp", company: "□□介護支援", role: "member", status: "active", emailNotify: true, fcmToken: null, createdAt: "2026-01-20" },
  { uid: "u4", email: "yamamoto@fukushi.jp", company: "◇◇福祉", role: "member", status: "active", emailNotify: false, fcmToken: null, createdAt: "2026-02-01" },
  { uid: "u5", email: "takahashi@gh.jp", company: "☆☆GH", role: "member", status: "active", emailNotify: true, fcmToken: "tok5", createdAt: "2026-02-05" },
  { uid: "u6", email: "ito@welfare.jp", company: "ケアステーション虹", role: "member", status: "inactive", emailNotify: false, fcmToken: null, createdAt: "2025-12-01" },
  { uid: "u7", email: "watanabe@support.jp", company: "サポート浜松", role: "member", status: "active", emailNotify: true, fcmToken: "tok7", createdAt: "2026-02-10" },
  { uid: "u8", email: "kobayashi@home.jp", company: "ホームひだまり", role: "member", status: "active", emailNotify: true, fcmToken: null, createdAt: "2026-02-15" },
];

const DEMO_NEWS = [
  { id: 1, cat: "law", title: "GH「総量規制」導入を厚労省が提案", date: "2025-12-08", importance: "high", status: "published" },
  { id: 2, cat: "reward", title: "【緊急】2026年6月〜 新規事業所の基本報酬引き下げ", date: "2025-12-16", importance: "high", status: "published" },
  { id: 3, cat: "law", title: "地域連携推進会議の義務化（令和7年度〜）", date: "2025-04-01", importance: "high", status: "published" },
  { id: 10, cat: "subsidy", title: "ICT導入支援事業 ― GHは最大150万円", date: "2026-02-01", importance: "high", status: "published", attachments: [{ name: "ICT補助金_申請様式.xlsx", size: "245KB", type: "XLSX" }, { name: "補助金概要.pdf", size: "1.2MB", type: "PDF" }], linkUrl: "https://www.mhlw.go.jp/stf/ict-kaigo.html", linkLabel: "厚労省 ICT導入支援" },
  { id: 11, cat: "subsidy", title: "デジタル化・AI導入補助金 2026", date: "2026-01-07", importance: "high", status: "published", attachments: [{ name: "公募要領_R8.pdf", size: "3.4MB", type: "PDF" }] },
  { id: 99, cat: "subsidy", title: "【下書き】R8年度 新設補助金情報", date: "2026-02-23", importance: "medium", status: "draft" },
];

const DEMO_EVENTS = [
  { id: 1, title: "加算取得の実務と常勤換算のコツ", type: "study", date: "2026-03-20", startTime: "14:00", endTime: "15:30", spots: 12, total: 30, status: "公開中", applicants: 18 },
  { id: 2, title: "【無料】加算取得 完全攻略セミナー", type: "seminar", date: "2026-04-10", startTime: "14:00", endTime: "16:00", spots: 45, total: 100, status: "公開中", applicants: 55 },
  { id: 3, title: "報酬改定対応 個別コンサルティング", type: "consul", date: "随時", startTime: "", endTime: "", spots: 3, total: 5, status: "公開中", applicants: 2 },
];

// ===== Styles =====
const BG = "#0c0f1a";
const CARD = "#161b2e";
const BORDER = "#1e2540";
const ACCENT = "#3b82f6";
const GREEN = "#10b981";
const ORANGE = "#f59e0b";
const RED = "#ef4444";
const PURPLE = "#8b5cf6";
const T1 = "#f1f5f9";
const T2 = "#94a3b8";
const T3 = "#475569";
const FONT = "'Noto Sans JP', system-ui, sans-serif";

const catLabel = { law: "⚖️ 法改正", reward: "💰 報酬", subsidy: "🏦 補助金" };
const catColor = { law: ACCENT, reward: ORANGE, subsidy: PURPLE };

// ===== Stat Card =====
const StatCard = ({ icon, label, value, sub, color }) => (
  <div style={{ background: CARD, borderRadius: 14, padding: "18px 20px", border: `1px solid ${BORDER}`, flex: "1 1 140px", minWidth: 140 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 11, color: T2, fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 900, color: color || T1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T3, marginTop: 4 }}>{sub}</div>}
  </div>
);

// ===== Admin Login =====
function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, fontFamily: FONT }}>
      <div style={{ width: "100%", maxWidth: 380, padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: T1, margin: "0 0 4px" }}>ドリプロ管理画面</h1>
          <p style={{ fontSize: 12, color: T3 }}>管理者専用ログイン</p>
        </div>
        <div style={{ background: CARD, borderRadius: 16, padding: 24, border: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 11, color: T2, marginBottom: 4 }}>管理者パスワード</div>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="パスワードを入力" onKeyDown={e => { if (e.key === "Enter") { if (pw === "admin" || pw === "") onLogin(); else setErr("パスワードが違います"); }}} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)", color: T1, fontSize: 14, outline: "none", marginBottom: 8 }} />
          {err && <div style={{ fontSize: 12, color: RED, marginBottom: 8 }}>{err}</div>}
          <button onClick={() => { if (pw === "admin" || pw === "") onLogin(); else setErr("パスワードが違います"); }} style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${ACCENT}, #6366f1)`, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>ログイン</button>
          <p style={{ fontSize: 10, color: T3, textAlign: "center", marginTop: 10 }}>※デモ: 空欄のままログインできます</p>
        </div>
      </div>
    </div>
  );
}

// ===== Members Tab =====
function MembersTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const active = DEMO_MEMBERS.filter(m => m.status === "active");
  const emailOn = DEMO_MEMBERS.filter(m => m.emailNotify && m.status === "active");
  const pushOn = DEMO_MEMBERS.filter(m => m.fcmToken && m.status === "active");

  const filtered = DEMO_MEMBERS.filter(m => {
    if (filter === "active" && m.status !== "active") return false;
    if (filter === "inactive" && m.status !== "inactive") return false;
    if (search && !m.email.includes(search) && !m.company.includes(search)) return false;
    return true;
  });

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: T1, marginBottom: 16 }}>👥 会員管理</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon="👥" label="アクティブ会員" value={active.length} sub={`全${DEMO_MEMBERS.length}名中`} color={GREEN} />
        <StatCard icon="📧" label="メール通知ON" value={emailOn.length} sub={`${Math.round(emailOn.length / active.length * 100)}%`} color={ACCENT} />
        <StatCard icon="📱" label="プッシュ通知ON" value={pushOn.length} sub={`${Math.round(pushOn.length / active.length * 100)}%`} color={ORANGE} />
        <StatCard icon="🚪" label="退会済み" value={DEMO_MEMBERS.filter(m => m.status === "inactive").length} color={RED} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 メールアドレス・会社名で検索" style={{ flex: "1 1 200px", padding: "10px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)", color: T1, fontSize: 13, outline: "none" }} />
        {["all", "active", "inactive"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: filter === f ? ACCENT : CARD, color: filter === f ? "#fff" : T2, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {f === "all" ? "すべて" : f === "active" ? "アクティブ" : "退会済み"}
          </button>
        ))}
      </div>
      <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["会社名", "メール", "ロール", "ステータス", "メール通知", "プッシュ", "登録日"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: T3, fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.uid} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "10px 14px", color: T1, fontWeight: 700, whiteSpace: "nowrap" }}>{m.company}</td>
                  <td style={{ padding: "10px 14px", color: T2, whiteSpace: "nowrap" }}>{m.email}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: m.role === "admin" ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.1)", color: m.role === "admin" ? PURPLE : ACCENT }}>{m.role === "admin" ? "管理者" : "会員"}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: m.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: m.status === "active" ? GREEN : RED }}>{m.status === "active" ? "✅ 有効" : "🚪 退会"}</span>
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>{m.emailNotify ? "✅" : "—"}</td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>{m.fcmToken ? "📱" : "—"}</td>
                  <td style={{ padding: "10px 14px", color: T3, whiteSpace: "nowrap" }}>{m.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===== News Tab =====
function NewsTab() {
  const [items, setItems] = useState(DEMO_NEWS);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", cat: "subsidy", importance: "medium", summary: "", attachments: [], linkUrl: "", linkLabel: "" });

  const startNew = () => { setForm({ title: "", cat: "subsidy", importance: "medium", summary: "", attachments: [], linkUrl: "", linkLabel: "" }); setEditing("new"); };
  const startEdit = (item) => { setForm({ title: item.title, cat: item.cat, importance: item.importance, summary: "", attachments: item.attachments || [], linkUrl: item.linkUrl || "", linkLabel: item.linkLabel || "" }); setEditing(item.id); };
  const save = () => {
    if (!form.title) return;
    if (editing === "new") {
      setItems([{ id: Date.now(), ...form, date: new Date().toISOString().slice(0, 10), status: "draft" }, ...items]);
    } else {
      setItems(items.map(i => i.id === editing ? { ...i, ...form } : i));
    }
    setEditing(null);
  };

  const addFile = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(f => ({
      name: f.name,
      size: (f.size / 1024).toFixed(0) + "KB",
      type: f.name.split(".").pop().toUpperCase(),
    }));
    setForm({ ...form, attachments: [...form.attachments, ...newAttachments] });
    e.target.value = "";
  };
  const removeFile = (idx) => { setForm({ ...form, attachments: form.attachments.filter((_, i) => i !== idx) }); };

  const fileIcon = (type) => {
    const icons = { PDF: "📄", XLSX: "📊", XLS: "📊", CSV: "📊", DOCX: "📝", DOC: "📝", PNG: "🖼️", JPG: "🖼️", JPEG: "🖼️", ZIP: "📦" };
    return icons[type] || "📎";
  };

  const published = items.filter(i => i.status === "published").length;
  const drafts = items.filter(i => i.status === "draft").length;

  const inputS = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)", color: T1, fontSize: 13, outline: "none", fontFamily: FONT };
  const selS = { ...inputS, appearance: "none", cursor: "pointer" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: T1 }}>📰 ニュース管理</h2>
        <button onClick={startNew} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>＋ 新規作成</button>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon="📰" label="公開中" value={published} color={GREEN} />
        <StatCard icon="📝" label="下書き" value={drafts} color={ORANGE} />
        <StatCard icon="🏦" label="補助金記事" value={items.filter(i => i.cat === "subsidy").length} color={PURPLE} />
      </div>

      {editing && (
        <div style={{ background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${ACCENT}`, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T1, marginBottom: 14 }}>{editing === "new" ? "📝 新規ニュース" : "✏️ 編集"}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="タイトル" style={inputS} />
            <div style={{ display: "flex", gap: 8 }}>
              <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} style={{ ...selS, flex: 1 }}>
                <option value="law">⚖️ 法改正</option>
                <option value="reward">💰 報酬</option>
                <option value="subsidy">🏦 補助金</option>
              </select>
              <select value={form.importance} onChange={e => setForm({ ...form, importance: e.target.value })} style={{ ...selS, flex: 1 }}>
                <option value="high">🔴 重要</option>
                <option value="medium">🟡 注目</option>
                <option value="low">⚪ 通常</option>
              </select>
            </div>
            <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="要約・説明" rows={3} style={{ ...inputS, resize: "vertical" }} />

            {/* ===== 添付ファイル ===== */}
            <div style={{ border: `1px dashed ${BORDER}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T2 }}>📎 添付ファイル</span>
                <label style={{ padding: "6px 14px", borderRadius: 8, background: `${ACCENT}15`, color: ACCENT, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  ＋ ファイル追加
                  <input type="file" multiple accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.png,.jpg,.jpeg,.zip" onChange={addFile} style={{ display: "none" }} />
                </label>
              </div>
              <div style={{ fontSize: 10, color: T3, marginBottom: 8 }}>PDF / Excel / Word / 画像 / CSV / ZIP に対応</div>
              {form.attachments.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {form.attachments.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: `1px solid ${BORDER}` }}>
                      <span style={{ fontSize: 16 }}>{fileIcon(f.type)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: T1, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                        <div style={{ fontSize: 10, color: T3 }}>{f.type} · {f.size}</div>
                      </div>
                      <button onClick={() => removeFile(i)} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.1)", color: RED, fontSize: 11, cursor: "pointer", flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "12px 0", color: T3, fontSize: 11 }}>ファイルをアップロードするとここに表示されます</div>
              )}
            </div>

            {/* ===== 外部リンク ===== */}
            <div style={{ border: `1px dashed ${BORDER}`, borderRadius: 10, padding: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T2, display: "block", marginBottom: 8 }}>🔗 外部リンク（任意）</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://www.mhlw.go.jp/..." style={{ ...inputS, flex: "2 1 200px" }} />
                <input value={form.linkLabel} onChange={e => setForm({ ...form, linkLabel: e.target.value })} placeholder="リンク名（例: 厚労省通知）" style={{ ...inputS, flex: "1 1 140px" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(null)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: T2, fontSize: 12, cursor: "pointer" }}>キャンセル</button>
              <button onClick={save} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: GREEN, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>💾 保存</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: CARD, borderRadius: 12, padding: "14px 18px", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ width: 4, height: 36, borderRadius: 2, background: catColor[item.cat] || ACCENT, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T1 }}>{item.title}</span>
                {item.importance === "high" && <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "rgba(239,68,68,0.15)", color: RED }}>重要</span>}
                {item.status === "draft" && <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "rgba(245,158,11,0.15)", color: ORANGE }}>下書き</span>}
                {item.attachments && item.attachments.length > 0 && <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "rgba(59,130,246,0.12)", color: ACCENT }}>📎 {item.attachments.length}件</span>}
                {item.linkUrl && <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "rgba(16,185,129,0.12)", color: GREEN }}>🔗 リンク</span>}
              </div>
              <div style={{ fontSize: 11, color: T3, marginTop: 3 }}>
                <span style={{ color: catColor[item.cat] }}>{catLabel[item.cat]}</span> · {item.date}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => startEdit(item)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: T2, fontSize: 11, cursor: "pointer" }}>✏️ 編集</button>
              <button onClick={() => setItems(items.map(i => i.id === item.id ? { ...i, status: i.status === "published" ? "draft" : "published" } : i))} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: item.status === "published" ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)", color: item.status === "published" ? GREEN : ACCENT, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {item.status === "published" ? "✅ 公開中" : "📤 公開する"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Events Tab =====
function EventsTab() {
  const [events, setEvents] = useState(DEMO_EVENTS);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", type: "seminar", date: "", startTime: "", endTime: "", total: 30 });

  const inputS = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)", color: T1, fontSize: 13, outline: "none", fontFamily: FONT };

  const startNew = () => { setForm({ title: "", type: "seminar", date: "", startTime: "", endTime: "", total: 30 }); setEditing("new"); };
  const save = () => {
    if (!form.title) return;
    if (editing === "new") {
      setEvents([...events, { id: Date.now(), ...form, spots: form.total, status: "公開中", applicants: 0 }]);
    }
    setEditing(null);
  };

  const typeLabel = { study: "📖 勉強会", seminar: "🎤 セミナー", consul: "💼 コンサル" };
  const typeColor = { study: ACCENT, seminar: GREEN, consul: ORANGE };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: T1 }}>📚 セミナー・イベント管理</h2>
        <button onClick={startNew} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>＋ 新規作成</button>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon="📅" label="イベント数" value={events.length} color={ACCENT} />
        <StatCard icon="🙋" label="総申込数" value={events.reduce((s, e) => s + e.applicants, 0)} color={GREEN} />
        <StatCard icon="📊" label="平均申込率" value={Math.round(events.reduce((s, e) => s + (e.applicants / e.total), 0) / events.length * 100) + "%"} color={ORANGE} />
      </div>

      {editing && (
        <div style={{ background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${ACCENT}`, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T1, marginBottom: 14 }}>📝 新規イベント</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="イベント名" style={inputS} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ ...inputS, flex: "1 1 120px", appearance: "none" }}>
                <option value="seminar">🎤 セミナー</option>
                <option value="study">📖 勉強会</option>
                <option value="consul">💼 コンサル</option>
              </select>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ ...inputS, flex: "1 1 130px" }} />
              <input type="number" value={form.total} onChange={e => setForm({ ...form, total: +e.target.value })} placeholder="定員" style={{ ...inputS, flex: "0 0 80px" }} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontSize: 11, color: T2, flexShrink: 0 }}>🕐 時間</div>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} style={{ ...inputS, flex: "1 1 100px" }} />
              <span style={{ color: T3, fontSize: 13 }}>〜</span>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} style={{ ...inputS, flex: "1 1 100px" }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(null)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: T2, fontSize: 12, cursor: "pointer" }}>キャンセル</button>
              <button onClick={save} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: GREEN, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>💾 保存</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {events.map(ev => {
          const pct = Math.round(ev.applicants / ev.total * 100);
          return (
            <div key={ev.id} style={{ background: CARD, borderRadius: 14, padding: 18, border: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${typeColor[ev.type]}20`, color: typeColor[ev.type] }}>{typeLabel[ev.type]}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: T1 }}>{ev.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T3 }}>📅 {ev.date}{ev.startTime ? ` 🕐 ${ev.startTime}〜${ev.endTime}` : ""} · {ev.status}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: pct > 80 ? RED : pct > 50 ? ORANGE : GREEN }}>{ev.applicants}<span style={{ fontSize: 12, color: T3 }}>/{ev.total}</span></div>
                  <div style={{ fontSize: 10, color: T3 }}>申込 {pct}%</div>
                </div>
              </div>
              <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: pct > 80 ? RED : pct > 50 ? ORANGE : GREEN, transition: "width 0.5s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== Dashboard (Overview) =====
function DashboardTab() {
  const active = DEMO_MEMBERS.filter(m => m.status === "active").length;
  const newThisMonth = DEMO_MEMBERS.filter(m => m.createdAt >= "2026-02-01" && m.status === "active").length;
  const published = DEMO_NEWS.filter(n => n.status === "published").length;
  const totalApplicants = DEMO_EVENTS.reduce((s, e) => s + e.applicants, 0);

  const weekData = [
    { day: "月", value: 12 }, { day: "火", value: 8 }, { day: "水", value: 15 },
    { day: "木", value: 10 }, { day: "金", value: 18 }, { day: "土", value: 5 }, { day: "日", value: 3 },
  ];
  const maxVal = Math.max(...weekData.map(d => d.value));

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: T1, marginBottom: 16 }}>📊 ダッシュボード</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard icon="👥" label="アクティブ会員" value={active} sub={`今月 +${newThisMonth}名`} color={GREEN} />
        <StatCard icon="📰" label="公開記事数" value={published} color={ACCENT} />
        <StatCard icon="🙋" label="セミナー申込" value={totalApplicants} color={ORANGE} />
        <StatCard icon="💰" label="今月のAPI費用" value="¥180" sub="予算 ¥500以内" color={PURPLE} />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {/* Weekly access chart */}
        <div style={{ flex: "1 1 300px", background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: T1, marginBottom: 16 }}>📈 今週のアクセス</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
            {weekData.map(d => (
              <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10, color: T2, fontWeight: 700 }}>{d.value}</span>
                <div style={{ width: "100%", borderRadius: 4, background: `linear-gradient(180deg, ${ACCENT}, #6366f1)`, height: `${(d.value / maxVal) * 80}px`, minHeight: 4, transition: "height 0.5s" }} />
                <span style={{ fontSize: 10, color: T3 }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div style={{ flex: "1 1 280px", background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: T1, marginBottom: 14 }}>🕐 最近のアクティビティ</h3>
          {[
            { icon: "👤", text: "ホームひだまり が新規登録", time: "2時間前", color: GREEN },
            { icon: "📰", text: "ICT補助金の記事を公開", time: "5時間前", color: ACCENT },
            { icon: "🙋", text: "セミナーに3名申込", time: "昨日", color: ORANGE },
            { icon: "📧", text: "朝のダイジェスト配信完了（7名）", time: "今朝7:05", color: PURPLE },
            { icon: "🚪", text: "ケアステーション虹 が退会", time: "3日前", color: RED },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? `1px solid ${BORDER}` : "none" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: T1 }}>{a.text}</div>
                <div style={{ fontSize: 10, color: T3 }}>{a.time}</div>
              </div>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: a.color, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== Notification Send Panel =====
function NotifyTab() {
  const [type, setType] = useState("digest");
  const [sent, setSent] = useState(false);

  const active = DEMO_MEMBERS.filter(m => m.status === "active");
  const emailOn = active.filter(m => m.emailNotify);
  const pushOn = active.filter(m => m.fcmToken);

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: T1, marginBottom: 16 }}>🔔 通知配信</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon="📧" label="メール配信先" value={`${emailOn.length}名`} color={ACCENT} />
        <StatCard icon="📱" label="プッシュ配信先" value={`${pushOn.length}台`} color={GREEN} />
      </div>

      <div style={{ background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${BORDER}`, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: T1, marginBottom: 14 }}>配信タイプ</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            { id: "digest", label: "📰 朝のダイジェスト", desc: "通常の毎朝配信" },
            { id: "urgent", label: "🚨 緊急通知", desc: "今すぐ全員に配信" },
            { id: "reminder", label: "⏰ リマインド", desc: "期限リマインドを送信" },
          ].map(t => (
            <button key={t.id} onClick={() => { setType(t.id); setSent(false); }} style={{ flex: "1 1 140px", padding: 14, borderRadius: 10, border: `2px solid ${type === t.id ? ACCENT : BORDER}`, background: type === t.id ? `${ACCENT}10` : "transparent", cursor: "pointer", textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: type === t.id ? ACCENT : T1 }}>{t.label}</div>
              <div style={{ fontSize: 10, color: T3, marginTop: 2 }}>{t.desc}</div>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setSent(true)} style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: type === "urgent" ? RED : ACCENT, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
            {type === "urgent" ? "🚨 緊急配信する" : "📤 配信する"}
          </button>
          {sent && (
            <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(16,185,129,0.12)", color: GREEN, fontSize: 12, fontWeight: 700 }}>
              ✅ 配信完了！メール {emailOn.length}名 + プッシュ {pushOn.length}台
            </div>
          )}
        </div>
      </div>

      <div style={{ background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${BORDER}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: T1, marginBottom: 12 }}>📊 配信履歴</h3>
        {[
          { date: "2/23 07:05", type: "📰 ダイジェスト", email: 7, push: 4, status: "✅" },
          { date: "2/22 07:05", type: "📰 ダイジェスト", email: 7, push: 4, status: "✅" },
          { date: "2/21 07:05", type: "📰 ダイジェスト", email: 6, push: 3, status: "✅" },
          { date: "2/20 10:30", type: "🚨 緊急", email: 6, push: 3, status: "✅" },
          { date: "2/20 07:05", type: "📰 ダイジェスト", email: 6, push: 3, status: "✅" },
        ].map((h, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 4 ? `1px solid ${BORDER}` : "none", fontSize: 12 }}>
            <span style={{ color: T3, width: 90, flexShrink: 0 }}>{h.date}</span>
            <span style={{ color: T1, fontWeight: 600, flex: 1 }}>{h.type}</span>
            <span style={{ color: T2 }}>📧{h.email}</span>
            <span style={{ color: T2 }}>📱{h.push}</span>
            <span>{h.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== QR Code Tab =====
function QrTab() {
  const [appUrl, setAppUrl] = useState("https://dripro.vercel.app");
  const [qrSize, setQrSize] = useState(280);
  const [copied, setCopied] = useState(false);
  const [selectedType, setSelectedType] = useState("register");

  const urls = {
    register: { url: `${appUrl}?ref=qr`, label: "新規登録ページ", desc: "QRコードを読み取ると新規登録画面が開きます" },
    login: { url: `${appUrl}/login?ref=qr`, label: "ログインページ", desc: "既存会員がログインする画面" },
    seminar: { url: `${appUrl}/events?ref=qr`, label: "セミナー申込ページ", desc: "セミナー一覧・申込画面に直接遷移" },
  };

  const current = urls[selectedType];
  // Google Charts QR API for demo (本番ではqrcode.jsなどを使用)
  const qrImageUrl = `https://chart.googleapis.com/chart?cht=qr&chs=${qrSize}x${qrSize}&chl=${encodeURIComponent(current.url)}&choe=UTF-8&chld=M|2`;

  const copyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(current.url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: T1, marginBottom: 16 }}>📱 QRコード発行</h2>

      {/* Type selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { id: "register", label: "📝 新規登録", icon: "📝" },
          { id: "login", label: "🔑 ログイン", icon: "🔑" },
          { id: "seminar", label: "📚 セミナー", icon: "📚" },
        ].map(t => (
          <button key={t.id} onClick={() => setSelectedType(t.id)} style={{ flex: "1 1 120px", padding: 14, borderRadius: 10, border: `2px solid ${selectedType === t.id ? ACCENT : BORDER}`, background: selectedType === t.id ? `${ACCENT}15` : "transparent", cursor: "pointer", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: selectedType === t.id ? ACCENT : T1 }}>{t.label}</div>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {/* QR Code display */}
        <div style={{ flex: "0 0 auto", background: CARD, borderRadius: 16, padding: 24, border: `1px solid ${BORDER}`, textAlign: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 16, display: "inline-block", marginBottom: 14 }}>
            {/* SVG QR placeholder since we can't load external images */}
            <svg width={qrSize} height={qrSize} viewBox="0 0 280 280" style={{ display: "block" }}>
              <rect width="280" height="280" fill="#fff"/>
              {/* QR pattern - stylized representation */}
              {/* Position markers */}
              <rect x="20" y="20" width="60" height="60" fill="#000" rx="4"/>
              <rect x="28" y="28" width="44" height="44" fill="#fff" rx="2"/>
              <rect x="36" y="36" width="28" height="28" fill="#000" rx="2"/>
              <rect x="200" y="20" width="60" height="60" fill="#000" rx="4"/>
              <rect x="208" y="28" width="44" height="44" fill="#fff" rx="2"/>
              <rect x="216" y="36" width="28" height="28" fill="#000" rx="2"/>
              <rect x="20" y="200" width="60" height="60" fill="#000" rx="4"/>
              <rect x="28" y="208" width="44" height="44" fill="#fff" rx="2"/>
              <rect x="36" y="216" width="28" height="28" fill="#000" rx="2"/>
              {/* Data modules */}
              {Array.from({length: 30}, (_, i) => {
                const seed = (i * 7 + 13) % 17;
                return Array.from({length: 30}, (_, j) => {
                  const v = ((i * 3 + j * 7 + seed) % 5);
                  if (v < 2 && i > 4 && j > 4 && !(i > 20 && j < 8) && !(i < 8 && j > 20) && !(i < 8 && j < 8)) {
                    return <rect key={`${i}-${j}`} x={20 + j * 8} y={20 + i * 8} width="7" height="7" fill="#000" rx="1"/>;
                  }
                  return null;
                });
              })}
              {/* Center logo */}
              <rect x="115" y="115" width="50" height="50" fill="#fff" rx="8"/>
              <rect x="120" y="120" width="40" height="40" fill="#3b82f6" rx="6"/>
              <text x="140" y="146" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="900">D</text>
            </svg>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 4 }}>{current.label}</div>
          <div style={{ fontSize: 11, color: T3 }}>{current.desc}</div>
        </div>

        {/* Settings & Actions */}
        <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* URL */}
          <div style={{ background: CARD, borderRadius: 14, padding: 18, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T2, marginBottom: 8 }}>🔗 リンクURL</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={current.url} readOnly style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)", color: T1, fontSize: 12, outline: "none", fontFamily: "monospace" }} />
              <button onClick={copyUrl} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: copied ? GREEN : ACCENT, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {copied ? "✅ コピー済" : "📋 コピー"}
              </button>
            </div>
          </div>

          {/* Usage guide */}
          <div style={{ background: CARD, borderRadius: 14, padding: 18, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T2, marginBottom: 10 }}>💡 活用方法</div>
            {[
              { icon: "🏢", text: "セミナー会場で配布するチラシに印刷", desc: "参加者がその場で登録できます" },
              { icon: "📧", text: "メール署名やメルマガに掲載", desc: "テキストリンクとQRの両方を載せると効果的" },
              { icon: "🤝", text: "営業・訪問時に名刺と一緒に渡す", desc: "スマホで読み取ってすぐ登録" },
              { icon: "📱", text: "LINE・SNSで画像をシェア", desc: "QR画像を保存して共有" },
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 3 ? `1px solid ${BORDER}` : "none" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{tip.icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: T1, fontWeight: 600 }}>{tip.text}</div>
                  <div style={{ fontSize: 10, color: T3 }}>{tip.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Print / Download buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => alert("🖨️ 印刷用PDFを生成します（本番実装時）")} style={{ flex: "1 1 140px", padding: 13, borderRadius: 10, border: `1px solid ${BORDER}`, background: CARD, color: T1, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              🖨️ 印刷用PDF
            </button>
            <button onClick={() => alert("💾 QR画像をダウンロードします（本番実装時）")} style={{ flex: "1 1 140px", padding: 13, borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              💾 画像を保存
            </button>
          </div>

          {/* Stats */}
          <div style={{ background: CARD, borderRadius: 14, padding: 18, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T2, marginBottom: 10 }}>📊 QR経由の登録数</div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: GREEN }}>12</div>
                <div style={{ fontSize: 10, color: T3 }}>今月</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: ACCENT }}>47</div>
                <div style={{ fontSize: 10, color: T3 }}>累計</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: ORANGE }}>68%</div>
                <div style={{ fontSize: 10, color: T3 }}>全登録中のQR比率</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Main Admin App =====
const SIDEBAR_ITEMS = [
  { id: "dashboard", icon: "📊", label: "ダッシュボード" },
  { id: "members", icon: "👥", label: "会員管理" },
  { id: "news", icon: "📰", label: "ニュース管理" },
  { id: "events", icon: "📚", label: "セミナー管理" },
  { id: "notify", icon: "🔔", label: "通知配信" },
  { id: "qr", icon: "📱", label: "QRコード発行" },
];

export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} />;

  const renderTab = () => {
    switch (tab) {
      case "dashboard": return <DashboardTab />;
      case "members": return <MembersTab />;
      case "news": return <NewsTab />;
      case "events": return <EventsTab />;
      case "notify": return <NotifyTab />;
      case "qr": return <QrTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: FONT, display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        body { background: ${BG}; }
        @media (max-width: 768px) {
          .admin-sidebar { position: fixed !important; z-index: 100; transform: translateX(${sidebarOpen ? "0" : "-100%"}); transition: transform 0.25s ease; }
          .admin-overlay { display: ${sidebarOpen ? "block" : "none"}; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; }
        }
        @media (min-width: 769px) {
          .admin-sidebar { position: relative !important; transform: none !important; }
          .admin-overlay { display: none !important; }
          .mobile-header { display: none !important; }
        }
      `}</style>

      {/* Mobile overlay */}
      <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className="admin-sidebar" style={{ width: 220, background: CARD, borderRight: `1px solid ${BORDER}`, padding: "20px 0", flexShrink: 0, height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
        <div style={{ padding: "0 16px 20px", borderBottom: `1px solid ${BORDER}`, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${ACCENT}, #6366f1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔐</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: T1 }}>ドリプロ</div>
              <div style={{ fontSize: 10, color: T3 }}>管理画面</div>
            </div>
          </div>
        </div>
        {SIDEBAR_ITEMS.map(item => (
          <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", border: "none", background: tab === item.id ? `${ACCENT}15` : "transparent", color: tab === item.id ? ACCENT : T2, fontSize: 13, fontWeight: tab === item.id ? 700 : 500, cursor: "pointer", textAlign: "left", borderLeft: tab === item.id ? `3px solid ${ACCENT}` : "3px solid transparent" }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <div style={{ padding: "16px 20px", marginTop: "auto", borderTop: `1px solid ${BORDER}` }}>
          <button onClick={() => setLoggedIn(false)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: RED, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🚪 ログアウト</button>
        </div>
        <div style={{ padding: "8px 20px" }}>
          <div style={{ fontSize: 10, color: T3 }}>ユーザー用アプリ:</div>
          <div style={{ fontSize: 10, color: ACCENT, marginTop: 2 }}>https://dripro.vercel.app</div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "24px", overflowY: "auto", minHeight: "100vh" }}>
        {/* Mobile header */}
        <div className="mobile-header" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ padding: "8px", borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD, color: T1, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>☰</button>
          <div style={{ fontSize: 15, fontWeight: 800, color: T1 }}>🔐 ドリプロ管理画面</div>
        </div>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {renderTab()}
        </div>
      </main>
    </div>
  );
}

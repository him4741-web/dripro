import { useState, useEffect, useRef } from "react";
import { db, auth } from "./firebase";
import {
  collection, onSnapshot, query, orderBy, addDoc, updateDoc,
  doc, serverTimestamp, deleteDoc, getDocs, where, getDoc, setDoc, limit
} from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

// ============================================================
// THEME
// ============================================================
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

// EmailJS設定
const EMAILJS_SERVICE_ID = "service_xrj9cgj";
const EMAILJS_TEMPLATE_ID = "template_4u1iz2i";
const EMAILJS_PUBLIC_KEY = "mK2lHG-ZB-M3omVNL";

const catLabel = { law: "⚖️ 法改正", reward: "💰 報酬", subsidy: "🏦 補助金" };
const catColor = { law: ACCENT, reward: ORANGE, subsidy: PURPLE };

// ============================================================
// COMPONENTS
// ============================================================
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

// ============================================================
// ADMIN LOGIN
// ============================================================
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const inp = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)",
    color: T1, fontSize: 14, outline: "none", marginBottom: 10, display: "block", fontFamily: FONT
  };
  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      const r = await signInWithEmailAndPassword(auth, email, pass);
      const snap = await getDoc(doc(db, "users", r.user.uid));
      const data = snap.exists() ? snap.data() : {};
      if (data.role !== "admin") { await signOut(auth); setErr("管理者権限がありません"); }
      else { onLogin(r.user, data); }
    } catch (e2) {
      const M = {
        "auth/wrong-password": "パスワードが違います",
        "auth/user-not-found": "メールアドレスが登録されていません",
        "auth/invalid-credential": "メールアドレスまたはパスワードが違います",
      };
      setErr(M[e2.code] || "ログインエラー");
    } finally { setLoading(false); }
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, fontFamily: FONT }}>
      <div style={{ width: "100%", maxWidth: 380, padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: T1, margin: "0 0 4px" }}>ドリプロ管理画面</h1>
          <p style={{ fontSize: 12, color: T3 }}>管理者専用ログイン</p>
        </div>
        <form onSubmit={handleLogin} style={{ background: CARD, borderRadius: 16, padding: 24, border: `1px solid ${BORDER}` }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="管理者メールアドレス" required style={inp} />
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="パスワード" required style={{ ...inp, marginBottom: err ? 6 : 0 }} />
          {err && <div style={{ fontSize: 12, color: RED, marginBottom: 10 }}>⚠ {err}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", background: loading ? BORDER : `linear-gradient(135deg, ${ACCENT}, #6366f1)`, color: "#fff", fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", marginTop: 8 }}>
            {loading ? "処理中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD TAB
// ============================================================
function DashboardTab({ members, news, seminarEntries, chatReports }) {
  const active = members.filter(m => m.status === "active").length;
  const newThisMonth = members.filter(m => {
    if (!m.createdAt) return false;
    const d = m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const published = news.filter(n => n.status === "published").length;
  const pendingReports = chatReports.filter(r => r.status === "pending").length;

  // 直近7日の会員登録数（リアルデータ）
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = ["日","月","火","水","木","金","土"][d.getDay()];
    const count = members.filter(m => {
      if (!m.createdAt) return false;
      const md = m.createdAt.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
      return md.toDateString() === d.toDateString();
    }).length;
    return { day: dayLabel, value: count };
  });
  const maxVal = Math.max(...weekData.map(d => d.value), 1);

  // カテゴリ分布
  const catCounts = { law: 0, reward: 0, subsidy: 0 };
  news.forEach(n => { if (catCounts[n.cat] !== undefined) catCounts[n.cat]++; });

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: T1, marginBottom: 16 }}>📊 ダッシュボード</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard icon="👥" label="アクティブ会員" value={active} sub={`今月 +${newThisMonth}名`} color={GREEN} />
        <StatCard icon="📰" label="公開記事数" value={published} color={ACCENT} />
        <StatCard icon="🙋" label="セミナー申込" value={seminarEntries.length} color={ORANGE} />
        <StatCard icon="🚨" label="通報対応待ち" value={pendingReports} color={pendingReports > 0 ? RED : T3} />
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px", background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: T1, marginBottom: 16 }}>📈 直近7日の新規会員</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
            {weekData.map(d => (
              <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10, color: T2, fontWeight: 700 }}>{d.value}</span>
                <div style={{ width: "100%", borderRadius: 4, background: `linear-gradient(180deg, ${ACCENT}, #6366f1)`, height: `${(d.value / maxVal) * 80}px`, minHeight: 4 }} />
                <span style={{ fontSize: 10, color: T3 }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: "1 1 260px", background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: T1, marginBottom: 14 }}>📰 ニュースカテゴリ</h3>
          {Object.entries(catCounts).map(([cat, cnt]) => {
            const pct = news.length ? Math.round(cnt / news.length * 100) : 0;
            return (
              <div key={cat} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: catColor[cat] }}>{catLabel[cat]}</span>
                  <span style={{ fontSize: 11, color: T3 }}>{cnt}件 ({pct}%)</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: catColor[cat] }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ flex: "1 1 280px", background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: T1, marginBottom: 14 }}>🕐 最近の活動</h3>
          {members.slice(0, 3).map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 16 }}>👤</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: T1 }}>{m.company || m.name || m.email} が登録</div>
                <div style={{ fontSize: 10, color: T3 }}>{m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString("ja-JP") : "近日"}</div>
              </div>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: GREEN }} />
            </div>
          ))}
          {news.filter(n => n.status === "published").slice(0, 2).map((n, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 16 }}>📰</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: T1 }}>{n.title?.substring(0, 20)}... 公開</div>
                <div style={{ fontSize: 10, color: T3 }}>{n.date || "近日"}</div>
              </div>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: ACCENT }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MEMBER DETAIL MODAL
// ============================================================
function MemberDetailModal({ member, onClose }) {
  if (!member) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: CARD, borderRadius: 16, padding: 24, border: `1px solid ${BORDER}`, maxWidth: 480, width: "100%", maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: T1 }}>👤 会員詳細</h3>
          <button onClick={onClose} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: T2, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg, ${ACCENT}, #6366f1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
            {(member.name || member.email || "?")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: T1 }}>{member.name || "名前未設定"}</div>
            <div style={{ fontSize: 12, color: T2 }}>{member.email}</div>
            <div style={{ fontSize: 11, color: T3 }}>{member.company || "会社名未設定"}</div>
          </div>
        </div>
        {[
          { label: "UID", value: member.uid },
          { label: "役職", value: member.position || "—" },
          { label: "電話番号", value: member.phone || "—" },
          { label: "ロール", value: member.role === "admin" ? "👑 管理者" : "👤 会員" },
          { label: "ステータス", value: member.status === "active" ? "✅ 有効" : "🚪 退会" },
          { label: "メール通知", value: member.emailNotify ? "✅ ON" : "— OFF" },
          { label: "プッシュ通知", value: member.fcmToken ? "✅ ON" : "— OFF" },
          { label: "登録日", value: member.createdAt?.toDate ? member.createdAt.toDate().toLocaleString("ja-JP") : member.createdAt || "—" },
        ].map(row => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 12, color: T3, fontWeight: 700 }}>{row.label}</span>
            <span style={{ fontSize: 12, color: T1, maxWidth: 280, textAlign: "right", wordBreak: "break-all" }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MEMBERS TAB
// ============================================================
function MembersTab({ members }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState(null);
  const [sortBy, setSortBy] = useState("createdAt");

  const active = members.filter(m => m.status === "active");
  const emailOn = members.filter(m => m.emailNotify && m.status === "active");
  const pushOn = members.filter(m => m.fcmToken && m.status === "active");

  const filtered = members
    .filter(m => {
      if (filter === "active" && m.status !== "active") return false;
      if (filter === "inactive" && m.status !== "inactive") return false;
      if (filter === "admin" && m.role !== "admin") return false;
      if (search && !m.email?.includes(search) && !m.company?.includes(search) && !m.name?.includes(search)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "company") return (a.company || "").localeCompare(b.company || "");
      const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const db2 = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return db2 - da;
    });

  const toggleStatus = async (m) => {
    const newStatus = m.status === "active" ? "inactive" : "active";
    await updateDoc(doc(db, "users", m.uid), { status: newStatus });
  };
  const makeAdmin = async (m) => {
    if (!window.confirm(`${m.name || m.email} を管理者に変更しますか？`)) return;
    await updateDoc(doc(db, "users", m.uid), { role: "admin" });
  };

  return (
    <div>
      {selectedMember && <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
      <h2 style={{ fontSize: 18, fontWeight: 900, color: T1, marginBottom: 16 }}>👥 会員管理</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon="👥" label="アクティブ会員" value={active.length} sub={`全${members.length}名中`} color={GREEN} />
        <StatCard icon="📧" label="メール通知ON" value={emailOn.length} sub={`${active.length ? Math.round(emailOn.length / active.length * 100) : 0}%`} color={ACCENT} />
        <StatCard icon="📱" label="プッシュ通知ON" value={pushOn.length} color={ORANGE} />
        <StatCard icon="🚪" label="退会済み" value={members.filter(m => m.status === "inactive").length} color={RED} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 名前・メール・会社名で検索"
          style={{ flex: "1 1 200px", padding: "10px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)", color: T1, fontSize: 13, outline: "none" }} />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD, color: T2, fontSize: 12, cursor: "pointer" }}>
          <option value="createdAt">登録日順</option>
          <option value="name">名前順</option>
          <option value="company">会社名順</option>
        </select>
        {["all", "active", "inactive", "admin"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: filter === f ? ACCENT : CARD, color: filter === f ? "#fff" : T2, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {f === "all" ? "すべて" : f === "active" ? "アクティブ" : f === "inactive" ? "退会済み" : "管理者"}
          </button>
        ))}
      </div>
      <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["名前", "会社名", "メール", "ロール", "ステータス", "メール通知", "登録日", "操作"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: T3, fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.uid} style={{ borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }} onClick={() => setSelectedMember(m)}>
                  <td style={{ padding: "10px 14px", color: T1, fontWeight: 700, whiteSpace: "nowrap" }}>{m.name || "—"}</td>
                  <td style={{ padding: "10px 14px", color: T1, whiteSpace: "nowrap" }}>{m.company || "—"}</td>
                  <td style={{ padding: "10px 14px", color: T2, whiteSpace: "nowrap" }}>{m.email}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: m.role === "admin" ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.1)", color: m.role === "admin" ? PURPLE : ACCENT }}>
                      {m.role === "admin" ? "管理者" : "会員"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <button onClick={e => { e.stopPropagation(); toggleStatus(m); }} style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", background: m.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: m.status === "active" ? GREEN : RED }}>
                      {m.status === "active" ? "✅ 有効" : "🚪 退会"}
                    </button>
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>{m.emailNotify ? "✅" : "—"}</td>
                  <td style={{ padding: "10px 14px", color: T3, whiteSpace: "nowrap" }}>
                    {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString("ja-JP") : m.createdAt || "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }} onClick={e => e.stopPropagation()}>
                    {m.role !== "admin" && (
                      <button onClick={() => makeAdmin(m)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: PURPLE, fontSize: 10, cursor: "pointer" }}>
                        管理者に
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div style={{ padding: 32, textAlign: "center", color: T3, fontSize: 13 }}>該当する会員がいません</div>}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: T3 }}>※ 行をクリックで詳細表示</div>
    </div>
  );
}

// ============================================================
// NEWS TAB
// ============================================================
function NewsTab({ news, setNews }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({
    title: "", cat: "subsidy", importance: "high", summary: "", advice: "",
    attachments: [], linkUrl: "", linkLabel: ""
  });
  const inputS = {
    width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,0.04)", color: T1, fontSize: 13, outline: "none", fontFamily: FONT
  };
  const startNew = () => {
    setForm({ title: "", cat: "subsidy", importance: "high", summary: "", advice: "", attachments: [], linkUrl: "", linkLabel: "" });
    setEditing("new"); setPreview(false);
  };
  const startEdit = (item) => {
    setForm({ title: item.title || "", cat: item.cat || "subsidy", importance: item.importance || "high",
      summary: item.summary || "", advice: item.advice || "", attachments: item.attachments || [],
      linkUrl: item.linkUrl || "", linkLabel: item.linkLabel || "" });
    setEditing(item.id); setPreview(false);
  };
  const save = async (publish) => {
    if (!form.title) return;
    setSaving(true);
    const data = { ...form, date: new Date().toISOString().slice(0, 10), status: publish ? "published" : "draft", read: "3分", source: "厚生労働省" };
    try {
      if (editing === "new") { await addDoc(collection(db, "news"), { ...data, createdAt: serverTimestamp() }); }
      else { await updateDoc(doc(db, "news", editing), data); }
      setEditing(null);
    } catch(e) { console.error(e); }
    setSaving(false);
  };
  const togglePublish = async (item) => {
    try { await updateDoc(doc(db, "news", item.id), { status: item.status === "published" ? "draft" : "published" }); }
    catch(e) { console.error(e); }
  };
  const deleteNews = async (item) => {
    if (!window.confirm("この記事を削除しますか？")) return;
    try { await deleteDoc(doc(db, "news", item.id)); } catch(e) { console.error(e); }
  };
  const fileIcon = (type) => ({ PDF: "📄", XLSX: "📊", XLS: "📊", CSV: "📊", DOCX: "📝", DOC: "📝", PNG: "🖼️", JPG: "🖼️" }[type] || "📎");
  const addFile = (e) => {
    const files = Array.from(e.target.files);
    const newA = files.map(f => ({ name: f.name, size: (f.size / 1024).toFixed(0) + "KB", type: f.name.split(".").pop().toUpperCase() }));
    setForm({ ...form, attachments: [...form.attachments, ...newA] });
    e.target.value = "";
  };
  const published = news.filter(n => n.status === "published").length;
  const drafts = news.filter(n => n.status === "draft").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: T1 }}>📰 ニュース管理</h2>
        <button onClick={startNew} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>＋ 新規作成</button>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon="📰" label="公開中" value={published} color={GREEN} />
        <StatCard icon="📝" label="下書き" value={drafts} color={ORANGE} />
        <StatCard icon="🏦" label="補助金記事" value={news.filter(n => n.cat === "subsidy").length} color={PURPLE} />
        <StatCard icon="📚" label="全記事数" value={news.length} color={T2} />
      </div>

      {editing && (
        <div style={{ background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${ACCENT}`, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: T1 }}>{editing === "new" ? "📝 新規ニュース" : "✏️ 編集"}</h3>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPreview(!preview)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: preview ? `${ACCENT}20` : "transparent", color: preview ? ACCENT : T2, fontSize: 11, cursor: "pointer" }}>
                {preview ? "✏️ 編集" : "👁 プレビュー"}
              </button>
            </div>
          </div>
          {preview ? (
            <div style={{ background: BG, borderRadius: 12, padding: 20, border: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${catColor[form.cat]}20`, color: catColor[form.cat] }}>{catLabel[form.cat]}</span>
                {form.importance === "high" && <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: "rgba(239,68,68,0.15)", color: RED }}>重要</span>}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: T1, marginBottom: 12 }}>{form.title || "タイトル未入力"}</h2>
              <p style={{ fontSize: 13, color: T2, lineHeight: 1.7, marginBottom: 12 }}>{form.summary || "要約未入力"}</p>
              {form.advice && <div style={{ background: `${ACCENT}10`, borderLeft: `3px solid ${ACCENT}`, padding: "10px 14px", borderRadius: 6, fontSize: 12, color: T1 }}>💡 {form.advice}</div>}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="タイトル *" style={inputS} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} style={{ ...inputS, flex: 1, appearance: "none", cursor: "pointer" }}>
                  <option value="law">⚖️ 法改正</option>
                  <option value="reward">💰 報酬加算</option>
                  <option value="subsidy">🏦 補助金</option>
                </select>
                <select value={form.importance} onChange={e => setForm({ ...form, importance: e.target.value })} style={{ ...inputS, flex: 1, appearance: "none", cursor: "pointer" }}>
                  <option value="high">🔴 重要</option>
                  <option value="med">🟡 注目</option>
                  <option value="low">⚪ 通常</option>
                </select>
              </div>
              <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="要約・説明" rows={3} style={{ ...inputS, resize: "vertical" }} />
              <textarea value={form.advice} onChange={e => setForm({ ...form, advice: e.target.value })} placeholder="💡 推薦アクション（会員へのアドバイス）" rows={2} style={{ ...inputS, resize: "vertical" }} />
              <div style={{ border: `1px dashed ${BORDER}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T2 }}>📎 添付ファイル</span>
                  <label style={{ padding: "6px 14px", borderRadius: 8, background: `${ACCENT}15`, color: ACCENT, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    ＋ 追加<input type="file" multiple accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.png,.jpg" onChange={addFile} style={{ display: "none" }} />
                  </label>
                </div>
                {form.attachments.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: `1px solid ${BORDER}`, marginBottom: 6 }}>
                    <span>{fileIcon(f.type)}</span>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: T1 }}>{f.name}</div><div style={{ fontSize: 10, color: T3 }}>{f.type} · {f.size}</div></div>
                    <button onClick={() => setForm({ ...form, attachments: form.attachments.filter((_, j) => j !== i) })} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.1)", color: RED, fontSize: 11, cursor: "pointer" }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ border: `1px dashed ${BORDER}`, borderRadius: 10, padding: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T2, display: "block", marginBottom: 8 }}>🔗 外部リンク（任意）</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." style={{ ...inputS, flex: "2 1 200px" }} />
                  <input value={form.linkLabel} onChange={e => setForm({ ...form, linkLabel: e.target.value })} placeholder="リンク名" style={{ ...inputS, flex: "1 1 120px" }} />
                </div>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 14 }}>
            <button onClick={() => setEditing(null)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: T2, fontSize: 12, cursor: "pointer" }}>キャンセル</button>
            <button onClick={() => save(false)} disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: ORANGE, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📝 下書き保存</button>
            <button onClick={() => save(true)} disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: GREEN, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🚀 公開する</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {news.map(item => (
          <div key={item.id} style={{ background: CARD, borderRadius: 12, padding: "14px 18px", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ width: 4, height: 36, borderRadius: 2, background: catColor[item.cat] || ACCENT, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T1 }}>{item.title}</span>
                {item.importance === "high" && <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "rgba(239,68,68,0.15)", color: RED }}>重要</span>}
                {item.status === "draft" && <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "rgba(245,158,11,0.15)", color: ORANGE }}>下書き</span>}
                {item.attachments?.length > 0 && <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "rgba(59,130,246,0.12)", color: ACCENT }}>📎 {item.attachments.length}件</span>}
              </div>
              <div style={{ fontSize: 11, color: T3 }}>
                <span style={{ color: catColor[item.cat] }}>{catLabel[item.cat]}</span> · {item.date}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => startEdit(item)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: T2, fontSize: 11, cursor: "pointer" }}>✏️ 編集</button>
              <button onClick={() => togglePublish(item)} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: item.status === "published" ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)", color: item.status === "published" ? GREEN : ACCENT, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {item.status === "published" ? "✅ 公開中" : "📄 公開する"}
              </button>
              <button onClick={() => deleteNews(item)} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.08)", color: RED, fontSize: 11, cursor: "pointer" }}>🗑</button>
            </div>
          </div>
        ))}
        {news.length === 0 && <div style={{ padding: 32, textAlign: "center", color: T3, fontSize: 13 }}>ニュースがまだありません</div>}
      </div>
    </div>
  );
}

// ============================================================
// EVENTS TAB
// ============================================================
function EventsTab({ seminarEntries }) {
  const [events, setEvents] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", type: "seminar", date: "", startTime: "", endTime: "", total: 30, description: "" });
  const inputS = {
    width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,0.04)", color: T1, fontSize: 13, outline: "none", fontFamily: FONT
  };
  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => { setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))); }, () => {});
    return () => unsub();
  }, []);
  const saveEvent = async () => {
    if (!form.title) return;
    const data = { ...form, status: "公開中", applicants: 0, createdAt: serverTimestamp() };
    if (editing === "new") { await addDoc(collection(db, "events"), data); }
    else { await updateDoc(doc(db, "events", editing), { ...form }); }
    setEditing(null);
  };
  const deleteEvent = async (id) => {
    if (!window.confirm("削除しますか？")) return;
    await deleteDoc(doc(db, "events", id));
  };
  const typeLabel = { study: "📖 勉強会", seminar: "🎤 セミナー", consul: "💼 コンサル" };
  const typeColor = { study: ACCENT, seminar: GREEN, consul: ORANGE };
  const totalApplicants = seminarEntries.length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: T1 }}>📚 セミナー・イベント管理</h2>
        <button onClick={() => { setForm({ title: "", type: "seminar", date: "", startTime: "", endTime: "", total: 30, description: "" }); setEditing("new"); }}
          style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>＋ 新規作成</button>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon="📅" label="イベント数" value={events.length} color={ACCENT} />
        <StatCard icon="🙋" label="総申込数" value={totalApplicants} color={GREEN} />
      </div>
      {editing && (
        <div style={{ background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${ACCENT}`, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T1, marginBottom: 14 }}>📝 イベント作成</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="イベント名 *" style={inputS} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ ...inputS, flex: "1 1 120px", appearance: "none" }}>
                <option value="seminar">🎤 セミナー</option>
                <option value="study">📖 勉強会</option>
                <option value="consul">💼 コンサル</option>
              </select>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ ...inputS, flex: "1 1 130px" }} />
              <input type="number" value={form.total} onChange={e => setForm({ ...form, total: +e.target.value })} placeholder="定員" style={{ ...inputS, flex: "0 0 80px" }} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: T2, flexShrink: 0 }}>🕐 時間</span>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} style={{ ...inputS, flex: 1 }} />
              <span style={{ color: T3 }}>〜</span>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} style={{ ...inputS, flex: 1 }} />
            </div>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="イベント説明（任意）" rows={2} style={{ ...inputS, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(null)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: T2, fontSize: 12, cursor: "pointer" }}>キャンセル</button>
              <button onClick={saveEvent} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: GREEN, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>💾 保存</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {events.map(ev => {
          const pct = ev.total ? Math.round((ev.applicants || 0) / ev.total * 100) : 0;
          return (
            <div key={ev.id} style={{ background: CARD, borderRadius: 14, padding: 18, border: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${typeColor[ev.type] || ACCENT}20`, color: typeColor[ev.type] || ACCENT }}>{typeLabel[ev.type] || ev.type}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: T1 }}>{ev.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T3 }}>📅 {ev.date}{ev.startTime ? ` 🕐 ${ev.startTime}〜${ev.endTime}` : ""}</div>
                  {ev.description && <div style={{ fontSize: 11, color: T2, marginTop: 4 }}>{ev.description}</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: pct > 80 ? RED : pct > 50 ? ORANGE : GREEN }}>{ev.applicants || 0}<span style={{ fontSize: 12, color: T3 }}>/{ev.total}</span></div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => { setForm({ title: ev.title || "", type: ev.type || "seminar", date: ev.date || "", startTime: ev.startTime || "", endTime: ev.endTime || "", total: ev.total || 30, description: ev.description || "" }); setEditing(ev.id); }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: T2, fontSize: 10, cursor: "pointer" }}>編集</button>
                    <button onClick={() => deleteEvent(ev.id)} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.08)", color: RED, fontSize: 10, cursor: "pointer" }}>削除</button>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: pct > 80 ? RED : pct > 50 ? ORANGE : GREEN }} />
              </div>
            </div>
          );
        })}
      </div>
      {seminarEntries.length > 0 && (
        <div style={{ background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T1, marginBottom: 14 }}>🙋 申込者一覧</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["イベント名", "ユーザーID", "申込日時"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: T3, fontSize: 11, fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seminarEntries.slice(0, 20).map((e, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "8px 12px", color: T1 }}>{e.eventTitle || e.eventId}</td>
                    <td style={{ padding: "8px 12px", color: T2 }}>{e.uid?.substring(0, 12)}...</td>
                    <td style={{ padding: "8px 12px", color: T3 }}>{e.createdAt?.toDate ? e.createdAt.toDate().toLocaleString("ja-JP") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CHAT REPORTS TAB
// ============================================================
function ChatReportsTab({ chatReports }) {
  const [filter, setFilter] = useState("pending");
  const filtered = chatReports.filter(r => filter === "all" ? true : r.status === filter);
  const resolve = async (id) => { await updateDoc(doc(db, "chat_reports", id), { status: "resolved", resolvedAt: serverTimestamp() }); };
  const dismiss = async (id) => { await updateDoc(doc(db, "chat_reports", id), { status: "dismissed" }); };
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: T1, marginBottom: 16 }}>🚨 チャット通報管理</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon="🚨" label="対応待ち" value={chatReports.filter(r => r.status === "pending").length} color={RED} />
        <StatCard icon="✅" label="解決済み" value={chatReports.filter(r => r.status === "resolved").length} color={GREEN} />
        <StatCard icon="📊" label="総通報数" value={chatReports.length} color={T2} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["pending", "resolved", "dismissed", "all"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: filter === f ? ACCENT : CARD, color: filter === f ? "#fff" : T2, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {f === "pending" ? "🚨 対応待ち" : f === "resolved" ? "✅ 解決済" : f === "dismissed" ? "🚫 無視" : "すべて"}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(r => (
          <div key={r.id} style={{ background: CARD, borderRadius: 12, padding: 18, border: `1px solid ${r.status === "pending" ? RED + "40" : BORDER}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: r.status === "pending" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.12)", color: r.status === "pending" ? RED : GREEN }}>
                    {r.status === "pending" ? "🚨 対応待ち" : r.status === "resolved" ? "✅ 解決" : "🚫 無視"}
                  </span>
                  <span style={{ fontSize: 11, color: T3 }}>{r.reason || "通報"}</span>
                  <span style={{ fontSize: 11, color: T3, marginLeft: "auto" }}>{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString("ja-JP") : "—"}</span>
                </div>
                <div style={{ fontSize: 12, color: T1, fontWeight: 600, marginBottom: 4 }}>💬 通報対象メッセージ:</div>
                <div style={{ fontSize: 13, color: T2, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px", border: `1px solid ${BORDER}`, lineHeight: 1.6 }}>
                  {r.msgText || "(テキストなし)"}
                </div>
                <div style={{ fontSize: 11, color: T3, marginTop: 6 }}>
                  👤 投稿者: {r.msgUser || "—"} · 🚨 通報者ID: {r.reporterUid?.substring(0, 10) || "—"}...
                </div>
              </div>
              {r.status === "pending" && (
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => resolve(r.id)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "rgba(239,68,68,0.15)", color: RED, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🗑 投稿単位で対応</button>
                  <button onClick={() => dismiss(r.id)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: T2, fontSize: 12, cursor: "pointer" }}>無視</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 48, textAlign: "center", color: T3, fontSize: 13 }}>該当する通報がありません 🎉</div>}
      </div>
    </div>
  );
}

// ============================================================
// NOTIFY TAB (EmailJS実装)
// ============================================================
function NotifyTab({ members, news }) {
  const [type, setType] = useState("digest");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [sentCount, setSentCount] = useState(0);

  const active = members.filter(m => m.status === "active");
  const emailOn = active.filter(m => m.emailNotify);
  const pushOn = active.filter(m => m.fcmToken);

  const latestNews = news.filter(n => n.status === "published").slice(0, 3);

  const getDefaultContent = () => {
    if (type === "digest") {
      return {
        subject: "【ドリプロ】本日のニュースダイジェスト",
        body: latestNews.map((n, i) => `${i+1}. ${n.title}\n${n.summary || ""}`).join("\n\n") || "最新情報をお届けします。"
      };
    }
    if (type === "urgent") return { subject: "【重要・緊急】ドリプロからのお知らせ", body: "緊急のお知らせがあります。管理画面をご確認ください。" };
    if (type === "reminder") return { subject: "【リマインド】期限が近づいています", body: "申請期限が近づいているものがあります。ご確認ください。" };
    return { subject: customSubject, body: customBody };
  };

  const sendEmails = async () => {
    setSending(true); setResult(null); setSentCount(0);
    const targets = emailOn.filter(m => m.email);
    const { subject, body } = type === "custom" ? { subject: customSubject, body: customBody } : getDefaultContent();

    if (!subject || !body) { setResult({ ok: false, msg: "件名と本文を入力してください" }); setSending(false); return; }
    if (targets.length === 0) { setResult({ ok: false, msg: "配信先がいません（メール通知ONの会員が必要です）" }); setSending(false); return; }

    let successCount = 0;
    // EmailJS経由で送信（無料プランは1通ずつ）
    for (const member of targets) {
      try {
        const params = {
          to_email: member.email,
          to_name: member.name || member.company || "会員",
          subject,
          message: body,
          from_name: "ドリプロ管理チーム",
        };
        await fetch(`https://api.emailjs.com/api/v1.0/email/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_PUBLIC_KEY,
            template_params: params
          })
        });
        successCount++;
        setSentCount(successCount);
      } catch (err) {
        console.warn("メール送信失敗:", member.email, err);
      }
    }
    // 配信履歴をFirestoreに記録
    try {
      await addDoc(collection(db, "notify_logs"), {
        type, subject, targetCount: targets.length, successCount,
        sentAt: serverTimestamp(), sentBy: "admin"
      });
    } catch(e) {}
    setSending(false);
    setResult({ ok: true, msg: `✅ ${successCount}/${targets.length}名に配信完了！` });
  };

  const inputS = {
    width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,0.04)", color: T1, fontSize: 13, outline: "none", fontFamily: FONT
  };
  const defaultContent = getDefaultContent();

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
            { id: "digest", label: "📰 朝のダイジェスト", desc: "最新ニュース3件をまとめて配信" },
            { id: "urgent", label: "🚨 緊急通知", desc: "今すぐ全員に配信" },
            { id: "reminder", label: "⏰ リマインド", desc: "期限リマインドを送信" },
            { id: "custom", label: "✏️ カスタム", desc: "内容を自由に入力" },
          ].map(t => (
            <button key={t.id} onClick={() => { setType(t.id); setResult(null); }} style={{ flex: "1 1 140px", padding: 14, borderRadius: 10, border: `2px solid ${type === t.id ? ACCENT : BORDER}`, background: type === t.id ? `${ACCENT}10` : "transparent", cursor: "pointer", textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: type === t.id ? ACCENT : T1 }}>{t.label}</div>
              <div style={{ fontSize: 10, color: T3, marginTop: 2 }}>{t.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ background: BG, borderRadius: 10, padding: 14, border: `1px solid ${BORDER}`, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T3, marginBottom: 6 }}>📋 送信内容プレビュー</div>
          {type === "custom" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={customSubject} onChange={e => setCustomSubject(e.target.value)} placeholder="件名 *" style={inputS} />
              <textarea value={customBody} onChange={e => setCustomBody(e.target.value)} placeholder="本文 *" rows={4} style={{ ...inputS, resize: "vertical" }} />
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: T1, marginBottom: 4 }}>件名: {defaultContent.subject}</div>
              <div style={{ fontSize: 11, color: T2, lineHeight: 1.6, whiteSpace: "pre-line" }}>{defaultContent.body}</div>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={sendEmails} disabled={sending} style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: type === "urgent" ? RED : ACCENT, color: "#fff", fontSize: 14, fontWeight: 800, cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.7 : 1 }}>
            {sending ? `📤 送信中... (${sentCount}件)` : type === "urgent" ? "🚨 緊急配信する" : "📤 配信する"}
          </button>
          {result && (
            <div style={{ padding: "8px 14px", borderRadius: 8, background: result.ok ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: result.ok ? GREEN : RED, fontSize: 12, fontWeight: 700 }}>
              {result.msg}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${BORDER}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: T1, marginBottom: 4 }}>ℹ️ 配信について</h3>
        <div style={{ fontSize: 12, color: T2, lineHeight: 1.7 }}>
          メール配信はEmailJS経由で行われます（月200通まで無料）。会員が「メール通知」をONにしている場合のみ配信されます。
          現在の残り送信数: 残り200通/月。
        </div>
      </div>
    </div>
  );
}

// ============================================================
// QR CODE TAB
// ============================================================
function QrTab() {
  const [selectedType, setSelectedType] = useState("register");
  const [copied, setCopied] = useState(false);
  const appUrl = "https://dripro.vercel.app";
  const urls = {
    register: { url: `${appUrl}?ref=qr`, label: "新規登録ページ" },
    login: { url: `${appUrl}/login?ref=qr`, label: "ログインページ" },
    seminar: { url: `${appUrl}/events?ref=qr`, label: "セミナー申込ページ" },
  };
  const current = urls[selectedType];
  const copyUrl = () => { navigator.clipboard?.writeText(current.url); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: T1, marginBottom: 16 }}>📱 QRコード発行</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[{ id: "register", label: "📝 新規登録" }, { id: "login", label: "🔑 ログイン" }, { id: "seminar", label: "📚 セミナー" }].map(t => (
          <button key={t.id} onClick={() => setSelectedType(t.id)} style={{ flex: "1 1 120px", padding: 14, borderRadius: 10, border: `2px solid ${selectedType === t.id ? ACCENT : BORDER}`, background: selectedType === t.id ? `${ACCENT}15` : "transparent", cursor: "pointer", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: selectedType === t.id ? ACCENT : T1 }}>{t.label}</div>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "0 0 auto", background: CARD, borderRadius: 16, padding: 24, border: `1px solid ${BORDER}`, textAlign: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 16, display: "inline-block", marginBottom: 14 }}>
            <svg width="200" height="200" viewBox="0 0 280 280">
              <rect width="280" height="280" fill="#fff"/>
              <rect x="20" y="20" width="60" height="60" fill="#000" rx="4"/><rect x="28" y="28" width="44" height="44" fill="#fff" rx="2"/><rect x="36" y="36" width="28" height="28" fill="#000" rx="2"/>
              <rect x="200" y="20" width="60" height="60" fill="#000" rx="4"/><rect x="208" y="28" width="44" height="44" fill="#fff" rx="2"/><rect x="216" y="36" width="28" height="28" fill="#000" rx="2"/>
              <rect x="20" y="200" width="60" height="60" fill="#000" rx="4"/><rect x="28" y="208" width="44" height="44" fill="#fff" rx="2"/><rect x="36" y="216" width="28" height="28" fill="#000" rx="2"/>
              <rect x="115" y="115" width="50" height="50" fill="#fff" rx="8"/><rect x="120" y="120" width="40" height="40" fill="#3b82f6" rx="6"/>
              <text x="140" y="146" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="900">D</text>
            </svg>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T1, marginBottom: 4 }}>{current.label}</div>
        </div>
        <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: CARD, borderRadius: 14, padding: 18, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T2, marginBottom: 8 }}>🔗 リンクURL</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={current.url} readOnly style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)", color: T1, fontSize: 12, outline: "none", fontFamily: "monospace" }} />
              <button onClick={copyUrl} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: copied ? GREEN : ACCENT, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {copied ? "✅ コピー済" : "📋 コピー"}
              </button>
            </div>
          </div>
          <div style={{ background: CARD, borderRadius: 14, padding: 18, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T2, marginBottom: 10 }}>💡 活用方法</div>
            {[
              { icon: "🏢", text: "セミナー会場で配布するチラシに印刷" },
              { icon: "📧", text: "メール署名やメルマガに掲載" },
              { icon: "🤝", text: "営業・訪問時に名刺と一緒に渡す" },
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 2 ? `1px solid ${BORDER}` : "none" }}>
                <span style={{ fontSize: 16 }}>{tip.icon}</span>
                <div style={{ fontSize: 12, color: T1 }}>{tip.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SETTINGS TAB (新規追加)
// ============================================================
function SettingsTab({ authUser, adminInfo }) {
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState(adminInfo?.name || "");
  const [notifyEmail, setNotifyEmail] = useState(adminInfo?.notifyEmail || authUser?.email || "");

  const saveSettings = async () => {
    try {
      await updateDoc(doc(db, "users", authUser.uid), {
        name: displayName,
        notifyEmail,
        updatedAt: serverTimestamp()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch(e) { console.error(e); }
  };

  const inputS = {
    width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,0.04)", color: T1, fontSize: 13, outline: "none", fontFamily: FONT, marginBottom: 12
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: T1, marginBottom: 20 }}>⚙️ 管理者設定</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T1, marginBottom: 14 }}>👤 プロフィール</h3>
          <label style={{ fontSize: 11, color: T2, display: "block", marginBottom: 4 }}>表示名</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="管理者名" style={inputS} />
          <label style={{ fontSize: 11, color: T2, display: "block", marginBottom: 4 }}>メールアドレス</label>
          <input value={authUser?.email || ""} readOnly style={{ ...inputS, color: T3, cursor: "not-allowed" }} />
          <label style={{ fontSize: 11, color: T2, display: "block", marginBottom: 4 }}>通知受信メール</label>
          <input value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} placeholder="通知を受けるメールアドレス" style={inputS} />
          <button onClick={saveSettings} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: saved ? GREEN : ACCENT, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {saved ? "✅ 保存しました" : "💾 保存する"}
          </button>
        </div>

        <div style={{ background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T1, marginBottom: 14 }}>🔧 システム情報</h3>
          {[
            { label: "アプリURL", value: "https://dripro.vercel.app" },
            { label: "Firebase Project", value: "dripro-bfc0f" },
            { label: "EmailJS Service", value: EMAILJS_SERVICE_ID },
            { label: "管理者UID", value: authUser?.uid || "—" },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 12, color: T3, fontWeight: 700 }}>{row.label}</span>
              <span style={{ fontSize: 11, color: T2, fontFamily: "monospace", maxWidth: 280, textAlign: "right", wordBreak: "break-all" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN ADMIN APP
// ============================================================
const SIDEBAR_ITEMS = [
  { id: "dashboard", icon: "📊", label: "ダッシュボード" },
  { id: "members", icon: "👥", label: "会員管理" },
  { id: "news", icon: "📰", label: "ニュース管理" },
  { id: "events", icon: "📚", label: "セミナー管理" },
  { id: "reports", icon: "🚨", label: "チャット通報" },
  { id: "notify", icon: "🔔", label: "通知配信" },
  { id: "qr", icon: "📱", label: "QRコード発行" },
  { id: "settings", icon: "⚙️", label: "設定" },
];

export default function AdminPanel() {
  const [authUser, setAuthUser] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [members, setMembers] = useState([]);
  const [news, setNews] = useState([]);
  const [seminarEntries, setSeminarEntries] = useState([]);
  const [chatReports, setChatReports] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        const data = snap.exists() ? snap.data() : {};
        if (data.role === "admin") { setAuthUser(u); setAdminInfo(data); }
        else { await signOut(auth); setAuthUser(null); }
      } else { setAuthUser(null); }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const unsubMembers = onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc")), snap => {
      setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    }, () => {});
    const unsubNews = onSnapshot(query(collection(db, "news"), orderBy("createdAt", "desc")), snap => {
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    const unsubSeminars = onSnapshot(query(collection(db, "seminar_entries"), orderBy("createdAt", "desc")), snap => {
      setSeminarEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    const unsubReports = onSnapshot(query(collection(db, "chat_reports"), orderBy("createdAt", "desc")), snap => {
      setChatReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return () => { unsubMembers(); unsubNews(); unsubSeminars(); unsubReports(); };
  }, [authUser]);

  const pendingReports = chatReports.filter(r => r.status === "pending").length;

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${BORDER}`, borderTop: `3px solid ${ACCENT}`, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      </div>
    );
  }

  if (!authUser) return <AdminLogin onLogin={(u, info) => { setAuthUser(u); setAdminInfo(info); }} />;

  const renderTab = () => {
    switch (tab) {
      case "dashboard": return <DashboardTab members={members} news={news} seminarEntries={seminarEntries} chatReports={chatReports} />;
      case "members": return <MembersTab members={members} />;
      case "news": return <NewsTab news={news} setNews={setNews} />;
      case "events": return <EventsTab seminarEntries={seminarEntries} />;
      case "reports": return <ChatReportsTab chatReports={chatReports} />;
      case "notify": return <NotifyTab members={members} news={news} />;
      case "qr": return <QrTab />;
      case "settings": return <SettingsTab authUser={authUser} adminInfo={adminInfo} />;
      default: return <DashboardTab members={members} news={news} seminarEntries={seminarEntries} chatReports={chatReports} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: FONT, display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
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
      <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />
      <aside className="admin-sidebar" style={{ width: 220, background: CARD, borderRight: `1px solid ${BORDER}`, padding: "20px 0", flexShrink: 0, height: "100vh", position: "sticky", top: 0, overflowY: "auto" }}>
        <div style={{ padding: "0 16px 20px", borderBottom: `1px solid ${BORDER}`, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${ACCENT}, #6366f1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔐</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: T1 }}>ドリプロ</div>
              <div style={{ fontSize: 10, color: T3 }}>管理画面 · {adminInfo?.name || authUser?.email}</div>
            </div>
          </div>
        </div>
        {SIDEBAR_ITEMS.map(item => (
          <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", border: "none", background: tab === item.id ? `${ACCENT}15` : "transparent", color: tab === item.id ? ACCENT : T2, fontSize: 13, fontWeight: tab === item.id ? 700 : 500, cursor: "pointer", textAlign: "left", borderLeft: tab === item.id ? `3px solid ${ACCENT}` : "3px solid transparent", position: "relative" }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
            {item.id === "reports" && pendingReports > 0 && (
              <span style={{ marginLeft: "auto", minWidth: 18, height: 18, borderRadius: 9, background: RED, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{pendingReports}</span>
            )}
          </button>
        ))}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${BORDER}`, marginTop: 16 }}>
          <button onClick={() => signOut(auth)} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: RED, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🚪 ログアウト</button>
          <div style={{ marginTop: 8, fontSize: 10, color: T3 }}>ユーザー用: <span style={{ color: ACCENT }}>dripro.vercel.app</span></div>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "24px", overflowY: "auto", minHeight: "100vh" }}>
        <div className="mobile-header" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ padding: 8, borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD, color: T1, fontSize: 18, cursor: "pointer" }}>☰</button>
          <div style={{ fontSize: 15, fontWeight: 800, color: T1 }}>🔐 ドリプロ管理画面</div>
        </div>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>{renderTab()}</div>
      </main>
    </div>
  );
}

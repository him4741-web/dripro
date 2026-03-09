import { useState, useEffect, useRef } from "react";
import { db, auth } from "./firebase";
import {
  collection, onSnapshot, query, orderBy, addDoc, updateDoc,
  doc, serverTimestamp, deleteDoc, getDocs, where, getDoc, setDoc
} from "firebase/firestore";
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "firebase/auth";

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
const catLabel = { law: "\u2696\uFE0F \u6CD5\u6539\u6B63", reward: "\uD83D\uDCB0 \u5831\u9178", subsidy: "\uD83C\uDFE6 \u88DC\u52A9\u91D1" };
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
// ADMIN LOGIN (Firebase Auth)
// ============================================================
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const inp = { width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)", color: T1, fontSize: 14, outline: "none", marginBottom: 10, display: "block", fontFamily: FONT };
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      const r = await signInWithEmailAndPassword(auth, email, pass);
      const snap = await getDoc(doc(db, "users", r.user.uid));
      const role = snap.exists() ? snap.data().role : "member";
      if (role !== "admin") {
        await signOut(auth);
        setErr("\u7BA1\u7406\u8005\u6A29\u9650\u304C\u3042\u308A\u307E\u305B\u3093");
      } else {
        onLogin(r.user, snap.data());
      }
    } catch (e2) {
      const M = {
        "auth/wrong-password": "\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u9055\u3044\u307E\u3059",
        "auth/user-not-found": "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u304C\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093",
        "auth/invalid-credential": "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u307E\u305F\u306F\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u9055\u3044\u307E\u3059",
      };
      setErr(M[e2.code] || "\u30ED\u30B0\u30A4\u30F3\u30A8\u30E9\u30FC");
    } finally { setLoading(false); }
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, fontFamily: FONT }}>
      <div style={{ width: "100%", maxWidth: 380, padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>\uD83D\uDD10</div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: T1, margin: "0 0 4px" }}>\u30C9\u30EA\u30D7\u30ED\u7BA1\u7406\u753B\u9762</h1>
          <p style={{ fontSize: 12, color: T3 }}>\u7BA1\u7406\u8005\u5C02\u7528\u30ED\u30B0\u30A4\u30F3</p>
        </div>
        <form onSubmit={handleLogin} style={{ background: CARD, borderRadius: 16, padding: 24, border: `1px solid ${BORDER}` }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="\u7BA1\u7406\u8005\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9" required style={inp} />
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="\u30D1\u30B9\u30EF\u30FC\u30C9" required style={{ ...inp, marginBottom: err ? 6 : 0 }} />
          {err && <div style={{ fontSize: 12, color: RED, marginBottom: 10 }}>\u26A0 {err}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", background: loading ? BORDER : `linear-gradient(135deg, ${ACCENT}, #6366f1)`, color: "#fff", fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", marginTop: 8 }}>
            {loading ? "\u51E6\u7406\u4E2D..." : "\u30ED\u30B0\u30A4\u30F3"}
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
  const weekData = [
    { day: "\u6708", value: 12 }, { day: "\u706B", value: 8 }, { day: "\u6C34", value: 15 },
    { day: "\u6728", value: 10 }, { day: "\u91D1", value: 18 }, { day: "\u571F", value: 5 }, { day: "\u65E5", value: 3 },
  ];
  const maxVal = Math.max(...weekData.map(d => d.value));
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: T1, marginBottom: 16 }}>\uD83D\uDCCA \u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard icon="\uD83D\uDC65" label="\u30A2\u30AF\u30C6\u30A3\u30D6\u4F1A\u54E1" value={active} sub={`\u4ECA\u6708 +${newThisMonth}\u540D`} color={GREEN} />
        <StatCard icon="\uD83D\uDCF0" label="\u516C\u958B\u8A18\u4E8B\u6570" value={published} color={ACCENT} />
        <StatCard icon="\uD83D\uDE4B" label="\u30BB\u30DF\u30CA\u30FC\u7533\u8FBC" value={seminarEntries.length} color={ORANGE} />
        <StatCard icon="\uD83D\uDEA8" label="\u901A\u5831\u5BFE\u5FDC\u5F85\u3061" value={pendingReports} color={pendingReports > 0 ? RED : T3} />
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px", background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: T1, marginBottom: 16 }}>\uD83D\uDCC8 \u4ECA\u9031\u306E\u30A2\u30AF\u30BB\u30B9</h3>
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
        <div style={{ flex: "1 1 280px", background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: T1, marginBottom: 14 }}>\uD83D\uDD50 \u6700\u8FD1\u306E\u6D3B\u52D5</h3>
          {members.slice(0, 3).map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 16 }}>\uD83D\uDC64</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: T1 }}>{m.company || m.email} \u304C\u767B\u9332</div>
                <div style={{ fontSize: 10, color: T3 }}>{m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString("ja-JP") : "\u8FD1\u65E5"}</div>
              </div>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: GREEN }} />
            </div>
          ))}
          {news.filter(n => n.status === "published").slice(0, 2).map((n, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 16 }}>\uD83D\uDCF0</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: T1 }}>{n.title?.substring(0, 20)}... \u516C\u958B</div>
                <div style={{ fontSize: 10, color: T3 }}>{n.date || "\u8FD1\u65E5"}</div>
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
// MEMBERS TAB (Firestore real data)
// ============================================================
function MembersTab({ members }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const active = members.filter(m => m.status === "active");
  const emailOn = members.filter(m => m.emailNotify && m.status === "active");
  const pushOn = members.filter(m => m.fcmToken && m.status === "active");
  const filtered = members.filter(m => {
    if (filter === "active" && m.status !== "active") return false;
    if (filter === "inactive" && m.status !== "inactive") return false;
    if (search && !m.email?.includes(search) && !m.company?.includes(search) && !m.name?.includes(search)) return false;
    return true;
  });
  const toggleStatus = async (m) => {
    const newStatus = m.status === "active" ? "inactive" : "active";
    await updateDoc(doc(db, "users", m.uid), { status: newStatus });
  };
  const makeAdmin = async (m) => {
    if (!window.confirm(`${m.name || m.email} \u3092\u7BA1\u7406\u8005\u306B\u5909\u66F4\u3057\u307E\u3059\u304B\uFF1F`)) return;
    await updateDoc(doc(db, "users", m.uid), { role: "admin" });
  };
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: T1, marginBottom: 16 }}>\uD83D\uDC65 \u4F1A\u54E1\u7BA1\u7406</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon="\uD83D\uDC65" label="\u30A2\u30AF\u30C6\u30A3\u30D6\u4F1A\u54E1" value={active.length} sub={`\u5168${members.length}\u540D\u4E2D`} color={GREEN} />
        <StatCard icon="\uD83D\uDCE7" label="\u30E1\u30FC\u30EB\u901A\u77E5ON" value={emailOn.length} sub={`${active.length ? Math.round(emailOn.length / active.length * 100) : 0}%`} color={ACCENT} />
        <StatCard icon="\uD83D\uDCF1" label="\u30D7\u30C3\u30B7\u30E5\u901A\u77E5ON" value={pushOn.length} color={ORANGE} />
        <StatCard icon="\uD83D\uDEAA" label="\u9000\u4F1A\u6E08\u307F" value={members.filter(m => m.status === "inactive").length} color={RED} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="\uD83D\uDD0D \u540D\u524D\u30FB\u30E1\u30FC\u30EB\u30FB\u4F1A\u793E\u540D\u3067\u691C\u7D22" style={{ flex: "1 1 200px", padding: "10px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)", color: T1, fontSize: 13, outline: "none" }} />
        {["all", "active", "inactive"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: filter === f ? ACCENT : CARD, color: filter === f ? "#fff" : T2, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {f === "all" ? "\u3059\u3079\u3066" : f === "active" ? "\u30A2\u30AF\u30C6\u30A3\u30D6" : "\u9000\u4F1A\u6E08\u307F"}
          </button>
        ))}
      </div>
      <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["\u540D\u524D", "\u4F1A\u793E\u540D", "\u30E1\u30FC\u30EB", "\u30ED\u30FC\u30EB", "\u30B9\u30C6\u30FC\u30BF\u30B9", "\u30E1\u30FC\u30EB\u901A\u77E5", "\u767B\u9332\u65E5", "\u64CD\u4F5C"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: T3, fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.uid} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "10px 14px", color: T1, fontWeight: 700, whiteSpace: "nowrap" }}>{m.name || "—"}</td>
                  <td style={{ padding: "10px 14px", color: T1, whiteSpace: "nowrap" }}>{m.company || "—"}</td>
                  <td style={{ padding: "10px 14px", color: T2, whiteSpace: "nowrap" }}>{m.email}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: m.role === "admin" ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.1)", color: m.role === "admin" ? PURPLE : ACCENT }}>
                      {m.role === "admin" ? "\u7BA1\u7406\u8005" : "\u4F1A\u54E1"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <button onClick={() => toggleStatus(m)} style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", background: m.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: m.status === "active" ? GREEN : RED }}>
                      {m.status === "active" ? "\u2705 \u6709\u52B9" : "\uD83D\uDEAA \u9000\u4F1A"}
                    </button>
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>{m.emailNotify ? "\u2705" : "\u2014"}</td>
                  <td style={{ padding: "10px 14px", color: T3, whiteSpace: "nowrap" }}>
                    {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString("ja-JP") : m.createdAt || "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {m.role !== "admin" && (
                      <button onClick={() => makeAdmin(m)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: PURPLE, fontSize: 10, cursor: "pointer" }}>
                        \u7BA1\u7406\u8005\u306B
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: T3, fontSize: 13 }}>\u8A72\u5F53\u3059\u308B\u4F1A\u54E1\u304C\u3044\u307E\u305B\u3093</div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// NEWS TAB (Firestore CRUD)
// ============================================================
function NewsTab({ news, setNews }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", cat: "subsidy", importance: "high", summary: "", advice: "", attachments: [], linkUrl: "", linkLabel: "" });
  const inputS = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)", color: T1, fontSize: 13, outline: "none", fontFamily: FONT };

  const startNew = () => {
    setForm({ title: "", cat: "subsidy", importance: "high", summary: "", advice: "", attachments: [], linkUrl: "", linkLabel: "" });
    setEditing("new");
  };
  const startEdit = (item) => {
    setForm({ title: item.title || "", cat: item.cat || "subsidy", importance: item.importance || "high", summary: item.summary || "", advice: item.advice || "", attachments: item.attachments || [], linkUrl: item.linkUrl || "", linkLabel: item.linkLabel || "" });
    setEditing(item.id);
  };
  const save = async (publish) => {
    if (!form.title) return;
    setSaving(true);
    const data = {
      ...form,
      date: new Date().toISOString().slice(0, 10),
      status: publish ? "published" : "draft",
      read: "3\u5206",
      source: "\u53B3\u751F\u52B4\u50CD\u7701",
    };
    try {
      if (editing === "new") {
        await addDoc(collection(db, "news"), { ...data, createdAt: serverTimestamp() });
      } else {
        await updateDoc(doc(db, "news", editing), data);
      }
      setEditing(null);
    } catch(e) { console.error(e); }
    setSaving(false);
  };
  const togglePublish = async (item) => {
    const newStatus = item.status === "published" ? "draft" : "published";
    try {
      await updateDoc(doc(db, "news", item.id), { status: newStatus });
    } catch(e) { console.error(e); }
  };
  const deleteNews = async (item) => {
    if (!window.confirm("\u3053\u306E\u8A18\u4E8B\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F")) return;
    try {
      await deleteDoc(doc(db, "news", item.id));
    } catch(e) { console.error(e); }
  };
  const fileIcon = (type) => ({ PDF: "\uD83D\uDCC4", XLSX: "\uD83D\uDCCA", XLS: "\uD83D\uDCCA", CSV: "\uD83D\uDCCA", DOCX: "\uD83D\uDCDD", DOC: "\uD83D\uDCDD", PNG: "\uD83D\uDDBC\uFE0F", JPG: "\uD83D\uDDBC\uFE0F" }[type] || "\uD83D\uDCCE");
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
        <h2 style={{ fontSize: 18, fontWeight: 900, color: T1 }}>\uD83D\uDCF0 \u30CB\u30E5\u30FC\u30B9\u7BA1\u7406</h2>
        <button onClick={startNew} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>\uFF0B \u65B0\u898F\u4F5C\u6210</button>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon="\uD83D\uDCF0" label="\u516C\u958B\u4E2D" value={published} color={GREEN} />
        <StatCard icon="\uD83D\uDCDD" label="\u4E0B\u66F8\u304D" value={drafts} color={ORANGE} />
        <StatCard icon="\uD83C\uDFE6" label="\u88DC\u52A9\u91D1\u8A18\u4E8B" value={news.filter(n => n.cat === "subsidy").length} color={PURPLE} />
        <StatCard icon="\uD83D\uDCDA" label="\u5168\u8A18\u4E8B\u6570" value={news.length} color={T2} />
      </div>
      {editing && (
        <div style={{ background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${ACCENT}`, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T1, marginBottom: 14 }}>{editing === "new" ? "\uD83D\uDCDD \u65B0\u898F\u30CB\u30E5\u30FC\u30B9" : "\u270F\uFE0F \u7DE8\u96C6"}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="\u30BF\u30A4\u30C8\u30EB *" style={inputS} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} style={{ ...inputS, flex: 1, appearance: "none", cursor: "pointer" }}>
                <option value="law">\u2696\uFE0F \u6CD5\u6539\u6B63</option>
                <option value="reward">\uD83D\uDCB0 \u5831\u9178\u52A0\u7B97</option>
                <option value="subsidy">\uD83C\uDFE6 \u88DC\u52A9\u91D1</option>
              </select>
              <select value={form.importance} onChange={e => setForm({ ...form, importance: e.target.value })} style={{ ...inputS, flex: 1, appearance: "none", cursor: "pointer" }}>
                <option value="high">\uD83D\uDD34 \u91CD\u8981</option>
                <option value="med">\uD83D\uDFE1 \u6CE8\u76EE</option>
                <option value="low">\u26AA \u901A\u5E38</option>
              </select>
            </div>
            <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="\u8981\u7D04\u30FB\u8AAC\u660E" rows={3} style={{ ...inputS, resize: "vertical" }} />
            <textarea value={form.advice} onChange={e => setForm({ ...form, advice: e.target.value })} placeholder="\uD83D\uDCA1 \u63A8\u5968\u30A2\u30AF\u30B7\u30E7\u30F3\uFF08\u4F1A\u54E1\u3078\u306E\u30A2\u30C9\u30D0\u30A4\u30B9\uFF09" rows={2} style={{ ...inputS, resize: "vertical" }} />
            <div style={{ border: `1px dashed ${BORDER}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T2 }}>\uD83D\uDCCE \u6DFB\u4ED8\u30D5\u30A1\u30A4\u30EB</span>
                <label style={{ padding: "6px 14px", borderRadius: 8, background: `${ACCENT}15`, color: ACCENT, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  \uFF0B \u8FFD\u52A0
                  <input type="file" multiple accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.png,.jpg" onChange={addFile} style={{ display: "none" }} />
                </label>
              </div>
              {form.attachments.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: `1px solid ${BORDER}`, marginBottom: 6 }}>
                  <span>{fileIcon(f.type)}</span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: T1 }}>{f.name}</div><div style={{ fontSize: 10, color: T3 }}>{f.type} · {f.size}</div></div>
                  <button onClick={() => setForm({ ...form, attachments: form.attachments.filter((_, j) => j !== i) })} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.1)", color: RED, fontSize: 11, cursor: "pointer" }}>\u2715</button>
                </div>
              ))}
            </div>
            <div style={{ border: `1px dashed ${BORDER}`, borderRadius: 10, padding: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T2, display: "block", marginBottom: 8 }}>\uD83D\uDD17 \u5916\u90E8\u30EA\u30F3\u30AF\uFF08\u4EFB\u610F\uFF09</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." style={{ ...inputS, flex: "2 1 200px" }} />
                <input value={form.linkLabel} onChange={e => setForm({ ...form, linkLabel: e.target.value })} placeholder="\u30EA\u30F3\u30AF\u540D" style={{ ...inputS, flex: "1 1 120px" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button onClick={() => setEditing(null)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: T2, fontSize: 12, cursor: "pointer" }}>\u30AD\u30E3\u30F3\u30BB\u30EB</button>
              <button onClick={() => save(false)} disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: ORANGE, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>\uD83D\uDCDD \u4E0B\u66F8\u304D\u4FDD\u5B58</button>
              <button onClick={() => save(true)} disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: GREEN, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>\uD83D\uDE80 \u516C\u958B\u3059\u308B</button>
            </div>
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
                {item.importance === "high" && <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "rgba(239,68,68,0.15)", color: RED }}>\u91CD\u8981</span>}
                {item.status === "draft" && <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "rgba(245,158,11,0.15)", color: ORANGE }}>\u4E0B\u66F8\u304D</span>}
                {item.attachments?.length > 0 && <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "rgba(59,130,246,0.12)", color: ACCENT }}>\uD83D\uDCCE {item.attachments.length}\u4EF6</span>}
              </div>
              <div style={{ fontSize: 11, color: T3 }}>
                <span style={{ color: catColor[item.cat] }}>{catLabel[item.cat]}</span> · {item.date}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => startEdit(item)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: T2, fontSize: 11, cursor: "pointer" }}>\u270F\uFE0F \u7DE8\u96C6</button>
              <button onClick={() => togglePublish(item)} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: item.status === "published" ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)", color: item.status === "published" ? GREEN : ACCENT, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {item.status === "published" ? "\u2705 \u516C\u958B\u4E2D" : "\uD83D\uDCC4 \u516C\u958B\u3059\u308B"}
              </button>
              <button onClick={() => deleteNews(item)} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.08)", color: RED, fontSize: 11, cursor: "pointer" }}>\uD83D\uDDD1</button>
            </div>
          </div>
        ))}
        {news.length === 0 && <div style={{ padding: 32, textAlign: "center", color: T3, fontSize: 13 }}>\u30CB\u30E5\u30FC\u30B9\u304C\u307E\u3060\u3042\u308A\u307E\u305B\u3093</div>}
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
  const [form, setForm] = useState({ title: "", type: "seminar", date: "", startTime: "", endTime: "", total: 30 });
  const inputS = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)", color: T1, fontSize: 13, outline: "none", fontFamily: FONT };

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return () => unsub();
  }, []);

  const saveEvent = async () => {
    if (!form.title) return;
    const data = { ...form, status: "\u516C\u958B\u4E2D", applicants: 0, createdAt: serverTimestamp() };
    if (editing === "new") {
      await addDoc(collection(db, "events"), data);
    } else {
      await updateDoc(doc(db, "events", editing), { ...form });
    }
    setEditing(null);
  };
  const deleteEvent = async (id) => {
    if (!window.confirm("\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F")) return;
    await deleteDoc(doc(db, "events", id));
  };
  const typeLabel = { study: "\uD83D\uDCD6 \u52C9\u5F37\u4F1A", seminar: "\uD83C\uDFA4 \u30BB\u30DF\u30CA\u30FC", consul: "\uD83D\uDCBC \u30B3\u30F3\u30B5\u30EB" };
  const typeColor = { study: ACCENT, seminar: GREEN, consul: ORANGE };
  const totalApplicants = seminarEntries.length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: T1 }}>\uD83D\uDCDA \u30BB\u30DF\u30CA\u30FC\u30FB\u30A4\u30D9\u30F3\u30C8\u7BA1\u7406</h2>
        <button onClick={() => { setForm({ title: "", type: "seminar", date: "", startTime: "", endTime: "", total: 30 }); setEditing("new"); }} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>\uFF0B \u65B0\u898F\u4F5C\u6210</button>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon="\uD83D\uDCC5" label="\u30A4\u30D9\u30F3\u30C8\u6570" value={events.length} color={ACCENT} />
        <StatCard icon="\uD83D\uDE4B" label="\u7DCF\u7533\u8FBC\u6570" value={totalApplicants} color={GREEN} />
      </div>
      {editing && (
        <div style={{ background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${ACCENT}`, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T1, marginBottom: 14 }}>\uD83D\uDCDD \u30A4\u30D9\u30F3\u30C8\u4F5C\u6210</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="\u30A4\u30D9\u30F3\u30C8\u540D *" style={inputS} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ ...inputS, flex: "1 1 120px", appearance: "none" }}>
                <option value="seminar">\uD83C\uDFA4 \u30BB\u30DF\u30CA\u30FC</option>
                <option value="study">\uD83D\uDCD6 \u52C9\u5F37\u4F1A</option>
                <option value="consul">\uD83D\uDCBC \u30B3\u30F3\u30B5\u30EB</option>
              </select>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ ...inputS, flex: "1 1 130px" }} />
              <input type="number" value={form.total} onChange={e => setForm({ ...form, total: +e.target.value })} placeholder="\u5B9A\u54E1" style={{ ...inputS, flex: "0 0 80px" }} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: T2, flexShrink: 0 }}>\uD83D\uDD50 \u6642\u9593</span>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} style={{ ...inputS, flex: 1 }} />
              <span style={{ color: T3 }}>\u301C</span>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} style={{ ...inputS, flex: 1 }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(null)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: T2, fontSize: 12, cursor: "pointer" }}>\u30AD\u30E3\u30F3\u30BB\u30EB</button>
              <button onClick={saveEvent} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: GREEN, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>\uD83D\uDCBE \u4FDD\u5B58</button>
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
                  <div style={{ fontSize: 11, color: T3 }}>\uD83D\uDCC5 {ev.date}{ev.startTime ? ` \uD83D\uDD50 ${ev.startTime}\u301C${ev.endTime}` : ""}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: pct > 80 ? RED : pct > 50 ? ORANGE : GREEN }}>{ev.applicants || 0}<span style={{ fontSize: 12, color: T3 }}>/{ev.total}</span></div>
                  <button onClick={() => deleteEvent(ev.id)} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.08)", color: RED, fontSize: 10, cursor: "pointer" }}>\u524A\u9664</button>
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
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T1, marginBottom: 14 }}>\uD83D\uDE4B \u7533\u8FBC\u8005\u4E00\u89A7</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["\u30A4\u30D9\u30F3\u30C8\u540D", "\u30E6\u30FC\u30B6\u30FCID", "\u7533\u8FBC\u65E5\u6642"].map(h => (
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
  const resolve = async (id) => {
    await updateDoc(doc(db, "chat_reports", id), { status: "resolved", resolvedAt: serverTimestamp() });
  };
  const dismiss = async (id) => {
    await updateDoc(doc(db, "chat_reports", id), { status: "dismissed" });
  };
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: T1, marginBottom: 16 }}>\uD83D\uDEA8 \u30C1\u30E3\u30C3\u30C8\u901A\u5831\u7BA1\u7406</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon="\uD83D\uDEA8" label="\u5BFE\u5FDC\u5F85\u3061" value={chatReports.filter(r => r.status === "pending").length} color={RED} />
        <StatCard icon="\u2705" label="\u89E3\u6C7A\u6E08\u307F" value={chatReports.filter(r => r.status === "resolved").length} color={GREEN} />
        <StatCard icon="\uD83D\uDCCA" label="\u7DCF\u901A\u5831\u6570" value={chatReports.length} color={T2} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["pending", "resolved", "dismissed", "all"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: filter === f ? ACCENT : CARD, color: filter === f ? "#fff" : T2, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {f === "pending" ? "\uD83D\uDEA8 \u5BFE\u5FDC\u5F85\u3061" : f === "resolved" ? "\u2705 \u89E3\u6C7A\u6E08" : f === "dismissed" ? "\uD83D\uDEAB \u7121\u8996" : "\u3059\u3079\u3066"}
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
                    {r.status === "pending" ? "\uD83D\uDEA8 \u5BFE\u5FDC\u5F85\u3061" : r.status === "resolved" ? "\u2705 \u89E3\u6C7A" : "\uD83D\uDEAB \u7121\u8996"}
                  </span>
                  <span style={{ fontSize: 11, color: T3 }}>{r.reason || "\u901A\u5831"}</span>
                  <span style={{ fontSize: 11, color: T3, marginLeft: "auto" }}>{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString("ja-JP") : "—"}</span>
                </div>
                <div style={{ fontSize: 12, color: T1, fontWeight: 600, marginBottom: 4 }}>\uD83D\uDCAC \u901A\u5831\u5BFE\u8C61\u30E1\u30C3\u30BB\u30FC\u30B8:</div>
                <div style={{ fontSize: 13, color: T2, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px", border: `1px solid ${BORDER}`, lineHeight: 1.6 }}>
                  {r.msgText || "(\u30C6\u30AD\u30B9\u30C8\u306A\u3057)"}
                </div>
                <div style={{ fontSize: 11, color: T3, marginTop: 6 }}>
                  \uD83D\uDC64 \u6295\u7A3F\u8005: {r.msgUser || "—"} · \uD83D\uDEA8 \u901A\u5831\u8005ID: {r.reporterUid?.substring(0, 10) || "—"}...
                </div>
              </div>
              {r.status === "pending" && (
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => resolve(r.id)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "rgba(239,68,68,0.15)", color: RED, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>\uD83D\uDDD1 \u6295\u7A3F\u5358\u4F4D\u3067\u5BFE\u5FDC</button>
                  <button onClick={() => dismiss(r.id)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: T2, fontSize: 12, cursor: "pointer" }}>\u7121\u8996</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: T3, fontSize: 13 }}>\u8A72\u5F53\u3059\u308B\u901A\u5831\u304C\u3042\u308A\u307E\u305B\u3093 \uD83C\uDF89</div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// NOTIFY TAB
// ============================================================
function NotifyTab({ members }) {
  const [type, setType] = useState("digest");
  const [sent, setSent] = useState(false);
  const active = members.filter(m => m.status === "active");
  const emailOn = active.filter(m => m.emailNotify);
  const pushOn = active.filter(m => m.fcmToken);
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: T1, marginBottom: 16 }}>\uD83D\uDD14 \u901A\u77E5\u914D\u4FE1</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon="\uD83D\uDCE7" label="\u30E1\u30FC\u30EB\u914D\u4FE1\u5148" value={`${emailOn.length}\u540D`} color={ACCENT} />
        <StatCard icon="\uD83D\uDCF1" label="\u30D7\u30C3\u30B7\u30E5\u914D\u4FE1\u5148" value={`${pushOn.length}\u53F0`} color={GREEN} />
      </div>
      <div style={{ background: CARD, borderRadius: 14, padding: 20, border: `1px solid ${BORDER}`, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: T1, marginBottom: 14 }}>\u914D\u4FE1\u30BF\u30A4\u30D7</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {[{ id: "digest", label: "\uD83D\uDCF0 \u671D\u306E\u30C0\u30A4\u30B8\u30A7\u30B9\u30C8", desc: "\u5FAE\u671D\u6BCE\u65E5\u914D\u4FE1" }, { id: "urgent", label: "\uD83D\uDEA8 \u7DCA\u6025\u901A\u77E5", desc: "\u4ECA\u3059\u3050\u5168\u54E1\u306B\u914D\u4FE1" }, { id: "reminder", label: "\u23F0 \u30EA\u30DE\u30A4\u30F3\u30C9", desc: "\u671F\u9650\u30EA\u30DE\u30A4\u30F3\u30C9\u3092\u9001\u4FE1" }].map(t => (
            <button key={t.id} onClick={() => { setType(t.id); setSent(false); }} style={{ flex: "1 1 140px", padding: 14, borderRadius: 10, border: `2px solid ${type === t.id ? ACCENT : BORDER}`, background: type === t.id ? `${ACCENT}10` : "transparent", cursor: "pointer", textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: type === t.id ? ACCENT : T1 }}>{t.label}</div>
              <div style={{ fontSize: 10, color: T3, marginTop: 2 }}>{t.desc}</div>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setSent(true)} style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: type === "urgent" ? RED : ACCENT, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
            {type === "urgent" ? "\uD83D\uDEA8 \u7DCA\u6025\u914D\u4FE1\u3059\u308B" : "\uD83D\uDCE4 \u914D\u4FE1\u3059\u308B"}
          </button>
          {sent && <div style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(16,185,129,0.12)", color: GREEN, fontSize: 12, fontWeight: 700 }}>\u2705 \u914D\u4FE1\u5B8C\u4E86\uFF01 \u30E1\u30FC\u30EB {emailOn.length}\u540D + \u30D7\u30C3\u30B7\u30E5 {pushOn.length}\u53F0</div>}
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
    register: { url: `${appUrl}?ref=qr`, label: "\u65B0\u898F\u767B\u9332\u30DA\u30FC\u30B8" },
    login: { url: `${appUrl}/login?ref=qr`, label: "\u30ED\u30B0\u30A4\u30F3\u30DA\u30FC\u30B8" },
    seminar: { url: `${appUrl}/events?ref=qr`, label: "\u30BB\u30DF\u30CA\u30FC\u7533\u8FBC\u30DA\u30FC\u30B8" },
  };
  const current = urls[selectedType];
  const copyUrl = () => {
    navigator.clipboard?.writeText(current.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: T1, marginBottom: 16 }}>\uD83D\uDCF1 QR\u30B3\u30FC\u30C9\u767A\u884C</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[{ id: "register", label: "\uD83D\uDCDD \u65B0\u898F\u767B\u9332" }, { id: "login", label: "\uD83D\uDD11 \u30ED\u30B0\u30A4\u30F3" }, { id: "seminar", label: "\uD83D\uDCDA \u30BB\u30DF\u30CA\u30FC" }].map(t => (
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
            <div style={{ fontSize: 12, fontWeight: 700, color: T2, marginBottom: 8 }}>\uD83D\uDD17 \u30EA\u30F3\u30AFURL</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={current.url} readOnly style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)", color: T1, fontSize: 12, outline: "none", fontFamily: "monospace" }} />
              <button onClick={copyUrl} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: copied ? GREEN : ACCENT, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {copied ? "\u2705 \u30B3\u30D4\u30FC\u6E08" : "\uD83D\uDCCB \u30B3\u30D4\u30FC"}
              </button>
            </div>
          </div>
          <div style={{ background: CARD, borderRadius: 14, padding: 18, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T2, marginBottom: 10 }}>\uD83D\uDCA1 \u6D3B\u7528\u65B9\u6CD5</div>
            {[{ icon: "\uD83C\uDFE2", text: "\u30BB\u30DF\u30CA\u30FC\u4F1A\u5834\u3067\u914D\u5E03\u3059\u308B\u30C1\u30E9\u30B7\u306B\u5370\u5237" }, { icon: "\uD83D\uDCE7", text: "\u30E1\u30FC\u30EB\u7F72\u540D\u3084\u30E1\u30EB\u30DE\u30AC\u306B\u6B32\u8F09" }, { icon: "\uD83E\uDD1D", text: "\u55B6\u696D\u30FB\u8A2A\u554F\u6642\u306B\u540D\u523A\u3068\u4E00\u7DD2\u306B\u6E21\u3059" }].map((tip, i) => (
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
// MAIN ADMIN APP
// ============================================================
const SIDEBAR_ITEMS = [
  { id: "dashboard", icon: "\uD83D\uDCCA", label: "\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9" },
  { id: "members", icon: "\uD83D\uDC65", label: "\u4F1A\u54E1\u7BA1\u7406" },
  { id: "news", icon: "\uD83D\uDCF0", label: "\u30CB\u30E5\u30FC\u30B9\u7BA1\u7406" },
  { id: "events", icon: "\uD83D\uDCDA", label: "\u30BB\u30DF\u30CA\u30FC\u7BA1\u7406" },
  { id: "reports", icon: "\uD83D\uDEA8", label: "\u30C1\u30E3\u30C3\u30C8\u901A\u5831" },
  { id: "notify", icon: "\uD83D\uDD14", label: "\u901A\u77E5\u914D\u4FE1" },
  { id: "qr", icon: "\uD83D\uDCF1", label: "QR\u30B3\u30FC\u30C9\u767A\u884C" },
];

export default function AdminPanel() {
  const [authUser, setAuthUser] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // === Firestore real data ===
  const [members, setMembers] = useState([]);
  const [news, setNews] = useState([]);
  const [seminarEntries, setSeminarEntries] = useState([]);
  const [chatReports, setChatReports] = useState([]);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        const data = snap.exists() ? snap.data() : {};
        if (data.role === "admin") {
          setAuthUser(u);
          setAdminInfo(data);
        } else {
          await signOut(auth);
          setAuthUser(null);
        }
      } else {
        setAuthUser(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Load data when logged in
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
      case "notify": return <NotifyTab members={members} />;
      case "qr": return <QrTab />;
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
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${ACCENT}, #6366f1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>\uD83D\uDD10</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: T1 }}>\u30C9\u30EA\u30D7\u30ED</div>
              <div style={{ fontSize: 10, color: T3 }}>\u7BA1\u7406\u753B\u9762 · {adminInfo?.name || authUser?.email}</div>
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
          <button onClick={() => signOut(auth)} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: RED, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>\uD83D\uDEAA \u30ED\u30B0\u30A2\u30A6\u30C8</button>
          <div style={{ marginTop: 8, fontSize: 10, color: T3 }}>\u30E6\u30FC\u30B6\u30FC\u7528: <span style={{ color: ACCENT }}>dripro.vercel.app</span></div>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "24px", overflowY: "auto", minHeight: "100vh" }}>
        <div className="mobile-header" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ padding: 8, borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD, color: T1, fontSize: 18, cursor: "pointer" }}>\u2630</button>
          <div style={{ fontSize: 15, fontWeight: 800, color: T1 }}>\uD83D\uDD10 \u30C9\u30EA\u30D7\u30ED\u7BA1\u7406\u753B\u9762</div>
        </div>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>{renderTab()}</div>
      </main>
    </div>
  );
}

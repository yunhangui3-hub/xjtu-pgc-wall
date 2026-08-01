"use client";

import { AnimatePresence, animate as animateValue, motion } from "framer-motion";
import {
  ArrowRight, Bell, Bookmark, CalendarDays, Check, CheckCircle2,
  ChevronRight, CircleHelp, Clock3, Heart, Home, Menu, MessageCircle,
  Plus, Send, Share2, Sparkles, Target, Users, X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../src/lib/supabase";

type NoteType = "wish" | "help" | "partner";
type Note = {
  id: number | string; type: NoteType; content: string; industry: string; position?: string;
  nickname: string; time: string; color: string; likes?: number; rotation?: number; createdAt: string; status?: string | null; optimistic?: boolean;
};
type NoteDraft = { type: NoteType; content: string; nickname: string; tag: string };
type CompanionData = { participants: number; wishes: number; today: number };
type NoteRow = { id: number | string; type: string; content: string; nickname: string; tag: string | null; created_at: string | null; status?: string | null };

const typeMeta = {
  wish: { label: "心愿贴", title: "我的宝洁秋招目标", icon: Target, color: "yellow", hint: "写下目标，让认真准备的日子被看见" },
  help: { label: "求助贴", title: "我的投递疑问", icon: CircleHelp, color: "blue", hint: "说出困惑，让同学和学长姐来回应" },
  partner: { label: "搭子贴", title: "寻找同行伙伴", icon: Users, color: "green", hint: "找到一起准备、互相打气的同路人" },
};

const colorClass: Record<string, string> = { yellow: "note-yellow", blue: "note-blue", green: "note-green" };

function relativeTime(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 60_000) return "刚刚";
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "昨天" : `${days}天前`;
}

function isRlsError(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() || "";
  return error?.code === "42501" || message.includes("row-level security") || message.includes("permission denied");
}

function toNote(row: NoteRow): Note {
  const type: NoteType = row.type === "partner" || row.type === "buddy" ? "partner" : row.type === "help" ? "help" : "wish";
  const createdAt = row.created_at || new Date().toISOString();
  return { id: row.id, type, content: row.content, nickname: row.nickname || "匿名西交er", industry: "宝洁秋招", position: row.tag || "方向待定", time: relativeTime(createdAt), color: typeMeta[type].color, likes: 0, createdAt, status: row.status };
}

function noteKey(note: Pick<Note, "content" | "nickname" | "position">) { return `${note.content.trim()}::${note.nickname.trim()}::${note.position || ""}`; }

function newestFirst(notes: Note[]) {
  return [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function mergeServerNote(current: Note[], incoming: Note) {
  const incomingKey = noteKey(incoming);
  return newestFirst([
    incoming,
    ...current.filter(note => note.id !== incoming.id && !(note.optimistic && noteKey(note) === incomingKey)),
  ]);
}

function Logo() {
  return <a className="brand" href="#top" aria-label="返回首页">
    <span className="brand-seal">交</span>
    <span><strong>XJTU PGC</strong><small>宝洁秋招陪伴计划</small></span>
  </a>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const links = [["首页", "#top"], ["便利贴墙", "#wall"], ["秋招 Timeline", "#timeline"], ["学长姐故事", "#stories"]];
  return <header className="site-header">
    <div className="header-inner">
      <Logo />
      <nav className={open ? "open" : ""} aria-label="页面导航">
        {links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
      </nav>
      <div className="header-side"><button aria-label="查看提醒"><Bell size={18} /><i /></button><img className="baoxiaoxi-avatar" src="/baoxiaoxi-avatar.jpg" alt="宝小西头像" /><button className="menu" onClick={() => setOpen(!open)} aria-label="打开菜单">{open ? <X /> : <Menu />}</button></div>
    </div>
  </header>;
}

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animateValue(0, value, { duration: .9, ease: "easeOut", onUpdate: latest => setDisplay(Math.round(latest)) });
    return () => controls.stop();
  }, [value]);
  return <motion.strong initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>{display}</motion.strong>;
}

function CompanionStats({ data, loading }: { data: CompanionData; loading: boolean }) {
  return <div className="companion-data">
    <div className="companion-title"><span>秋招同行数据</span><i><span /> Supabase 实时同步</i></div>
    {loading ? <motion.div className="companion-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><span className="loading-dot" /><p>正在寻找西交伙伴留下的秋招心愿...</p></motion.div> : <>
      <div className="companion-cards">
        <div><CountUp value={data.participants} /><span>位西交同学正在同行</span></div>
        <div><CountUp value={data.wishes} /><span>张便利贴已留下</span></div>
        <div><CountUp value={data.today} /><span>张便利贴今日加入</span></div>
      </div>
      <motion.p className="companion-copy" key={`${data.participants}-${data.today}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
        已有 {data.participants} 位西交同学，在这里留下秋招心愿 ✨<span>今天又有 {data.today} 份秋招心愿加入情报墙</span>
      </motion.p>
    </>}
  </div>;
}

function CampusHero({ openPublish, stats, loading }: { openPublish: () => void; stats: CompanionData; loading: boolean }) {
  return <section className="hero" id="top">
    <div className="paper-grain" />
    <div className="falling-leaves" aria-hidden="true">
      {["🍂", "🍁", "🍂", "🍁", "🍂", "🍁"].map((leaf, i) => <motion.span key={i} initial={{ y: -30, opacity: 0, rotate: 0 }} animate={{ y: 480, x: i % 2 ? 55 : -35, opacity: [0, .65, .65, 0], rotate: 300 }} transition={{ duration: 7 + i, delay: i * 1.15, repeat: Infinity, ease: "linear" }}>{leaf}</motion.span>)}
    </div>
    <div className="hero-inner">
      <div className="hero-copy">
        <motion.div className="eyebrow" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}><Sparkles size={14} /> XJTU PGC · 2026 宝洁秋招陪伴计划</motion.div>
        <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }}>秋招路上，<br /><em>我们并肩同行</em></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .18 }}>XJTU PGC 陪伴西交同学投递宝洁，<br className="desktop-break" />记录目标、分享困惑、寻找同行伙伴。</motion.p>
        <motion.button className="hero-cta" onClick={openPublish} whileHover={{ y: -2 }} whileTap={{ scale: .97 }}><Plus size={18} /> 写下我的秋招心愿</motion.button>
        <CompanionStats data={stats} loading={loading} />
      </div>
      <div className="campus-scene" aria-hidden="true">
        <div className="autumn-sun" /><div className="cloud cloud-a" /><div className="cloud cloud-b" />
        <div className="campus-building"><span className="roof" /><span className="clock">✦</span><div className="windows">{Array.from({ length: 10 }).map((_, i) => <i key={i} />)}</div><b>西安交通大学</b></div>
        <div className="tree tree-a"><i /><i /><i /></div><div className="tree tree-b"><i /><i /><i /></div><div className="campus-path" />
        <motion.div className="hero-note" animate={{ y: [0, -9, 0], rotate: [-3, -1, -3] }} transition={{ duration: 4, repeat: Infinity }}><span>心愿</span><strong>希望这个秋天，<br />收到宝洁的好消息。</strong><small>— 西交小橙子</small></motion.div>
      </div>
    </div>
    <div className="hero-footnote"><span>PGC 陪伴不是替你走，而是和你一起走</span><i /></div>
  </section>;
}

function NoteCard({ note, onOpen, isNew }: { note: Note; onOpen: () => void; isNew: boolean }) {
  const meta = typeMeta[note.type]; const Icon = meta.icon; const rotation = note.rotation ?? (String(note.id).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 7 - 3);
  return <motion.button layout className={`note-card ${colorClass[note.color]}`} style={{ rotate: rotation }} onClick={onOpen}
    initial={isNew ? { opacity: 0, x: 380, y: 180, rotate: 20, scale: .45 } : { opacity: 0, y: 16 }}
    animate={{ opacity: 1, x: 0, y: 0, rotate: rotation, scale: 1 }} exit={{ opacity: 0, scale: .85 }}
    whileHover={{ scale: 1.05, rotate: 0, y: -5, zIndex: 4 }} transition={{ type: "spring", stiffness: 250, damping: 22 }}>
    <span className="tape" /><span className={`type-chip ${note.type}`}><Icon size={13} /> {meta.label}</span>
    <strong className="note-content">{note.content}</strong>
    <span className="note-tags"><i>宝洁秋招</i>{note.position && <i>{note.position}</i>}</span>
    <span className="note-footer"><span className="mini-avatar">{note.nickname.slice(-1)}</span><span><b>{note.nickname}</b><small>{note.time}</small></span><MessageCircle size={14} /><em>{note.likes || 0}</em></span>
  </motion.button>;
}

function NotesWall({ notes, setSelected, openPublish, newId, loading, error, reload }: { notes: Note[]; setSelected: (n: Note) => void; openPublish: () => void; newId: number | string | null; loading: boolean; error: string; reload: () => void }) {
  const [filter, setFilter] = useState<"all" | NoteType>("all");
  const shown = useMemo(() => filter === "all" ? notes : notes.filter(n => n.type === filter), [notes, filter]);
  return <section className="wall-section" id="wall">
    <div className="section-heading"><div><span>PGC CARE WALL</span><h2>秋招心愿情报墙 <i>{shown.length}</i></h2><p>每一张便利贴，都是一份真实的宝洁秋招心愿。</p></div><button onClick={openPublish}><Plus size={16} /> 写一张便利贴</button></div>
    <div className="filter-row">{(["all", "wish", "help", "partner"] as const).map(key => <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>{key === "all" ? "全部" : typeMeta[key].label}<span>{key === "all" ? notes.length : notes.filter(n => n.type === key).length}</span></button>)}</div>
    {loading ? <div className="wall-state"><span className="loading-dot" /><p>正在把大家的心愿贴到墙上…</p></div> : error ? <div className="wall-state error"><CircleHelp /><p>{error}</p><button onClick={reload}>重新加载</button></div> : shown.length === 0 ? <div className="wall-state"><Sparkles /><p>这里还没有便利贴，来写下第一张吧。</p><button onClick={openPublish}>写一张便利贴</button></div> : <motion.div layout className="notes-grid"><AnimatePresence mode="popLayout">{shown.map(note => <NoteCard key={note.id} note={note} onOpen={() => setSelected(note)} isNew={newId === note.id} />)}</AnimatePresence></motion.div>}
    <div className="wall-ending"><span>🍂</span><p>墙的这一面写下心愿，墙的另一面站着同行的人。<small>PGC 会持续收集大家的真实困惑，陪你走过每一个投递节点。</small></p></div>
  </section>;
}

function NoteDetail({ note, close }: { note: Note | null; close: () => void }) {
  const [liked, setLiked] = useState(false); const [saved, setSaved] = useState(false); const [reply, setReply] = useState(""); const [sent, setSent] = useState(false);
  if (!note) return null; const meta = typeMeta[note.type]; const Icon = meta.icon;
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={close}>
    <motion.div className="detail-modal" initial={{ opacity: 0, y: 24, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: .96 }} onMouseDown={e => e.stopPropagation()}>
      <button className="modal-close" onClick={close}><X /></button><span className={`type-chip ${note.type}`}><Icon size={14} /> {meta.label}</span><h3>{note.content}</h3>
      <div className="detail-meta"><div><span>陪伴主题</span><strong>宝洁秋招</strong></div><div><span>关注方向</span><strong>{note.position || "投递准备"}</strong></div></div>
      <div className="author-row"><span className="large-avatar">{note.nickname.slice(-1)}</span><span><strong>{note.nickname}</strong><small>{note.time} · 来自西交校园</small></span></div>
      <div className="pgc-reply"><img className="pgc-avatar" src="/baoxiaoxi-avatar.jpg" alt="宝小西" /><p><strong>宝小西 · XJTU PGC 陪伴小队</strong>你的心愿已经被看见啦。准备路上的困惑，欢迎随时留在这里，我们一起找答案。</p></div>
      <div className="reply-box">{sent ? <span className="sent"><CheckCircle2 /> 回应已送达，感谢你的陪伴</span> : <><textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="分享经历，或给 TA 一句鼓励…" /><button disabled={!reply.trim()} onClick={() => setSent(true)}><Send size={15} /> 送出回应</button></>}</div>
      <div className="interaction-row"><button className={liked ? "active" : ""} onClick={() => setLiked(!liked)}><Heart fill={liked ? "currentColor" : "none"} />{liked ? "已加油" : "为 TA 加油"}<span>{(note.likes || 0) + (liked ? 1 : 0)}</span></button><button className={saved ? "active" : ""} onClick={() => setSaved(!saved)}><Bookmark fill={saved ? "currentColor" : "none"} />{saved ? "已收藏" : "收藏"}</button><button onClick={() => navigator.clipboard?.writeText(window.location.href)}><Share2 />分享</button></div>
    </motion.div>
  </motion.div>;
}

function PublishModal({ close, publish }: { close: () => void; publish: (draft: NoteDraft) => Promise<string | null> }) {
  const [step, setStep] = useState(1); const [type, setType] = useState<NoteType>("wish"); const [content, setContent] = useState(""); const [position, setPosition] = useState("BRM"); const [nickname, setNickname] = useState("西交小橙子"); const [submitting, setSubmitting] = useState(false); const [submitError, setSubmitError] = useState("");
  const submit = async (e: FormEvent) => { e.preventDefault(); if (!content.trim() || submitting) return; setSubmitting(true); setSubmitError(""); const error = await publish({ type, content: content.trim(), nickname: nickname.trim() || "匿名西交er", tag: position }); if (error) { setSubmitError(error); setSubmitting(false); } };
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={close}><motion.form className="publish-modal" onSubmit={submit} initial={{ opacity: 0, y: 25, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: .96 }} onMouseDown={e => e.stopPropagation()}>
    <button type="button" className="modal-close" onClick={close}><X /></button><span className="modal-kicker">WRITE WITH PGC</span><h3>写下一张秋招便利贴</h3><p>你的目标、困惑和期待，都值得被认真看见。</p>
    <div className="stepper">{[1, 2, 3].map((n, i) => <span key={n} className={step >= n ? "active" : ""}><i>{step > n ? <Check /> : n}</i><b>{["选择类型", "填写内容", "确认上墙"][i]}</b></span>)}</div>
    {step === 1 && <div className="type-options">{(Object.keys(typeMeta) as NoteType[]).map(key => { const item = typeMeta[key]; const Icon = item.icon; return <button type="button" key={key} className={`${key} ${type === key ? "selected" : ""}`} onClick={() => setType(key)}><Icon /><span><strong>{item.title}</strong><small>{item.hint}</small></span><i><Check /></i></button>; })}</div>}
    {step === 2 && <div className="form-fields"><label>便利贴内容 <em>{content.length}/120</em><textarea autoFocus maxLength={120} value={content} onChange={e => setContent(e.target.value)} placeholder="例如：准备好八大问，认真冲刺宝洁面试！" /></label><div><label>关注方向<select value={position} onChange={e => setPosition(e.target.value)}><option>BRM</option><option>CBD</option><option>PS</option><option>HR</option><option>F&amp;A</option><option>投递流程</option><option>方向待定</option></select></label><label>匿名昵称<input value={nickname} onChange={e => setNickname(e.target.value)} /></label></div></div>}
    {step === 3 && <div className="preview-wrap"><p>确认后，这张便利贴会飞向墙面</p><div className={`note-card preview ${colorClass[typeMeta[type].color]}`}><span className="tape" /><span className={`type-chip ${type}`}>{typeMeta[type].label}</span><strong className="note-content">{content}</strong><span className="note-tags"><i>宝洁秋招</i><i>{position}</i></span><span className="note-footer"><span className="mini-avatar">{nickname.slice(-1)}</span><span><b>{nickname}</b><small>刚刚</small></span></span></div></div>}
    {submitError && <div className="submit-error"><CircleHelp />{submitError}</div>}
    <div className="modal-actions">{step > 1 && <button type="button" className="back" disabled={submitting} onClick={() => setStep(step - 1)}>上一步</button>}{step < 3 ? <button type="button" className="next" disabled={step === 2 && !content.trim()} onClick={() => setStep(step + 1)}>继续 <ArrowRight /></button> : <button className="next" disabled={submitting} type="submit">{submitting ? <><span className="button-spinner" /> 正在发布…</> : <><Sparkles /> 发布到心愿墙</>}</button>}</div>
  </motion.form></motion.div>;
}

function Timeline() {
  const stages = [{ n: "阶段 1", title: "网申开启", status: "即将开启", tone: "soon" }, { n: "阶段 2", title: "笔试阶段", status: "待更新", tone: "waiting" }, { n: "阶段 3", title: "面试阶段", status: "待更新", tone: "waiting" }];
  return <section className="timeline-section" id="timeline"><div className="section-heading"><div><span>STAY TOGETHER</span><h2>宝洁秋招关键节点</h2><p>节点将根据官方信息实时更新，PGC 陪你提前做好准备。</p></div><span className="update-pill"><i /> PGC 持续更新中</span></div>
    <div className="timeline-track">{stages.map((item, i) => <motion.article key={item.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .1 }}><span className="stage-number">0{i + 1}</span><small>{item.n}</small><h3>{item.title}</h3><p><Clock3 size={14} /> 时间：待官方公布</p><em className={item.tone}>{item.status}</em>{i < stages.length - 1 && <i className="connector" />}</motion.article>)}</div>
    <div className="reminder-card"><div className="reminder-date"><CalendarDays /><span><small>PGC 重要提醒</small><strong>即将开始</strong></span></div><div><span>宝洁秋招经验分享会</span><h3>和西交学长姐面对面，聊聊真实的投递经历</h3><p>时间：待公布 · 地点：待公布</p></div><button onClick={() => alert("详情将在官方信息确认后第一时间更新。")}>查看详情 <ChevronRight /></button></div>
  </section>;
}

function Stories() {
  const stories = [{ title: "从机械到品牌管理，我的宝洁 BRM 申请经历", role: "2025 届 · BRM" }, { title: "八大问不是背答案，而是重新认识自己", role: "2024 届 · 宝洁校友" }, { title: "群面沉默并不可怕，找到自己的表达方式", role: "2025 届 · PS" }];
  return <section className="stories-section" id="stories"><div className="section-heading light"><div><span>REAL STORIES</span><h2>西交学长姐上岸故事</h2><p>不是标准答案，是走过这段路的人留下的真实回声。</p></div></div><div className="story-grid">{stories.map((story, i) => <motion.a href={`#story-${i + 1}`} onClick={e => e.preventDefault()} key={story.title} whileHover={{ y: -5 }}><span>0{i + 1}</span><div><strong>{story.title}</strong><p>{story.role}</p></div><i>预留故事入口 <ArrowRight /></i></motion.a>)}</div><div className="story-quote"><span>“</span><p>我们相信，陪伴的意义不是给出所有答案，<br />而是让每一个认真准备的人知道：你并不孤单。</p><strong>— XJTU PGC</strong></div></section>;
}

function SuccessToast({ close }: { close: () => void }) { return <motion.div className="success-toast" initial={{ opacity: 0, y: 35, scale: .88 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -15 }}><span><CheckCircle2 /></span><div><strong>发布成功，心愿已上墙！</strong><small>PGC 和同行的西交同学会在这里看见你</small></div><button onClick={close}><X /></button><i /><i /><i /></motion.div>; }

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]); const [selected, setSelected] = useState<Note | null>(null); const [publishing, setPublishing] = useState(false); const [success, setSuccess] = useState(false); const [newId, setNewId] = useState<number | string | null>(null); const [loading, setLoading] = useState(true); const [dataError, setDataError] = useState("");
  const latestRequest = useRef(0);
  const newNoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const companionStats = useMemo<CompanionData>(() => {
    const now = new Date();
    const today = notes.filter(note => { const date = new Date(note.createdAt); return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate(); }).length;
    const participants = new Set(notes.map(note => note.nickname.trim()).filter(Boolean)).size;
    return { participants, wishes: notes.length, today };
  }, [notes]);

  const loadNotes = useCallback(async (options?: { silent?: boolean; keepOptimistic?: boolean }) => {
    if (!supabase) { setDataError("Supabase 环境变量未生效，请检查 .env.local 后重新启动开发服务。"); setLoading(false); return null; }
    const requestId = ++latestRequest.current;
    if (!options?.silent) setLoading(true); setDataError("");
    const { data, error } = await supabase.from("notes").select("id,type,content,nickname,tag,created_at,status").order("created_at", { ascending: false });
    if (requestId !== latestRequest.current) return null;
    if (error) { setDataError(isRlsError(error) ? "暂时无法读取便利贴。请在 Supabase 为 public.notes 配置允许匿名 SELECT 的 RLS 策略。" : `便利贴加载失败：${error.message}`); setLoading(false); return null; }
    const refreshedNotes = (data || []).map(toNote);
    setNotes(current => {
      if (!options?.keepOptimistic) return refreshedNotes;
      const serverKeys = new Set(refreshedNotes.map(noteKey));
      const pendingLocal = current.filter(note => note.optimistic && !serverKeys.has(noteKey(note)));
      return [...pendingLocal, ...refreshedNotes];
    });
    setLoading(false); return refreshedNotes;
  }, []);

  useEffect(() => {
    void loadNotes();

    const refreshWhenActive = () => {
      if (document.visibilityState === "visible") void loadNotes({ silent: true, keepOptimistic: true });
    };
    window.addEventListener("focus", refreshWhenActive);
    document.addEventListener("visibilitychange", refreshWhenActive);

    return () => {
      window.removeEventListener("focus", refreshWhenActive);
      document.removeEventListener("visibilitychange", refreshWhenActive);
    };
  }, [loadNotes]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const channel = client
      .channel("xjtu-pgc-public-notes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notes" },
        payload => {
          const incoming = toNote(payload.new as NoteRow);
          setNotes(current => mergeServerNote(current, incoming));
          setNewId(incoming.id);
          if (newNoteTimer.current) clearTimeout(newNoteTimer.current);
          newNoteTimer.current = setTimeout(() => setNewId(null), 1800);
        },
      )
      .subscribe(status => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // The regular no-cache fetch remains the fallback when Realtime is
          // not enabled for public.notes in the Supabase publication.
          void loadNotes({ silent: true, keepOptimistic: true });
        }
      });

    return () => {
      if (newNoteTimer.current) clearTimeout(newNoteTimer.current);
      void client.removeChannel(channel);
    };
  }, [loadNotes]);

  const publish = async (draft: NoteDraft) => {
    if (!supabase) return "Supabase 环境变量未生效，请检查 .env.local 后重新启动开发服务。";
    const temporaryId = `local-${Date.now()}`;
    const optimisticNote: Note = { id: temporaryId, type: draft.type, content: draft.content, nickname: draft.nickname, industry: "宝洁秋招", position: draft.tag, time: "刚刚", color: typeMeta[draft.type].color, likes: 0, rotation: 2, createdAt: new Date().toISOString(), status: "local", optimistic: true };
    setNotes(current => [optimisticNote, ...current]);
    setNewId(temporaryId);
    const { data: inserted, error } = await supabase
      .from("notes")
      .insert({ type: draft.type, content: draft.content, nickname: draft.nickname, tag: draft.tag })
      .select("id,type,content,nickname,tag,created_at,status")
      .single();
    if (error) { setNotes(current => current.filter(note => note.id !== temporaryId)); setNewId(null); return isRlsError(error) ? "发布或读取新便利贴被 Supabase 拒绝。请为 public.notes 配置允许匿名 INSERT、SELECT 的 RLS 策略。" : `发布失败：${error.message}`; }
    if (inserted) {
      const savedNote = toNote(inserted);
      setNotes(current => mergeServerNote(current, savedNote));
      setNewId(savedNote.id);
    }
    await loadNotes({ silent: true, keepOptimistic: false });
    setPublishing(false); setSuccess(true); location.hash = "wall"; setTimeout(() => setNewId(null), 1500); setTimeout(() => setSuccess(false), 4300); return null;
  };

  return <div className="app-shell"><Header /><main><CampusHero openPublish={() => setPublishing(true)} stats={companionStats} loading={loading} /><NotesWall notes={notes} setSelected={setSelected} openPublish={() => setPublishing(true)} newId={newId} loading={loading} error={dataError} reload={() => void loadNotes()} /><Timeline /><Stories /></main><footer><Logo /><p>秋招路上，有一群西交同学和 PGC 一起同行。</p><span>© 2026 XJTU PGC</span></footer><button className="floating-publish" onClick={() => setPublishing(true)}><Plus /><span>写一张便利贴</span></button><AnimatePresence>{selected && <NoteDetail note={selected} close={() => setSelected(null)} />}</AnimatePresence><AnimatePresence>{publishing && <PublishModal close={() => setPublishing(false)} publish={publish} />}</AnimatePresence><AnimatePresence>{success && <SuccessToast close={() => setSuccess(false)} />}</AnimatePresence></div>;
}

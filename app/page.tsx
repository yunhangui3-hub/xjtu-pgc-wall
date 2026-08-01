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
type NoteReply = { id: number | string; noteId: number | string; content: string; nickname: string; createdAt: string; time: string };
type ReplyRow = { id: number | string; note_id: number | string; content: string; nickname: string; created_at: string | null };

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

function toReply(row: ReplyRow): NoteReply {
  const createdAt = row.created_at || new Date().toISOString();
  return { id: row.id, noteId: row.note_id, content: row.content, nickname: row.nickname || "热心西交er", createdAt, time: relativeTime(createdAt) };
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

function CampusHero({ stats, loading }: { stats: CompanionData; loading: boolean }) {
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

function PublishInvitation({ openPublish }: { openPublish: () => void }) {
  return <section className="publish-invitation" aria-label="发布便利贴入口"><div><span className="publish-invitation-kicker"><Sparkles /> YOUR VOICE MATTERS</span><h2>先写下此刻的秋招心愿</h2><p>一个目标、一份困惑，或一句寻找同行伙伴的话，都值得被认真看见。</p></div><motion.button onClick={openPublish} whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: .97 }}><Plus />写下一张便利贴<ArrowRight /></motion.button><div className="invitation-note" aria-hidden="true"><i /><span>和西交同学<br />一起向宝洁出发</span></div></section>;
}

function NoteCard({ note, onOpen, onLike, liked, isNew }: { note: Note; onOpen: () => void; onLike: () => void; liked: boolean; isNew: boolean }) {
  const meta = typeMeta[note.type]; const Icon = meta.icon; const rotation = note.rotation ?? (String(note.id).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 7 - 3);
  return <motion.article layout className={`note-card ${colorClass[note.color]}`} style={{ rotate: rotation }} onClick={onOpen} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
    initial={isNew ? { opacity: 0, x: 380, y: 180, rotate: 20, scale: .45 } : { opacity: 0, y: 16 }}
    animate={{ opacity: 1, x: 0, y: 0, rotate: rotation, scale: 1 }} exit={{ opacity: 0, scale: .85 }}
    whileHover={{ scale: 1.05, rotate: 0, y: -5, zIndex: 4 }} transition={{ type: "spring", stiffness: 250, damping: 22 }}>
    <span className="tape" /><span className={`type-chip ${note.type}`}><Icon size={13} /> {meta.label}</span>
    <strong className="note-content">{note.content}</strong>
    <span className="note-tags"><i>宝洁秋招</i>{note.position && <i>{note.position}</i>}</span>
    <span className="note-footer"><span className="mini-avatar">{note.nickname.slice(-1)}</span><span><b>{note.nickname}</b><small>{note.time}</small></span><button className={liked ? "note-like liked" : "note-like"} onClick={e => { e.stopPropagation(); onLike(); }} disabled={liked} aria-label={liked ? "已为这张便利贴加油" : "为这张便利贴加油"}><Heart size={14} fill={liked ? "currentColor" : "none"} /><em>{liked ? "已加油" : "加油"}</em><b>{note.likes || 0}</b></button></span>
  </motion.article>;
}

function NotesWall({ notes, setSelected, openPublish, likeNote, likedIds, newId, loading, error, reload }: { notes: Note[]; setSelected: (n: Note) => void; openPublish: () => void; likeNote: (id: number | string) => void; likedIds: Set<string>; newId: number | string | null; loading: boolean; error: string; reload: () => void }) {
  const [filter, setFilter] = useState<"all" | NoteType>("all");
  const shown = useMemo(() => filter === "all" ? notes : notes.filter(n => n.type === filter), [notes, filter]);
  return <section className="wall-section" id="wall">
    <div className="section-heading"><div><span>PGC CARE WALL</span><h2>秋招心愿情报墙 <i>{shown.length}</i></h2><p>每一张便利贴，都是一份真实的宝洁秋招心愿。</p></div><button onClick={openPublish}><Plus size={16} /> 写一张便利贴</button></div>
    <div className="filter-row">{(["all", "wish", "help", "partner"] as const).map(key => <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>{key === "all" ? "全部" : typeMeta[key].label}<span>{key === "all" ? notes.length : notes.filter(n => n.type === key).length}</span></button>)}</div>
    {loading ? <div className="wall-state"><span className="loading-dot" /><p>正在把大家的心愿贴到墙上…</p></div> : error ? <div className="wall-state error"><CircleHelp /><p>{error}</p><button onClick={reload}>重新加载</button></div> : shown.length === 0 ? <div className="wall-state"><Sparkles /><p>这里还没有便利贴，来写下第一张吧。</p><button onClick={openPublish}>写一张便利贴</button></div> : <motion.div layout className="notes-grid"><AnimatePresence mode="popLayout">{shown.map(note => <NoteCard key={note.id} note={note} onOpen={() => setSelected(note)} onLike={() => likeNote(note.id)} liked={likedIds.has(String(note.id))} isNew={newId === note.id} />)}</AnimatePresence></motion.div>}
    <div className="wall-ending"><span>🍂</span><p>墙的这一面写下心愿，墙的另一面站着同行的人。<small>PGC 会持续收集大家的真实困惑，陪你走过每一个投递节点。</small></p></div>
  </section>;
}

const radarTerms = ["宝洁", "八大问", "面试", "网申", "笔试", "群面", "简历", "投递", "搭子", "供应链", "品牌管理", "职业成长", "BRM", "CBD", "PS", "HR", "F&A"];

function WishRadar({ notes, loading }: { notes: Note[]; loading: boolean }) {
  const words = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of notes) {
      const source = `${note.content} ${note.position || ""}`.toLowerCase();
      for (const term of radarTerms) if (source.includes(term.toLowerCase())) counts.set(term, (counts.get(term) || 0) + 1);
      const direction = note.position?.trim();
      if (direction && direction !== "方向待定" && !radarTerms.some(term => term.toLowerCase() === direction.toLowerCase())) counts.set(direction, (counts.get(direction) || 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16);
    const max = Math.max(1, ...ranked.map(([, count]) => count));
    return ranked.map(([label, count], index) => ({ label, count, size: 13 + Math.round((count / max) * 21), tone: index % 4 }));
  }, [notes]);

  return <section className="radar-section" id="radar"><div className="section-heading"><div><span>WISH RADAR</span><h2>秋招心愿雷达</h2><p>看看西交同学最近都在关注什么</p></div><span className="radar-live"><i /> 来自心愿墙的实时信号</span></div><div className="radar-map"><div className="radar-rings" aria-hidden="true"><i /><i /><i /><span>XJTU<br /><b>PGC</b></span></div>{loading ? <div className="radar-empty"><span className="loading-dot" />正在捕捉大家的秋招关注点…</div> : words.length === 0 ? <div className="radar-empty"><Sparkles />心愿信号正在汇聚，发布便利贴后这里会生成关键词。</div> : <div className="radar-cloud" aria-label="秋招关注关键词词云">{words.map((word, index) => <motion.span className={`tone-${word.tone}`} key={word.label} style={{ fontSize: word.size }} title={`${word.count} 张便利贴提到`} initial={{ opacity: 0, scale: .75 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * .035 }} whileHover={{ scale: 1.1, rotate: 0 }}>{word.label}<small>{word.count}</small></motion.span>)}</div>}</div><p className="radar-footnote">词语越大，代表近期被更多西交同学提及 · 数据随便利贴实时更新</p></section>;
}

function NoteDetail({ note, close, liked, onLike, replies, repliesLoading, repliesError, submitReply }: { note: Note | null; close: () => void; liked: boolean; onLike: () => void; replies: NoteReply[]; repliesLoading: boolean; repliesError: string; submitReply: (content: string, nickname: string) => Promise<string | null> }) {
  const [saved, setSaved] = useState(false); const [reply, setReply] = useState(""); const [replyNickname, setReplyNickname] = useState("热心西交er"); const [submittingReply, setSubmittingReply] = useState(false); const [submitError, setSubmitError] = useState("");
  if (!note) return null; const meta = typeMeta[note.type]; const Icon = meta.icon;
  const sendReply = async (event: FormEvent) => { event.preventDefault(); if (!reply.trim() || submittingReply) return; setSubmittingReply(true); setSubmitError(""); const error = await submitReply(reply.trim(), replyNickname.trim() || "热心西交er"); if (error) setSubmitError(error); else setReply(""); setSubmittingReply(false); };
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={close}>
    <motion.div className="detail-modal" initial={{ opacity: 0, y: 24, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: .96 }} onMouseDown={e => e.stopPropagation()}>
      <button className="modal-close" onClick={close}><X /></button><span className={`type-chip ${note.type}`}><Icon size={14} /> {meta.label}</span><h3>{note.content}</h3>
      <div className="detail-meta"><div><span>陪伴主题</span><strong>宝洁秋招</strong></div><div><span>关注方向</span><strong>{note.position || "投递准备"}</strong></div></div>
      <div className="author-row"><span className="large-avatar">{note.nickname.slice(-1)}</span><span><strong>{note.nickname}</strong><small>{note.time} · 来自西交校园</small></span></div>
      <div className="pgc-reply"><img className="pgc-avatar" src="/baoxiaoxi-avatar.jpg" alt="宝小西" /><p><strong>宝小西 · XJTU PGC 陪伴小队</strong>你的心愿已经被看见啦。准备路上的困惑，欢迎随时留在这里，我们一起找答案。</p></div>
      <div className="reply-list"><div className="reply-list-title"><strong>同学回应</strong><span>{replies.length}</span></div>{repliesLoading ? <div className="reply-loading"><span className="loading-dot" />正在读取回应…</div> : repliesError ? <div className="reply-error">{repliesError}</div> : replies.length === 0 ? <p className="reply-empty">还没有回应，来送上第一句鼓励吧。</p> : replies.map(item => <article className="reply-item" key={item.id}><span className="mini-avatar">{item.nickname.slice(-1)}</span><div><strong>{item.nickname}<small>{item.time}</small></strong><p>{item.content}</p></div></article>)}</div>
      <form className="reply-box" onSubmit={sendReply}><input value={replyNickname} maxLength={30} onChange={e => setReplyNickname(e.target.value)} aria-label="回应昵称" placeholder="匿名昵称" /><textarea value={reply} maxLength={180} onChange={e => setReply(e.target.value)} placeholder="分享经历，或给 TA 一句鼓励…" /><button type="submit" disabled={!reply.trim() || submittingReply}>{submittingReply ? <span className="button-spinner" /> : <Send size={15} />}{submittingReply ? "发送中…" : "送出回应"}</button>{submitError && <span className="reply-error submit">{submitError}</span>}</form>
      <div className="interaction-row"><button className={liked ? "active" : ""} disabled={liked} onClick={onLike}><Heart fill={liked ? "currentColor" : "none"} />{liked ? "已加油" : "为 TA 加油"}<span>{note.likes || 0}</span></button><button className={saved ? "active" : ""} onClick={() => setSaved(!saved)}><Bookmark fill={saved ? "currentColor" : "none"} />{saved ? "已收藏" : "收藏"}</button><button onClick={() => navigator.clipboard?.writeText(window.location.href)}><Share2 />分享</button></div>
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
  return <section className="timeline-section" id="timeline"><div className="section-heading"><div><span>STAY TOGETHER</span><h2>宝洁秋招重要事件日历</h2><p>节点将根据官方信息实时更新，PGC 陪你提前做好准备。</p></div><span className="update-pill"><i /> PGC 持续更新中</span></div>
    <div className="timeline-track">{stages.map((item, i) => <motion.article key={item.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .1 }}><span className="stage-number">0{i + 1}</span><small>{item.n}</small><h3>{item.title}</h3><p><Clock3 size={14} /> 时间：待官方公布</p><em className={item.tone}>{item.status}</em>{i < stages.length - 1 && <i className="connector" />}</motion.article>)}</div>
    <div className="reminder-card"><div className="reminder-date"><CalendarDays /><span><small>PGC 重要提醒</small><strong>即将开始</strong></span></div><div><span>宝洁秋招经验分享会</span><h3>和西交学长姐面对面，聊聊真实的投递经历</h3><p>时间：待公布 · 地点：待公布</p></div><button onClick={() => alert("详情将在官方信息确认后第一时间更新。")}>查看详情 <ChevronRight /></button></div>
  </section>;
}

function Stories() {
  const stories = [
    { title: "师兄师姐播客季 No.8｜非典型工科生在宝洁的7年", tags: ["宝洁秋招", "供应链管理", "职业成长"], summary: "来自西交的学长分享进入宝洁后的成长经历，从校园选择到职场发展，探索工科背景学生如何找到自己的职业方向。", url: "https://mp.weixin.qq.com/s/_CGOqzT2Ymbl6Rm6I33ygg" },
    { title: "师兄师姐播客季 No.9｜传统工科“变形记”，开启职场升级大冒险！", tags: ["宝洁秋招", "工科转型", "职场探索"], summary: "听西交学长分享从传统工科背景走向宝洁的成长故事，了解职业选择背后的思考与行动。", url: "https://mp.weixin.qq.com/s/Wth5IbrRhMOCVXHRLGlu7g" },
    { title: "师兄师姐播客季 No.10｜从微电子到品牌增干部的破圈答案", tags: ["宝洁秋招", "品牌管理", "跨领域成长"], summary: "来自西交学长姐的真实经历分享，看他们如何突破专业边界，探索属于自己的职业道路。", url: "https://mp.weixin.qq.com/s/yDYMIMX8mAvoI4l1tlnZyg" },
  ];
  return <section className="stories-section" id="stories"><div className="section-heading light"><div><span>REAL STORIES · XJTU PGC</span><h2>听见宝洁路上的他们</h2><p>来自西交 PGC 学长姐的一线分享，听他们讲述从校园到职场的真实成长故事。</p></div></div><div className="podcast-grid">{stories.map((story, i) => <motion.article className="podcast-card" key={story.title} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}><span className="podcast-index">0{i + 1}</span><div className="podcast-tags">{story.tags.map(tag => <span key={tag}>{tag}</span>)}</div><h3>{story.title}</h3><p className="podcast-summary">{story.summary}</p><a className="podcast-link" href={story.url} target="_blank" rel="noopener noreferrer" aria-label={`阅读故事：${story.title}`}>阅读故事 <ArrowRight /></a></motion.article>)}</div><div className="story-quote"><span>“</span><p>真实的成长没有标准路径，<br />但每一次选择，都能让我们更靠近想成为的自己。</p><strong>— XJTU PGC</strong></div></section>;
}

function SuccessToast({ close }: { close: () => void }) { return <motion.div className="success-toast" initial={{ opacity: 0, y: 35, scale: .88 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -15 }}><span><CheckCircle2 /></span><div><strong>发布成功，心愿已上墙！</strong><small>PGC 和同行的西交同学会在这里看见你</small></div><button onClick={close}><X /></button><i /><i /><i /></motion.div>; }

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]); const [selected, setSelected] = useState<Note | null>(null); const [publishing, setPublishing] = useState(false); const [success, setSuccess] = useState(false); const [newId, setNewId] = useState<number | string | null>(null); const [loading, setLoading] = useState(true); const [dataError, setDataError] = useState("");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [replies, setReplies] = useState<NoteReply[]>([]); const [repliesLoading, setRepliesLoading] = useState(false); const [repliesError, setRepliesError] = useState("");
  const latestRequest = useRef(0);
  const newNoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedNoteId = useRef<number | string | null>(null);

  const companionStats = useMemo<CompanionData>(() => {
    const now = new Date();
    const today = notes.filter(note => { const date = new Date(note.createdAt); return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate(); }).length;
    const participants = new Set(notes.map(note => note.nickname.trim()).filter(Boolean)).size;
    return { participants, wishes: notes.length, today };
  }, [notes]);

  const loadNotes = useCallback(async (options?: { silent?: boolean; keepOptimistic?: boolean }) => {
    if (!supabase) { setDataError("Supabase 环境变量未生效，请检查 .env.local 后重新启动开发服务。"); setLoading(false); return null; }
    const client = supabase;
    const requestId = ++latestRequest.current;
    if (!options?.silent) setLoading(true); setDataError("");
    const { data, error } = await client.from("notes").select("id,type,content,nickname,tag,created_at,status").order("created_at", { ascending: false });
    if (requestId !== latestRequest.current) return null;
    if (error) { setDataError(isRlsError(error) ? "暂时无法读取便利贴。请在 Supabase 为 public.notes 配置允许匿名 SELECT 的 RLS 策略。" : `便利贴加载失败：${error.message}`); setLoading(false); return null; }
    const { data: likeRows, error: likesError } = await client.from("note_likes").select("note_id");
    if (requestId !== latestRequest.current) return null;
    if (likesError) { setDataError(isRlsError(likesError) ? "便利贴已读取，但点赞数量被 Supabase RLS 拒绝。请为 public.note_likes 配置匿名 SELECT 策略。" : `点赞数量加载失败：${likesError.message}`); setLoading(false); return null; }
    const likeCounts = new Map<string, number>();
    for (const row of likeRows || []) { const key = String(row.note_id); likeCounts.set(key, (likeCounts.get(key) || 0) + 1); }
    const refreshedNotes = (data || []).map(row => ({ ...toNote(row), likes: likeCounts.get(String(row.id)) || 0 }));
    setNotes(current => {
      if (!options?.keepOptimistic) return refreshedNotes;
      const serverKeys = new Set(refreshedNotes.map(noteKey));
      const pendingLocal = current.filter(note => note.optimistic && !serverKeys.has(noteKey(note)));
      return [...pendingLocal, ...refreshedNotes];
    });
    setSelected(current => current ? refreshedNotes.find(note => note.id === current.id) || current : null);
    setLoading(false); return refreshedNotes;
  }, []);

  const loadReplies = useCallback(async (noteId: number | string, options?: { silent?: boolean }) => {
    if (!supabase) return null;
    if (!options?.silent) setRepliesLoading(true); setRepliesError("");
    const { data, error } = await supabase.from("note_replies").select("id,note_id,content,nickname,created_at").eq("note_id", noteId).order("created_at", { ascending: true });
    if (error) { setRepliesError(isRlsError(error) ? "回应暂时无法读取，请为 public.note_replies 配置匿名 SELECT RLS 策略。" : `回应加载失败：${error.message}`); setRepliesLoading(false); return null; }
    const refreshedReplies = (data || []).map(toReply);
    if (String(selectedNoteId.current) === String(noteId)) setReplies(refreshedReplies);
    setRepliesLoading(false); return refreshedReplies;
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("xjtu-pgc-liked-notes") || "[]");
      if (Array.isArray(saved)) setLikedIds(new Set(saved.map(String)));
    } catch {
      localStorage.removeItem("xjtu-pgc-liked-notes");
    }

    void loadNotes();

    const refreshWhenActive = () => {
      if (document.visibilityState === "visible") {
        void loadNotes({ silent: true, keepOptimistic: true });
        if (selectedNoteId.current !== null) void loadReplies(selectedNoteId.current, { silent: true });
      }
    };
    window.addEventListener("focus", refreshWhenActive);
    document.addEventListener("visibilitychange", refreshWhenActive);

    return () => {
      window.removeEventListener("focus", refreshWhenActive);
      document.removeEventListener("visibilitychange", refreshWhenActive);
    };
  }, [loadNotes, loadReplies]);

  useEffect(() => {
    selectedNoteId.current = selected?.id ?? null;
    if (selected) { setReplies([]); void loadReplies(selected.id); }
    else { setReplies([]); setRepliesError(""); setRepliesLoading(false); }
  }, [selected?.id, loadReplies]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const channel = client
      .channel("xjtu-pgc-public-notes")
      .on("postgres_changes", { event: "*", schema: "public", table: "notes" }, payload => {
        if (payload.eventType === "DELETE") {
          const removedId = (payload.old as { id?: number | string }).id;
          if (removedId !== undefined) {
            setNotes(current => current.filter(note => note.id !== removedId));
            setSelected(current => current?.id === removedId ? null : current);
          }
          return;
        }
        const row = payload.new as NoteRow;
        void loadNotes({ silent: true, keepOptimistic: false }).then(refreshed => {
          if (!refreshed?.some(note => note.id === row.id)) return;
          setNewId(row.id);
          if (newNoteTimer.current) clearTimeout(newNoteTimer.current);
          newNoteTimer.current = setTimeout(() => setNewId(null), 1800);
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "note_likes" }, () => {
        void loadNotes({ silent: true, keepOptimistic: false });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "note_replies" }, payload => {
        const row = (payload.eventType === "DELETE" ? payload.old : payload.new) as { note_id?: number | string };
        if (row.note_id !== undefined && String(selectedNoteId.current) === String(row.note_id)) void loadReplies(row.note_id, { silent: true });
      })
      .subscribe(status => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // The regular no-cache fetch remains the fallback when Realtime is
          // not enabled for public.notes in the Supabase publication.
          void loadNotes({ silent: true, keepOptimistic: true });
          if (selectedNoteId.current !== null) void loadReplies(selectedNoteId.current, { silent: true });
        }
      });

    return () => {
      if (newNoteTimer.current) clearTimeout(newNoteTimer.current);
      void client.removeChannel(channel);
    };
  }, [loadNotes, loadReplies]);

  const likeNote = useCallback(async (noteId: number | string) => {
    if (!supabase) return;
    const key = String(noteId);
    if (likedIds.has(key)) return;

    const nextLiked = new Set(likedIds).add(key);
    setLikedIds(nextLiked);
    localStorage.setItem("xjtu-pgc-liked-notes", JSON.stringify([...nextLiked]));
    setNotes(current => current.map(note => note.id === noteId ? { ...note, likes: (note.likes || 0) + 1 } : note));
    setSelected(current => current?.id === noteId ? { ...current, likes: (current.likes || 0) + 1 } : current);

    const { error } = await supabase.from("note_likes").insert({ note_id: noteId });
    if (error) {
      const rolledBack = new Set(nextLiked); rolledBack.delete(key);
      setLikedIds(rolledBack);
      localStorage.setItem("xjtu-pgc-liked-notes", JSON.stringify([...rolledBack]));
      setNotes(current => current.map(note => note.id === noteId ? { ...note, likes: Math.max(0, (note.likes || 0) - 1) } : note));
      setSelected(current => current?.id === noteId ? { ...current, likes: Math.max(0, (current.likes || 0) - 1) } : current);
      window.alert(isRlsError(error) ? "暂时无法加油，请检查 note_likes 的 INSERT RLS 策略。" : `加油失败：${error.message}`);
      return;
    }
    await loadNotes({ silent: true, keepOptimistic: false });
  }, [likedIds, loadNotes]);

  const submitReply = useCallback(async (noteId: number | string, content: string, nickname: string) => {
    if (!supabase) return "Supabase 环境变量未生效，请检查 .env.local 后重新启动开发服务。";
    const { error } = await supabase.from("note_replies").insert({ note_id: noteId, content, nickname });
    if (error) return isRlsError(error) ? "回应被 Supabase 拒绝，请为 public.note_replies 配置匿名 INSERT RLS 策略。" : `回应发送失败：${error.message}`;
    await loadReplies(noteId, { silent: true });
    return null;
  }, [loadReplies]);

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
    if (error) { setNotes(current => current.filter(note => note.id !== temporaryId)); setNewId(null); return isRlsError(error) ? "发布或读取新便利贴被 Supabase 拒绝，请检查 public.notes 的 INSERT、SELECT RLS 策略。" : `发布失败：${error.message}`; }
    if (inserted) {
      const savedNote = toNote(inserted);
      setNotes(current => mergeServerNote(current, savedNote));
      setNewId(savedNote.id);
    }
    await loadNotes({ silent: true, keepOptimistic: false });
    setPublishing(false); setSuccess(true); location.hash = "wall"; setTimeout(() => setNewId(null), 1500); setTimeout(() => setSuccess(false), 4300); return null;
  };

  return <div className="app-shell"><Header /><main><CampusHero stats={companionStats} loading={loading} /><PublishInvitation openPublish={() => setPublishing(true)} /><NotesWall notes={notes} setSelected={setSelected} openPublish={() => setPublishing(true)} likeNote={id => void likeNote(id)} likedIds={likedIds} newId={newId} loading={loading} error={dataError} reload={() => void loadNotes()} /><WishRadar notes={notes} loading={loading} /><Timeline /><Stories /></main><footer><Logo /><p>秋招路上，有一群西交同学和 PGC 一起同行。</p><span>© 2026 XJTU PGC</span></footer><button className="floating-publish" onClick={() => setPublishing(true)}><Plus /><span>写一张便利贴</span></button><AnimatePresence>{selected && <NoteDetail note={selected} close={() => setSelected(null)} liked={likedIds.has(String(selected.id))} onLike={() => void likeNote(selected.id)} replies={replies} repliesLoading={repliesLoading} repliesError={repliesError} submitReply={(content, nickname) => submitReply(selected.id, content, nickname)} />}</AnimatePresence><AnimatePresence>{publishing && <PublishModal close={() => setPublishing(false)} publish={publish} />}</AnimatePresence><AnimatePresence>{success && <SuccessToast close={() => setSuccess(false)} />}</AnimatePresence></div>;
}

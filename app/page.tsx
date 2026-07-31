"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ChevronRight,
  CircleHelp,
  Compass,
  Home,
  Lightbulb,
  Map,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { notes as initialNotes } from "../src/data/notes";

type NoteType = "wish" | "help" | "buddy";
type PageName = "home" | "map" | "admin";
type Note = {
  id: number;
  type: NoteType;
  content: string;
  industry: string;
  position?: string;
  nickname: string;
  time: string;
  color: string;
  likes?: number;
  rotation?: number;
};

const typeMeta = {
  wish: { short: "心愿", title: "我的秋招目标", icon: Target, color: "yellow" },
  help: { short: "求助", title: "我的求职疑问", icon: CircleHelp, color: "blue" },
  buddy: { short: "搭子", title: "我的搭子需求", icon: Users, color: "green" },
};

const colors: Record<string, string> = {
  yellow: "note-yellow",
  blue: "note-blue",
  green: "note-green",
  pink: "note-pink",
};

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

function Logo() {
  return (
    <button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      <span className="brand-mark"><span>交</span></span>
      <span className="brand-copy">
        <strong>西交秋招便利贴</strong>
        <small>XJTU CAREER NOTES</small>
      </span>
    </button>
  );
}

function Header({ page, setPage }: { page: PageName; setPage: (page: PageName) => void }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav className="nav-tabs" aria-label="主导航">
          <button className={page === "home" ? "active" : ""} onClick={() => setPage("home")}>
            <Home size={17} /> 首页
          </button>
          <button className={page === "map" ? "active" : ""} onClick={() => setPage("map")}>
            <Map size={17} /> 情报地图
          </button>
          <button className={page === "admin" ? "active" : ""} onClick={() => setPage("admin")}>
            <BarChart3 size={17} /> 数据看板
          </button>
        </nav>
        <div className="header-actions">
          <button className="icon-button" aria-label="搜索"><Search size={19} /></button>
          <button className="icon-button notification" aria-label="通知"><Bell size={19} /><i /></button>
          <div className="avatar">橙</div>
        </div>
      </div>
    </header>
  );
}

function CampusHero() {
  return (
    <section className="hero">
      <div className="autumn-leaf leaf-one">◆</div>
      <div className="autumn-leaf leaf-two">◆</div>
      <div className="hero-content">
        <motion.div
          className="season-pill"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Sparkles size={14} /> 2026 秋招季 · 和 246 位西交同学一起出发
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }}>
          秋招路上，<em>我们并肩同行</em>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .18 }}>
          留下你的秋招心愿，分享困惑，找到志同道合的求职搭子
        </motion.p>
        <div className="hero-stats">
          <div><strong>38</strong><span>今日新增便利贴</span></div>
          <i />
          <div><strong>246</strong><span>位同学正在参与</span></div>
          <i />
          <div><strong>71%</strong><span>的问题已获回应</span></div>
        </div>
      </div>
      <div className="campus-scene" aria-hidden="true">
        <div className="sun" />
        <div className="cloud cloud-a" />
        <div className="cloud cloud-b" />
        <div className="library">
          <span className="roof" />
          <span className="clock">✦</span>
          <div className="windows">{Array.from({ length: 10 }).map((_, i) => <i key={i} />)}</div>
          <b>西安交通大学</b>
        </div>
        <div className="tree tree-a"><i /><i /><i /></div>
        <div className="tree tree-b"><i /><i /><i /></div>
        <div className="path" />
      </div>
    </section>
  );
}

function NoteCard({ note, onClick, isNew = false }: { note: Note; onClick: () => void; isNew?: boolean }) {
  const meta = typeMeta[note.type];
  const Icon = meta.icon;
  const rotation = note.rotation ?? ((note.id * 7) % 7 - 3);
  return (
    <motion.button
      layout
      className={`note-card ${colors[note.color] || "note-yellow"}`}
      style={{ rotate: rotation }}
      initial={isNew ? { opacity: 0, x: 420, y: 220, rotate: 18, scale: .45 } : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, x: 0, y: 0, rotate: rotation, scale: 1 }}
      exit={{ opacity: 0, scale: .85 }}
      whileHover={{ scale: 1.055, rotate: 0, y: -5, zIndex: 4 }}
      transition={{ type: "spring", stiffness: 260, damping: 21 }}
      onClick={onClick}
    >
      <span className={`type-chip ${note.type}`}><Icon size={14} /> {meta.short}</span>
      <span className="note-content">{note.content}</span>
      <span className="note-tags">
        <span>{note.industry}</span>
        {note.position && <span>{note.position}</span>}
      </span>
      <span className="note-footer">
        <span className="mini-avatar">{note.nickname.slice(-1)}</span>
        <span><b>{note.nickname}</b><small>{note.time}</small></span>
        <MessageCircle size={15} />
        <em>{note.likes || 0}</em>
      </span>
      <span className="tape" />
    </motion.button>
  );
}

function FilterBar({ filter, setFilter, count }: { filter: string; setFilter: (v: string) => void; count: number }) {
  const filters = [
    { key: "all", label: "全部", dot: "" },
    { key: "wish", label: "心愿贴", dot: "yellow" },
    { key: "help", label: "求助贴", dot: "blue" },
    { key: "buddy", label: "搭子贴", dot: "green" },
  ];
  return (
    <div className="wall-toolbar">
      <div>
        <h2>便利贴情报墙 <span>{count}</span></h2>
        <p>每一张便利贴，都是一份真实的秋招心声</p>
      </div>
      <div className="filter-tabs">
        {filters.map((item) => (
          <button key={item.key} className={filter === item.key ? "active" : ""} onClick={() => setFilter(item.key)}>
            {item.dot && <i className={item.dot} />}{item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function NoteDetail({ note, close }: { note: Note | null; close: () => void }) {
  if (!note) return null;
  const meta = typeMeta[note.type];
  const Icon = meta.icon;
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={close}>
      <motion.div className="detail-modal" initial={{ opacity: 0, scale: .92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .94 }} onMouseDown={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={close} aria-label="关闭"><X /></button>
        <span className={`type-chip ${note.type}`}><Icon size={15} /> {meta.short}贴</span>
        <h3>{note.content}</h3>
        <div className="detail-fields">
          <div><span>关注行业</span><strong>{note.industry}</strong></div>
          <div><span>目标岗位</span><strong>{note.position || "方向待定"}</strong></div>
        </div>
        <div className="author-row">
          <span className="large-avatar">{note.nickname.slice(-1)}</span>
          <span><strong>{note.nickname}</strong><small>{note.time} · 发布于兴庆校区</small></span>
        </div>
        <div className="reply-preview">
          <div><span className="reply-avatar">学</span><p><strong>西交职协小助手</strong> 同学你好，相关方向的经验分享已为你标记，祝你秋招顺利！</p></div>
          <button><MessageCircle size={17} /> 写下鼓励或分享经验</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PublishModal({ close, publish }: { close: () => void; publish: (note: Note) => void }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<NoteType>("wish");
  const [content, setContent] = useState("");
  const [industry, setIndustry] = useState("快消");
  const [position, setPosition] = useState("");
  const [nickname, setNickname] = useState("西交小橙子");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    publish({
      id: Date.now(),
      type,
      content,
      industry,
      position,
      nickname: nickname || "匿名西交er",
      time: "刚刚",
      color: typeMeta[type].color,
      likes: 0,
      rotation: 2,
    });
  }

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={close}>
      <motion.form className="publish-modal" onSubmit={submit} initial={{ opacity: 0, scale: .94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .95 }} onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className="close-button" onClick={close} aria-label="关闭"><X /></button>
        <span className="modal-kicker">POST A NOTE</span>
        <h3>写下一张秋招便利贴</h3>
        <p>分享真实的你，也许下一秒就会遇见同路人</p>
        <div className="stepper">
          {[1, 2, 3].map((n) => <span key={n} className={step >= n ? "active" : ""}><i>{step > n ? "✓" : n}</i><b>{["选择类型", "填写内容", "确认发布"][n - 1]}</b></span>)}
        </div>
        {step === 1 && (
          <motion.div className="type-options" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {(Object.keys(typeMeta) as NoteType[]).map((key) => {
              const item = typeMeta[key];
              const Icon = item.icon;
              return <button type="button" key={key} className={`${key} ${type === key ? "selected" : ""}`} onClick={() => setType(key)}><Icon /><span><strong>{item.title}</strong><small>{key === "wish" ? "立下目标，见证成长" : key === "help" ? "提出疑问，收获经验" : "找到同伴，一起上岸"}</small></span><i>✓</i></button>;
            })}
          </motion.div>
        )}
        {step === 2 && (
          <motion.div className="form-fields" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <label>便利贴内容 <em>{content.length}/120</em><textarea autoFocus maxLength={120} value={content} onChange={(e) => setContent(e.target.value)} placeholder="写下你的秋招目标、困惑或搭子需求..." /></label>
            <div><label>目标行业<select value={industry} onChange={(e) => setIndustry(e.target.value)}><option>快消</option><option>外企</option><option>咨询</option><option>互联网</option><option>金融</option><option>制造业</option></select></label><label>目标岗位<input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="如：品牌管培生" /></label></div>
            <label>匿名昵称<input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="给自己起个校园昵称" /></label>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div className="preview-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p>这张便利贴会出现在情报墙的最上方</p>
            <div className={`note-card preview ${colors[typeMeta[type].color]}`}>
              <span className={`type-chip ${type}`}>{typeMeta[type].short}</span>
              <span className="note-content">{content || "你的秋招心声..."}</span>
              <span className="note-tags"><span>{industry}</span>{position && <span>{position}</span>}</span>
              <span className="note-footer"><span className="mini-avatar">{nickname.slice(-1)}</span><span><b>{nickname}</b><small>刚刚</small></span></span>
            </div>
          </motion.div>
        )}
        <div className="modal-actions">
          {step > 1 && <button type="button" className="back" onClick={() => setStep(step - 1)}>上一步</button>}
          {step < 3 ? <button type="button" className="next" disabled={step === 2 && !content.trim()} onClick={() => setStep(step + 1)}>继续 <ArrowRight size={17} /></button> : <button className="next" type="submit"><Sparkles size={17} /> 发布到情报墙</button>}
        </div>
      </motion.form>
    </motion.div>
  );
}

function HomePage({ notes, setSelected, openPublish, newId }: { notes: Note[]; setSelected: (n: Note) => void; openPublish: () => void; newId: number | null }) {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => filter === "all" ? notes : notes.filter(n => n.type === filter), [filter, notes]);
  return (
    <motion.main key="home" {...pageVariants} transition={{ duration: .28 }}>
      <CampusHero />
      <section className="wall-section">
        <FilterBar filter={filter} setFilter={setFilter} count={filtered.length} />
        <motion.div layout className="notes-grid">
          <AnimatePresence mode="popLayout">
            {filtered.map(note => <NoteCard key={note.id} note={note} isNew={newId === note.id} onClick={() => setSelected(note)} />)}
          </AnimatePresence>
        </motion.div>
        <div className="wall-end"><span>🍂</span><p>已经看到墙底啦<br /><small>每个认真生活的人，都会有好消息</small></p></div>
      </section>
      <button className="floating-publish" onClick={openPublish}><Plus size={20} /><span>写下一张便利贴</span></button>
    </motion.main>
  );
}

const intelNodes = [
  { name: "快消", count: 87, hot: ["宝洁八大问", "群面准备"], className: "fmcg", icon: "🛍️" },
  { name: "外企", count: 64, hot: ["MT 面试流程", "英文简历"], className: "foreign", icon: "🌍" },
  { name: "咨询", count: 52, hot: ["Case Interview", "PEI 故事"], className: "consulting", icon: "💡" },
  { name: "互联网", count: 48, hot: ["产品面经", "提前批"], className: "internet", icon: "💻" },
  { name: "金融", count: 36, hot: ["投行暑期", "行测准备"], className: "finance", icon: "📈" },
];

function IntelMap() {
  return (
    <motion.main key="map" className="map-page" {...pageVariants}>
      <section className="page-title">
        <div className="season-pill"><Compass size={14} /> XJTU CAREER INTELLIGENCE</div>
        <h1>秋招情报地图</h1>
        <p>看见西交同学都在关注什么，快速找到你的求职方向</p>
      </section>
      <section className="map-card">
        <div className="map-topline"><span><i /> 实时热度</span><strong>数据更新于 10 分钟前</strong></div>
        <div className="orbit-map">
          <div className="orbit orbit-a" /><div className="orbit orbit-b" />
          <div className="map-center"><span>2026</span><strong>秋招情报</strong><small>287 条线索汇聚</small></div>
          {intelNodes.map((node, index) => (
            <motion.button className={`intel-node ${node.className}`} key={node.name} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: .12 + index * .08, type: "spring" }}>
              <i>{node.icon}</i><span><strong>{node.name}</strong><small>{node.count} 人关注</small></span>
              <em>{node.hot[0]}</em>
            </motion.button>
          ))}
        </div>
      </section>
      <section className="trend-section">
        <div className="section-heading"><div><h2>本周热门情报</h2><p>同学们讨论最多的话题</p></div><button>查看全部 <ChevronRight size={16} /></button></div>
        <div className="trend-grid">
          {intelNodes.slice(0, 4).map((node, i) => <div className="trend-card" key={node.name}><span className="rank">0{i + 1}</span><div className="trend-icon">{node.icon}</div><div><strong>{node.hot[0]}</strong><p>{node.name} · {node.count + 26} 人正在讨论</p></div><TrendingUp size={18} /></div>)}
        </div>
      </section>
    </motion.main>
  );
}

function AdminDashboard() {
  const industries = [
    { name: "快消", value: 42, color: "#e8ae35" },
    { name: "咨询", value: 25, color: "#6f91d9" },
    { name: "互联网", value: 18, color: "#72b58c" },
    { name: "金融", value: 15, color: "#d77a72" },
  ];
  const cards = [
    { label: "累计用户", value: "426", change: "+12.6%", icon: UserRound, color: "amber" },
    { label: "便利贴数量", value: "783", change: "+8.4%", icon: BookOpen, color: "blue" },
    { label: "今日新增", value: "38", change: "+16.2%", icon: Plus, color: "green" },
    { label: "互动回应", value: "1,249", change: "+21.7%", icon: MessageCircle, color: "red" },
  ];
  return (
    <motion.main key="admin" className="admin-page" {...pageVariants}>
      <section className="admin-title"><div><span>ADMIN DASHBOARD</span><h1>秋招社区数据洞察</h1><p>2026 年秋招季 · 西交便利贴情报墙实时数据</p></div><button><span className="live-dot" /> 数据实时更新</button></section>
      <section className="stat-cards">
        {cards.map((card, i) => { const Icon = card.icon; return <motion.div className="stat-card" key={card.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .06 }}><span className={`stat-icon ${card.color}`}><Icon /></span><div><small>{card.label}</small><strong>{card.value}</strong><em><TrendingUp size={13} /> {card.change} <b>较上周</b></em></div></motion.div>; })}
      </section>
      <section className="dashboard-grid">
        <div className="panel industry-panel">
          <div className="panel-title"><div><h2>行业关注排行榜</h2><p>学生目标行业分布</p></div><select><option>近 7 天</option></select></div>
          <div className="ranking">
            {industries.map((item, i) => <div key={item.name}><span className="ranking-num">{i + 1}</span><strong>{item.name}</strong><div className="bar-track"><motion.i initial={{ width: 0 }} animate={{ width: `${item.value}%`, background: item.color }} transition={{ delay: .2 + i * .1, duration: .65 }} /></div><em>{item.value}%</em></div>)}
          </div>
          <div className="insight"><Lightbulb size={18} /><p><strong>数据洞察</strong>快消行业关注度连续 3 周排名第一，宝洁、联合利华相关内容互动率最高。</p></div>
        </div>
        <div className="panel keyword-panel">
          <div className="panel-title"><div><h2>热门关键词</h2><p>便利贴内容高频词</p></div><span>TOP 8</span></div>
          <div className="word-cloud"><strong>宝洁</strong><b>MT</b><em>群面</em><span>简历</span><i>秋招</i><small>Case</small><u>外企</u><mark>面经</mark></div>
          <div className="keyword-foot"><span># 宝洁八大问</span><strong>热度上升 32%</strong></div>
        </div>
      </section>
      <section className="panel activity-panel">
        <div className="panel-title"><div><h2>近 7 日内容增长</h2><p>新增便利贴与互动回应趋势</p></div><div className="chart-legend"><span><i className="note-series" />新增便利贴</span><span><i className="reply-series" />互动回应</span></div></div>
        <div className="bar-chart">
          {[48, 57, 43, 70, 66, 84, 76].map((v, i) => <div key={i}><span className="chart-bars"><motion.i className="replies" initial={{ height: 0 }} animate={{ height: `${v}%` }} transition={{ delay: .1 + i * .04 }} /><motion.i className="new-notes" initial={{ height: 0 }} animate={{ height: `${v * .62}%` }} transition={{ delay: .18 + i * .04 }} /></span><small>{["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i]}</small></div>)}
        </div>
      </section>
    </motion.main>
  );
}

export default function App() {
  const [page, setPage] = useState<PageName>("home");
  const [notes, setNotes] = useState<Note[]>(initialNotes as Note[]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [newId, setNewId] = useState<number | null>(null);

  function navigate(next: PageName) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function publish(note: Note) {
    setNotes(prev => [note, ...prev]);
    setNewId(note.id);
    setPublishOpen(false);
    setPage("home");
    setTimeout(() => setNewId(null), 1400);
  }

  return (
    <div className="app-shell">
      <Header page={page} setPage={navigate} />
      <AnimatePresence mode="wait">
        {page === "home" && <HomePage notes={notes} setSelected={setSelected} openPublish={() => setPublishOpen(true)} newId={newId} />}
        {page === "map" && <IntelMap />}
        {page === "admin" && <AdminDashboard />}
      </AnimatePresence>
      <footer><Logo /><p>由西交学生共同创造 · 让每一份秋招心声都被看见</p><span>© 2026 XJTU Career Notes</span></footer>
      <AnimatePresence>{selected && <NoteDetail note={selected} close={() => setSelected(null)} />}</AnimatePresence>
      <AnimatePresence>{publishOpen && <PublishModal close={() => setPublishOpen(false)} publish={publish} />}</AnimatePresence>
    </div>
  );
}

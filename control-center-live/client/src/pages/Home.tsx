import { ArrowDownRight, ArrowUpRight, Blocks, FileCheck2, GitBranch, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { StatusBadge } from "@/components/StatusBadge";
import { trpc } from "@/lib/trpc";

function Metric({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return <div className={`border-r-[3px] border-black p-5 last:border-r-0 ${accent ? "bg-[var(--acid)]" : "bg-white"}`}><div className="text-[10px] font-black tracking-[0.14em] text-black/60">{label}</div><div className="mt-3 text-5xl font-black leading-none tracking-[-0.1em]">{value.toString().padStart(2, "0")}</div></div>;
}

export default function Home() {
  const projects = trpc.controlCenter.projects.useQuery();
  const roadmap = trpc.controlCenter.roadmap.useQuery();
  const items = projects.data ?? [];
  const count = (status: "PASS" | "BLOCK" | "TODO") => items.filter(item => item.status === status).length;

  return <div>
    <section className="border-b-[3px] border-black px-5 py-9 lg:px-8 lg:py-14">
      <div className="max-w-5xl">
        <div className="mb-5 flex items-center gap-3 text-[11px] font-black tracking-[0.18em]"><span className="h-3 w-3 bg-[var(--signal)]" /> ECOSYSTEM / LIVE STATUS</div>
        <h1 className="max-w-4xl text-6xl font-black leading-[0.82] tracking-[-0.095em] sm:text-7xl lg:text-9xl">CONTROL<br /><span className="ml-[12%]">THE BUILD</span></h1>
        <div className="mt-8 grid max-w-3xl grid-cols-[20px_1fr] gap-4 text-sm font-bold leading-relaxed sm:text-base"><div className="border-t-[5px] border-black" /><p>إدارة دورة حياة المشاريع عبر Gate وEvidence وGate Engine. كل حالة معروضة هنا يجب أن تكون مرتبطة بـSHA وbaseline وWorkflow Run.</p></div>
      </div>
    </section>

    <section className="grid grid-cols-2 border-b-[3px] border-black lg:grid-cols-4">
      <Metric label="REGISTERED PROJECTS" value={items.length} />
      <Metric label="PASS" value={count("PASS")} accent />
      <Metric label="BLOCK" value={count("BLOCK")} />
      <Metric label="TODO" value={count("TODO")} />
    </section>

    <section className="grid lg:grid-cols-[1.4fr_.6fr]">
      <div className="border-b-[3px] border-black p-5 lg:border-b-0 lg:border-r-[3px] lg:p-8">
        <div className="mb-7 flex items-end justify-between gap-4"><div><div className="text-[10px] font-black tracking-[0.16em] text-black/55">REGISTERED PROJECTS</div><h2 className="mt-1 text-3xl font-black tracking-[-0.07em]">CURRENT GATE SURFACE</h2></div><GitBranch className="h-7 w-7" /></div>
        {projects.isLoading ? <div className="border-2 border-black p-5 text-xs font-black tracking-[0.13em]">LOADING PROJECT REGISTRY…</div> : items.length === 0 ? <div className="border-[3px] border-black bg-black p-7 text-white"><div className="text-2xl font-black tracking-[-0.05em]">NO PROJECTS REGISTERED.</div><p className="mt-3 max-w-sm text-sm font-bold text-white/70">سجّل أول مشروع لإظهار Gate الحالي وسجل Evidence وقرار Gate Engine.</p><Link href="/projects/new" className="mt-6 inline-flex border-2 border-white px-3 py-2 text-xs font-black tracking-[0.12em] hover:border-[var(--acid)] hover:bg-[var(--acid)] hover:text-black">REGISTER PROJECT <ArrowUpRight className="ml-2 h-4 w-4" /></Link></div> : <div className="space-y-3">{items.map(project => <Link key={project.id} href={`/projects/${project.id}`} className="group grid grid-cols-[1fr_auto] gap-4 border-[3px] border-black p-4 transition-colors hover:bg-[var(--acid)] sm:grid-cols-[1.4fr_.6fr_auto] sm:items-center"><div><div className="text-xl font-black tracking-[-0.05em]">{project.name}</div><div className="mt-1 font-mono text-[11px] font-bold text-black/55">{project.repository} / {project.defaultBranch}</div></div><div className="hidden sm:block"><div className="text-[10px] font-black tracking-[0.14em] text-black/55">CURRENT GATE</div><div className="mt-1 text-2xl font-black tracking-[-0.06em]">Gate {project.currentGate}</div></div><div className="flex items-center gap-3"><StatusBadge status={project.status} /><ArrowUpRight className="h-5 w-5" /></div></Link>)}</div>}
      </div>
      <div className="p-5 lg:p-8">
        <div className="mb-7 flex items-end justify-between"><div><div className="text-[10px] font-black tracking-[0.16em] text-black/55">Roadmap</div><h2 className="mt-1 text-3xl font-black tracking-[-0.07em]">NEXT / NOW</h2></div><Blocks className="h-7 w-7" /></div>
        {roadmap.data?.length ? <div className="space-y-4">{roadmap.data.slice(0, 4).map(item => <div key={item.id} className="border-l-[5px] border-black pl-3"><div className="flex items-center justify-between gap-3"><span className="text-sm font-black">{item.title}</span><StatusBadge status={item.status} /></div><div className="mt-1 text-[10px] font-bold tracking-[0.11em] text-black/55">{item.priority} / PRIORITY</div></div>)}</div> : <div className="border-l-[5px] border-[var(--signal)] pl-4 text-sm font-bold leading-relaxed">لا توجد مراحل Roadmap مسجلة. أضف مرحلة لتظهر الأولوية والحالة في هذه المساحة.</div>}
        <div className="mt-9 grid grid-cols-2 gap-3"><Link href="/evidence" className="border-2 border-black p-3 text-xs font-black tracking-[0.1em] hover:bg-black hover:text-white"><FileCheck2 className="mb-6 h-5 w-5" />EVIDENCE LOG</Link><Link href="/decisions" className="border-2 border-black p-3 text-xs font-black tracking-[0.1em] hover:bg-[var(--signal)] hover:text-white"><ShieldAlert className="mb-6 h-5 w-5" />DECISIONS</Link></div>
      </div>
    </section>
    <div className="flex items-center gap-3 border-t border-black/20 px-5 py-4 text-[10px] font-bold tracking-[0.12em] lg:px-8"><ArrowDownRight className="h-4 w-4" />STATUS IS A DECISION, NOT A DECORATION.</div>
  </div>;
}

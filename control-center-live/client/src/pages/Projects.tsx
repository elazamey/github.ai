import { ArrowUpRight, GitBranch, Plus } from "lucide-react";
import { Link } from "wouter";
import { StatusBadge } from "@/components/StatusBadge";
import { trpc } from "@/lib/trpc";

export default function Projects() {
  const { data = [], isLoading } = trpc.controlCenter.projects.useQuery();
  return <div className="p-5 lg:p-8"><div className="flex flex-wrap items-end justify-between gap-5 border-b-[3px] border-black pb-7"><div><div className="text-[10px] font-black tracking-[0.16em] text-black/55">PROJECT REGISTRY</div><h1 className="mt-2 text-5xl font-black tracking-[-0.09em] sm:text-7xl">PROJECTS</h1></div><Link href="/projects/new" className="inline-flex items-center border-[3px] border-black bg-[var(--acid)] px-4 py-3 text-xs font-black tracking-[0.12em] hover:bg-black hover:text-white"><Plus className="mr-2 h-4 w-4" /> REGISTER PROJECT</Link></div>
    <div className="mt-8">{isLoading ? <p className="text-xs font-black tracking-[0.12em]">LOADING…</p> : data.length === 0 ? <p className="border-[3px] border-black p-6 text-xl font-black">NO PROJECTS REGISTERED.</p> : <div className="divide-y-[3px] divide-black border-y-[3px] border-black">{data.map(project => <Link key={project.id} href={`/projects/${project.id}`} className="grid gap-4 p-5 transition-colors hover:bg-[var(--acid)] md:grid-cols-[1.2fr_.8fr_auto] md:items-center"><div><div className="text-2xl font-black tracking-[-0.06em]">{project.name}</div><div className="mt-2 flex items-center gap-2 font-mono text-xs font-bold text-black/55"><GitBranch className="h-4 w-4" />{project.repository}</div></div><div className="grid grid-cols-2 gap-3 text-[10px] font-black tracking-[0.12em]"><span>BRANCH / {project.defaultBranch}</span><span>Gate {project.currentGate}</span></div><div className="flex items-center gap-3"><StatusBadge status={project.status} /><ArrowUpRight className="h-5 w-5" /></div></Link>)}</div>}</div></div>;
}

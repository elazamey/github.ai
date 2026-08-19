import { ArrowLeft, CircleAlert, FileCheck2, GitCommitHorizontal, Workflow } from "lucide-react";
import { Link, useRoute } from "wouter";
import { StatusBadge } from "@/components/StatusBadge";
import { trpc } from "@/lib/trpc";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = Number(params?.id) || 1;
  const project = trpc.controlCenter.project.useQuery({ projectId });
  const gates = trpc.controlCenter.projectGates.useQuery({ projectId });
  const evidence = trpc.controlCenter.evidence.useQuery({ projectId });
  const definitions = trpc.controlCenter.gateDefinitions.useQuery();

  if (project.isLoading || gates.isLoading) return <div className="p-8 text-xs font-black tracking-[0.14em]">LOADING PROJECT SURFACE…</div>;
  if (!project.data) return <div className="p-8"><Link href="/projects" className="inline-flex items-center text-xs font-black tracking-[0.12em]"><ArrowLeft className="mr-2 h-4 w-4" />PROJECT REGISTRY</Link><div className="mt-7 border-[3px] border-black p-6 text-2xl font-black">PROJECT NOT FOUND.</div></div>;
  const gateRecords = gates.data ?? [];
  const definitionRows = definitions.data ?? [];

  return <div>
    <section className="border-b-[3px] border-black px-5 py-8 lg:px-8 lg:py-12">
      <Link href="/projects" className="inline-flex items-center text-[10px] font-black tracking-[0.14em] hover:underline"><ArrowLeft className="mr-2 h-4 w-4" />PROJECT REGISTRY</Link>
      <div className="mt-7 grid gap-8 lg:grid-cols-[1.3fr_.7fr] lg:items-end"><div><div className="text-[10px] font-black tracking-[0.15em] text-black/55">PROJECT / {project.data.id.toString().padStart(3, "0")}</div><h1 className="mt-2 text-5xl font-black leading-[0.85] tracking-[-0.09em] sm:text-7xl">{project.data.name}</h1><div className="mt-5 font-mono text-sm font-bold">{project.data.repository} / {project.data.defaultBranch}</div></div><div className="border-l-[5px] border-black pl-4"><div className="text-[10px] font-black tracking-[0.14em] text-black/55">ACTIVE DECISION</div><div className="mt-2 flex items-center gap-4"><div className="text-4xl font-black tracking-[-0.08em]">Gate {project.data.currentGate}</div><StatusBadge status={project.data.status} /></div><div className="mt-3 text-xs font-bold">baseline / <span className="font-mono">{project.data.baseline || "NOT_SET"}</span></div></div></div>
    </section>

    <section className="grid lg:grid-cols-[1.5fr_.5fr]">
      <div className="border-b-[3px] border-black p-5 lg:border-b-0 lg:border-r-[3px] lg:p-8"><div className="mb-6 flex items-end justify-between"><div><div className="text-[10px] font-black tracking-[0.14em] text-black/55">Gate Engine</div><h2 className="mt-1 text-3xl font-black tracking-[-0.07em]">GATES / 0—8</h2></div><GitCommitHorizontal className="h-7 w-7" /></div><div className="space-y-3">{definitionRows.map(definition => { const record = gateRecords.find(gate => gate.gateIndex === definition.index); const status = record?.status ?? "TODO"; return <div key={definition.index} className={`border-[3px] border-black p-4 ${definition.index === project.data?.currentGate ? "bg-[var(--acid)]" : "bg-white"}`}><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-baseline gap-4"><span className="text-3xl font-black tracking-[-0.08em]">{definition.index.toString().padStart(2, "0")}</span><span className="text-sm font-black tracking-[-0.03em]">Gate {definition.index}</span></div><StatusBadge status={status} /></div><div className="mt-4 grid gap-3 text-xs font-bold sm:grid-cols-2"><div><span className="text-[10px] font-black tracking-[0.12em] text-black/50">REQUIRED CONDITIONS</span><div className="mt-1 font-mono">{definition.requirements.join(" / ")}</div></div><div><span className="text-[10px] font-black tracking-[0.12em] text-black/50">baseline / SHA</span><div className="mt-1 font-mono">{record?.baseline || "NOT_SET"} / {record?.sha || "NOT_SET"}</div></div></div>{record?.checks?.length ? <div className="mt-4 border-t-2 border-black pt-3"><div className="text-[10px] font-black tracking-[0.12em] text-black/50">CHECK RESULTS</div><div className="mt-2 flex flex-wrap gap-2">{record.checks.map(check => <span key={check.name} className="border border-black px-2 py-1 font-mono text-[10px] font-bold">{check.name} / {check.status}</span>)}</div></div> : null}{record?.reasons?.length ? <div className="mt-4 flex gap-2 border-l-[4px] border-[var(--signal)] pl-3 text-xs font-bold"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>{record.reasons.join(" · ")}</span></div> : null}</div>; })}</div></div>
      <aside className="p-5 lg:p-8"><div className="mb-6 flex items-end justify-between"><div><div className="text-[10px] font-black tracking-[0.14em] text-black/55">VERIFICATION</div><h2 className="mt-1 text-3xl font-black tracking-[-0.07em]">EVIDENCE</h2></div><FileCheck2 className="h-7 w-7" /></div>{evidence.data?.length ? <div className="space-y-3">{evidence.data.slice(0, 5).map(item => <div key={item.id} className="border-2 border-black p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-black">Gate {item.gateIndex}</span><StatusBadge status={item.decision} /></div><div className="mt-3 font-mono text-[10px] font-bold break-all">SHA / {item.sha}</div><div className="mt-1 text-[10px] font-bold text-black/55">{item.branch} / {new Date(item.receivedAt).toLocaleString()}</div>{item.workflowRunUrl ? <a href={item.workflowRunUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center text-[10px] font-black tracking-[0.1em] underline">WORKFLOW RUN <Workflow className="ml-1 h-3 w-3" /></a> : null}</div>)}</div> : <div className="border-l-[5px] border-[var(--signal)] pl-4 text-sm font-bold leading-relaxed">لا يوجد Evidence لهذا المشروع بعد. GitHub Actions يمكنه الإرسال إلى API عند تهيئة CONTROL_CENTER_INGEST_TOKEN.</div>}</aside>
    </section>
  </div>;
}

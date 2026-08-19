import { Activity, ArrowUpRight, Blocks, FileCheck2, GitBranch, Map, Plus, Scale } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";

const navigation = [
  { label: "CONTROL", path: "/", icon: Blocks },
  { label: "PROJECTS", path: "/projects", icon: GitBranch },
  { label: "EVIDENCE", path: "/evidence", icon: FileCheck2 },
  { label: "DECISIONS", path: "/decisions", icon: Scale },
  { label: "ROADMAP", path: "/roadmap", icon: Map },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, loading } = useAuth();
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b-[3px] border-black px-5 py-4 lg:px-8">
        <div className="flex items-start justify-between gap-6">
          <Link href="/" className="group block">
            <span className="block text-[11px] font-black tracking-[0.28em]">ENGINEERING / CONTROL / CENTER</span>
            <span className="block text-3xl font-black leading-none tracking-[-0.08em] sm:text-4xl">GATE OPS<span className="text-[var(--signal)]">.</span></span>
          </Link>
          <div className="flex items-center gap-3 text-right">
            <div className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-black/55 sm:block">
              <div>MODE / OBSERVE + GOVERN</div>
              <div>{loading ? "AUTH / SYNC" : user ? `OWNER / ${user.name || "ACTIVE"}` : "AUTH / OPTIONAL"}</div>
            </div>
            <Link href="/projects/new">
              <Button className="h-10 rounded-none border-2 border-black bg-black px-4 text-xs font-black tracking-[0.12em] text-white hover:bg-[var(--signal)] hover:text-black">
                <Plus className="mr-2 h-4 w-4" /> REGISTER
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-91px)] grid-cols-1 lg:grid-cols-[220px_1fr]">
        <aside className="border-b-[3px] border-black lg:border-b-0 lg:border-r-[3px]">
          <nav className="grid grid-cols-2 lg:grid-cols-1">
            {navigation.map(item => {
              const active = location === item.path || (item.path !== "/" && location.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path} className={`group flex items-center justify-between border-b border-black px-4 py-5 text-xs font-black tracking-[0.12em] transition-colors ${active ? "bg-black text-white" : "bg-white text-black hover:bg-[var(--acid)]"}`}>
                  <span className="flex items-center gap-3"><Icon className="h-4 w-4" />{item.label}</span>
                  <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              );
            })}
          </nav>
          <div className="hidden p-4 lg:block">
            <div className="border-l-[5px] border-[var(--signal)] pl-3 text-[10px] font-bold uppercase leading-relaxed tracking-[0.12em] text-black/60">
              Evidence is the operating record.<br />
              Gate Engine is the decision point.
            </div>
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
      <footer className="border-t-[3px] border-black px-5 py-3 text-[10px] font-bold tracking-[0.12em] text-black/60 lg:px-8">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--signal)]" /> LIVE CONTROL SURFACE / SHA-BOUND / EVIDENCE-DRIVEN
      </footer>
    </div>
  );
}

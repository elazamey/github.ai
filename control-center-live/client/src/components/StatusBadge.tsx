export function StatusBadge({ status }: { status: "PASS" | "BLOCK" | "TODO" }) {
  const style = status === "PASS" ? "bg-[var(--acid)]" : status === "BLOCK" ? "bg-[var(--signal)] text-white" : "bg-black text-white";
  return <span className={`inline-flex min-w-16 justify-center border-2 border-black px-2 py-1 text-[10px] font-black tracking-[0.12em] ${style}`}>{status}</span>;
}

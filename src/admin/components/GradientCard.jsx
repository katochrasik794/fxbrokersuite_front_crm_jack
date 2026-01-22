// fxbrokersuite Trader brand card — clean, subtle, responsive
export default function BrandCard({
  label,
  value,
  hint,
  icon = null,          // optional: pass any React node/icon
  tone = "teal",        // "teal" | "slate" | "amber" | "red"
}) {
  const ring = {
    teal:  "from-[#0dd5c4] to-[#0ab3a5]", // fxbrokersuite Trader teal gradient edge
    slate: "from-[#334155] to-[#1f2937]",
    amber: "from-[#f59e0b] to-[#f59e0b]",
    red:   "from-[#ef4444] to-[#ef4444]",
  }[tone];

  return (
    <div className={`rounded-2xl p-[1px] bg-gradient-to-br ${ring}`}>
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              {label}
            </div>
            {icon ? <div className="text-slate-400">{icon}</div> : null}
          </div>
          <div className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </div>
          {hint && (
            <div className="mt-1 text-xs text-slate-500">
              {hint}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


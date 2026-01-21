// src/components/BrandCard.jsx
export default function BrandCard({
  label,
  value,
  hint,
  icon = null,
  tone = "teal", // "teal" | "slate" | "amber" | "red"
}) {
  const ring = {
    teal: "from-[#0dd5c4] to-[#0ab3a5]",
    slate: "from-[#334155] to-[#1f2937]",
    amber: "from-[#f59e0b] to-[#d97706]",
    red: "from-[#ef4444] to-[#b91c1c]",
  }[tone];

  return (
    <div className={`rounded-2xl p-[1px] bg-gradient-to-br ${ring}`}>
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              {label}
            </div>
            {icon && <div className="text-slate-400">{icon}</div>}
          </div>
          <div className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </div>
          {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
        </div>
      </div>
    </div>
  );
}


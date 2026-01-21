export default function EmptyState({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-100">
      <h2 className="text-xl font-semibold">{title}</h2>
      {subtitle && <p className="mt-1 text-slate-300">{subtitle}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}


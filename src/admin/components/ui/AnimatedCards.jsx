import { ReactNode } from "react";
import { Wallet, LineChart, TrendingUp } from "lucide-react";

/** Gradient frame that animates around the card */
export function GlowFrame({ children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      {/* Animated border */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-sky-500 animate-gradient-x opacity-90"></div>
      {/* Inner panel */}
      <div className="relative rounded-2xl bg-white/95 backdrop-blur px-4 py-4 md:px-5 md:py-5 shadow-[0_10px_40px_rgba(2,6,23,0.08)]">
        {/* Decorative orbs (subtle) */}
        <div className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full bg-cyan-200/40 blur-2xl animate-float-y" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-emerald-200/40 blur-2xl animate-float-y" />
        {children}
      </div>
    </div>
  );
}

/** KPI / Stat card */
export function StatCard({ title, value, hint, icon: Icon = TrendingUp }) {
  return (
    <GlowFrame>
      <div className="flex items-start gap-3">
        <div className="mt-1 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-emerald-500/15 text-cyan-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-gray-500">{title}</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
          {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
        </div>
      </div>
    </GlowFrame>
  );
}

/** Example layout wrapper to drop in anywhere */
export function StatsRow() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Balance" value="$25,040.22" icon={Wallet} />
      <StatCard title="Free Margin" value="$18,112.10" icon={LineChart} />
      <StatCard title="Wallet (USDT)" value="1,240.50" />
      <StatCard title="Total Deposits" value="$43,000.00" />
    </div>
  );
}


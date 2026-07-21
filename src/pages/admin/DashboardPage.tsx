import {
  ArrowUpRight,
  Award,
  Boxes,
  CalendarDays,
  Check,
  ChevronRight,
  PackageCheck,
  Plus,
  Scissors,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, LoadingState } from "../../components/ui";
import { supabase } from "../../lib/supabase";
import { dateID, rupiah } from "../../lib/utils";
import { statusLabels, type Order, type OrderStatus } from "../../types";

type Stats = {
  orders: number;
  customers: number;
  active: number;
  completed: number;
  revenue: number;
  rewards: number;
  recent: Order[];
  statusCounts: Record<OrderStatus, number>;
};
const stages: OrderStatus[] = [
  "received",
  "confirmed",
  "in_progress",
  "finishing",
  "ready",
];

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    void Promise.all([
      supabase
        .from("orders")
        .select("id,status,total_price", { count: "exact" }),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase
        .from("customers")
        .select("available_rewards")
        .gt("available_rewards", 0),
      supabase
        .from("orders")
        .select("*,customers(name,whatsapp)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]).then(([o, c, r, recent]) => {
      const orders = o.data ?? [];
      const statusCounts = Object.fromEntries(
        Object.keys(statusLabels).map((key) => [
          key,
          orders.filter((x) => x.status === key).length,
        ]),
      ) as Record<OrderStatus, number>;
      setStats({
        orders: o.count ?? orders.length,
        customers: c.count ?? 0,
        active: orders.filter(
          (x) => !["completed", "cancelled"].includes(x.status),
        ).length,
        completed: orders.filter((x) => x.status === "completed").length,
        revenue: orders
          .filter((x) => x.status === "completed")
          .reduce((n, x) => n + Number(x.total_price), 0),
        rewards: r.data?.length ?? 0,
        recent: (recent.data ?? []) as Order[],
        statusCounts,
      });
    });
  }, []);
  if (!stats) return <LoadingState />;
  const activePct = stats.orders
    ? Math.round((stats.active / stats.orders) * 100)
    : 0;
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-sage-600">
            <CalendarDays size={15} /> Ruang kerja atelier
          </div>
          <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
            Selamat datang kembali.
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Berikut gambaran pekerjaan MZ TAILOR hari ini.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/mz-admin/pelanggan" className="btn-secondary">
            <UserPlus size={17} />{" "}
            <span className="hidden sm:inline">Pelanggan</span>
          </Link>
          <Link to="/mz-admin/pesanan" className="btn-primary">
            <Plus size={17} /> Pesanan baru
          </Link>
        </div>
      </div>
      <section className="relative overflow-hidden rounded-[1.75rem] bg-ink p-6 text-white sm:p-8">
        <div className="absolute -right-12 -top-20 size-64 rounded-full border-[28px] border-sage-500/20" />
        <div className="absolute -bottom-28 right-24 size-64 rounded-full border-[20px] border-sage-300/10" />
        <div className="relative grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <div>
            <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-sage-300">
              <Sparkles size={15} /> Ringkasan operasional
            </div>
            <h2 className="max-w-xl text-3xl font-black leading-tight sm:text-4xl">
              Jaga ritme kerja tetap{" "}
              <span className="text-sage-300">bergerak.</span>
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/60">
              Ada {stats.active} pesanan yang masih berjalan. Pastikan setiap
              pelanggan mendapat update sebelum akhir hari.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {[
                { Icon: Boxes, label: "Pesanan", value: stats.orders },
                { Icon: Users, label: "Pelanggan", value: stats.customers },
                {
                  Icon: PackageCheck,
                  label: "Selesai",
                  value: stats.completed,
                },
              ].map(({ Icon, label, value }) => (
                <div
                  key={label}
                  className="min-w-28 border-l border-white/15 pl-3"
                >
                  <Icon size={16} className="text-sage-300" />
                  <b className="mt-2 block text-2xl">{value}</b>
                  <span className="text-[11px] text-white/45">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/65">
                Kapasitas antrean
              </span>
              <span className="text-sm font-bold text-sage-300">
                {activePct}%
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-sage-400 transition-all"
                style={{ width: `${Math.max(activePct, 4)}%` }}
              />
            </div>
            <p className="mt-4 text-xs leading-5 text-white/45">
              Pesanan aktif dari seluruh pesanan yang tercatat.
            </p>
            <Link
              to="/mz-admin/pesanan"
              className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-sage-300 hover:text-white"
            >
              Buka antrean <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="card p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage-600">
                Alur kerja
              </p>
              <h2 className="mt-2 text-xl font-black">
                Posisi pesanan hari ini
              </h2>
            </div>
            <Scissors className="text-sage-300" size={22} />
          </div>
          <div className="mt-8 space-y-5">
            {stages.map((stage, i) => (
              <div key={stage} className="flex items-center gap-4">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-black ${stats.statusCounts[stage] ? "bg-sage-600 text-white" : "border border-sage-200 text-sage-400"}`}
                >
                  {stats.statusCounts[stage] || <Check size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-bold">
                      {statusLabels[stage]}
                    </span>
                    <b className="text-sm text-sage-700">
                      {stats.statusCounts[stage]}
                    </b>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sage-50">
                    <div
                      className="h-full rounded-full bg-sage-400"
                      style={{
                        width: `${stats.active ? Math.max((stats.statusCounts[stage] / stats.active) * 100, 2) : 0}%`,
                      }}
                    />
                  </div>
                </div>
                {i < stages.length - 1 && (
                  <ChevronRight
                    className="hidden text-slate-300 sm:block"
                    size={16}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[1.5rem] bg-sage-100 p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage-700">
                Loyalitas
              </p>
              <h2 className="mt-2 text-xl font-black text-ink">
                Reward menunggu
              </h2>
            </div>
            <Award className="text-sage-700" size={23} />
          </div>
          <div className="mt-8">
            <b className="text-5xl font-black text-sage-700">{stats.rewards}</b>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">
              pelanggan memiliki reward yang siap digunakan.
            </p>
          </div>
          <Link
            to="/mz-admin/reward"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-sage-700 shadow-sm hover:bg-sage-50"
          >
            Kelola reward <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-sage-100 p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sage-600">
              Aktivitas terbaru
            </p>
            <h2 className="mt-2 text-xl font-black">Pesanan yang baru masuk</h2>
          </div>
          <Link
            to="/mz-admin/pesanan"
            className="inline-flex items-center gap-1 text-sm font-bold text-sage-700"
          >
            Lihat semua <ChevronRight size={16} />
          </Link>
        </div>
        {stats.recent.length === 0 ? (
          <EmptyState title="Belum ada pesanan" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-sage-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-4 sm:p-5">Nomor</th>
                  <th className="p-4 sm:p-5">Pelanggan</th>
                  <th className="p-4 sm:p-5">Tanggal</th>
                  <th className="p-4 sm:p-5">Status</th>
                  <th className="p-4 text-right sm:p-5">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {stats.recent.map((o) => (
                  <tr key={o.id} className="transition hover:bg-sage-50/50">
                    <td className="p-4 font-bold sm:p-5">{o.order_number}</td>
                    <td className="p-4 sm:p-5">
                      <span className="font-semibold">{o.customers?.name}</span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {o.customers?.whatsapp}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 sm:p-5">
                      {dateID(o.created_at)}
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className="rounded-full bg-sage-50 px-3 py-1 text-xs font-bold text-sage-700">
                        {statusLabels[o.status as OrderStatus]}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold sm:p-5">
                      {rupiah(o.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

import {
  Award,
  Boxes,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Settings,
  Shirt,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Brand } from "../Brand";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";

const nav = [
  ["dashboard", "Ringkasan", LayoutDashboard],
  ["pesanan", "Pesanan", Boxes],
  ["pelanggan", "Pelanggan", Users],
  ["katalog", "Katalog", Shirt],
  ["layanan", "Layanan", Scissors],
  ["loyalitas", "Loyalitas", Award],
  ["reward", "Reward", Gift],
  ["pengaturan", "Pengaturan", Settings],
] as const;

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const current =
    nav.find(([path]) => location.pathname.endsWith(`/${path}`))?.[1] ??
    "Ringkasan";
  const logout = async () => {
    await signOut();
    navigate("/mz-admin/login", { replace: true });
  };
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-bold text-slate-500 transition hover:bg-sage-50 hover:text-sage-700",
      isActive && "bg-sage-100 text-sage-700",
    );

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="sticky top-0 z-50 border-b border-sage-100 bg-white/95 shadow-[0_1px_0_rgb(20_83_45_/_0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-[1520px] items-center gap-5 px-4 lg:px-8">
          <Brand />
          <span className="hidden h-6 w-px bg-sage-100 lg:block" />
          <nav className="hide-scrollbar hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex">
            {nav.map(([path, label, Icon]) => (
              <NavLink key={path} to={path} className={linkClass}>
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-3 sm:flex">
            <div className="hidden text-right xl:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Masuk sebagai
              </p>
              <p className="max-w-40 truncate text-xs font-bold text-ink">
                {user?.email}
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-sage-100 text-xs font-black text-sage-700">
              A
            </span>
            <button
              onClick={logout}
              title="Keluar"
              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={17} />
            </button>
          </div>
          <button
            className="rounded-lg p-2 text-sage-800 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu admin"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="admin-mobile-menu lg:hidden">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Menu admin · {current}
            </p>
            <nav className="admin-mobile-nav sm:grid-cols-4">
              {nav.map(([path, label, Icon]) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      linkClass({ isActive }),
                      "min-h-11 border border-transparent px-3",
                      isActive && "border-sage-200 bg-white shadow-sm",
                    )
                  }
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={logout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-3 text-sm font-bold text-red-600"
            >
              <LogOut size={16} /> Keluar
            </button>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-[1520px] p-4 sm:p-6 lg:p-8">
        <div className="mb-6 hidden items-center gap-2 text-xs text-slate-400 lg:flex">
          <span>Dashboard</span>
          <span>/</span>
          <b className="text-sage-700">{current}</b>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

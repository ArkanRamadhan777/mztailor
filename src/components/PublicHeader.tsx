import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "./Brand";
const links = [
  ["Profil", "#profil"],
  ["Layanan", "#layanan"],
  ["Katalog", "#katalog"],
  ["Cara kerja", "#cara-kerja"],
  ["FAQ", "#faq"],
];
export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 isolate border-b border-sage-100 bg-white/95 shadow-[0_1px_0_rgb(20_83_45_/_0.04)] backdrop-blur-xl">
      <div className="container-page flex min-h-16 items-center justify-between">
        <Brand />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map(([label, href]) => (
            <a
              key={href}
              className="relative py-5 text-[13px] font-bold text-slate-600 after:absolute after:inset-x-0 after:bottom-3 after:h-0.5 after:origin-left after:scale-x-0 after:bg-sage-500 after:transition-transform hover:text-sage-700 hover:after:scale-x-100"
              href={href}
            >
              {label}
            </a>
          ))}
        </nav>
        <button
          className="rounded-xl p-2 text-sage-800 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="container-page flex flex-col gap-1 border-t border-sage-100 py-3 md:hidden">
          {links.map(([label, href]) => (
            <a
              key={href}
              className="rounded-xl px-3 py-3 font-semibold hover:bg-sage-50"
              href={href}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

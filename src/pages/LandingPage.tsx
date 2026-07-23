import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  Ruler,
  Scissors,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
} from "lucide-react";
import { PublicHeader } from "../components/PublicHeader";
import { Brand } from "../components/Brand";
import { WhatsAppIcon } from "../components/WhatsAppIcon";
import {
  fallbackPortfolios,
  fallbackServices,
  fallbackSettings,
} from "../data/fallback";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { normalizePhone, rupiah } from "../lib/utils";
import type { BusinessSettings, Portfolio, Service } from "../types";

const iconMap = { scissors: Scissors, ruler: Ruler, shirt: Shirt };
const faqs = [
  [
    "Berapa lama proses pengerjaan?",
    "Umumnya 7–14 hari kerja, tergantung jenis pakaian, detail model, dan antrean. Estimasi pasti diberikan setelah pesanan dikonfirmasi.",
  ],
  [
    "Apakah bisa membawa kain sendiri?",
    "Tentu. Kamu dapat membawa kain sendiri atau berkonsultasi lebih dahulu mengenai jenis dan kebutuhan kain.",
  ],
  [
    "Bagaimana proses pengukuran?",
    "Data ukuran dapat dikirim melalui formulir atau dilakukan langsung di tempat untuk hasil paling akurat.",
  ],
  [
    "Apakah bisa permak pakaian?",
    "Bisa, mulai dari penyesuaian panjang dan ukuran hingga penggantian resleting dan perbaikan detail.",
  ],
];

export function LandingPage() {
  const [settings, setSettings] = useState<BusinessSettings>(fallbackSettings);
  const [services, setServices] = useState<Service[]>(fallbackServices);
  const [portfolios, setPortfolios] = useState<Portfolio[]>(fallbackPortfolios);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void Promise.all([
      supabase.from("business_settings").select("*").limit(1).maybeSingle(),
      supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("portfolios")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
    ]).then(([a, b, c]) => {
      if (a.data) setSettings(a.data);
      if (b.data?.length) setServices(b.data);
      if (c.data?.length) setPortfolios(c.data);
    });
  }, []);
  const wa = `https://wa.me/${normalizePhone(settings.whatsapp)}?text=${encodeURIComponent("Halo MZ TAILOR, saya ingin konsultasi jahit.")}`;
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-sage-50 via-white to-sage-100 py-14 sm:py-20 lg:py-28">
          <div className="absolute -right-24 top-8 size-72 rounded-full bg-sage-200/50 blur-3xl" />
          <div className="container-page relative grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-sage-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-sage-700">
                <Sparkles size={14} /> Dibuat khusus untukmu
              </span>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.12] tracking-tight text-ink sm:text-6xl">
                Jahitan yang pas, untuk setiap{" "}
                <span className="text-sage-600">cerita istimewa.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                {settings.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary px-6 py-4"
                >
                  <WhatsAppIcon size={18} /> Hubungi MZ TAILOR
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
                {["Ukuran personal", "Jahitan rapi", "Proses transparan"].map(
                  (x) => (
                    <span key={x} className="flex items-center gap-2">
                      <Check
                        className="rounded-full bg-sage-100 p-1 text-sage-700"
                        size={20}
                      />
                      {x}
                    </span>
                  ),
                )}
              </div>
            </div>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
              <div className="absolute inset-4 rotate-3 rounded-[2.5rem] bg-sage-300" />
              <img
                src={portfolios[0]?.image_url}
                alt="Hasil jahitan MZ Tailor"
                className="relative h-full w-full rounded-[2.5rem] object-cover object-top shadow-2xl"
              />
              <div className="absolute -bottom-5 -left-4 card flex items-center gap-3 p-4">
                <span className="grid size-11 place-items-center rounded-full bg-sage-100">
                  <Heart className="text-sage-700" size={20} />
                </span>
                <div>
                  <b className="block">Dibuat dengan teliti</b>
                  <span className="text-xs text-slate-500">
                    Sampai detail terkecil
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="profil" className="section-pad">
          <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="grid grid-cols-2 gap-3">
              <img
                src={portfolios[1]?.image_url}
                className="h-72 w-full rounded-3xl object-cover object-top"
                alt="Proses jahit"
              />
              <div className="mt-10 rounded-3xl bg-sage-700 p-6 text-white">
                <Scissors size={34} />
                <p className="mt-16 text-4xl font-extrabold">100%</p>
                <p className="text-sm text-sage-100">
                  Dikerjakan dengan perhatian
                </p>
              </div>
            </div>
            <div>
              <p className="mb-3 font-bold uppercase tracking-widest text-sage-600">
                Tentang kami
              </p>
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                Bukan sekadar pakaian, tapi rasa percaya diri.
              </h2>
              <p className="mt-5 leading-8 text-slate-600">
                {settings.business_name} hadir untuk membantu setiap orang
                mendapatkan pakaian yang benar-benar sesuai—dari ukuran, model,
                sampai kenyamanan. Kami menggabungkan pengalaman, ketelitian,
                dan komunikasi yang terbuka.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  [BadgeCheck, "Pengerjaan profesional"],
                  [Clock3, "Estimasi transparan"],
                  [Ruler, "Ukuran tersimpan"],
                  [ShieldCheck, "Privasi terjaga"],
                ].map(([Icon, label]) => (
                  <div
                    key={String(label)}
                    className="flex items-center gap-3 font-semibold"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-sage-50 text-sage-700">
                      <Icon size={20} />
                    </span>
                    {String(label)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="layanan" className="section-pad bg-sage-50">
          <div className="container-page">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="mb-3 font-bold uppercase tracking-widest text-sage-600">
                Layanan kami
              </p>
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                Solusi jahit untuk setiap kebutuhan
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {services.map((s, i) => {
                const Icon =
                  iconMap[s.icon as keyof typeof iconMap] || Scissors;
                return (
                  <article
                    key={s.id}
                    className="card group p-6 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <span className="grid size-13 place-items-center rounded-2xl bg-sage-100 text-sage-700">
                      <Icon />
                    </span>
                    <h3 className="mt-6 text-xl font-bold">{s.name}</h3>
                    <p className="mt-3 min-h-12 leading-7 text-slate-500">
                      {s.description}
                    </p>
                    {s.starting_price && (
                      <p className="mt-5 text-sm">
                        Mulai{" "}
                        <b className="text-sage-700">
                          {rupiah(s.starting_price)}
                        </b>
                      </p>
                    )}
                    <span className="mt-6 inline-flex size-8 items-center justify-center rounded-full bg-sage-50 font-bold text-sage-700">
                      0{i + 1}
                    </span>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="katalog" className="section-pad">
          <div className="container-page">
            <div className="mb-10 flex flex-col justify-between gap-5 border-b border-sage-100 pb-7 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 font-bold uppercase tracking-[0.22em] text-sage-600">
                  Katalog
                </p>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
                  Hasil jahitan pilihan
                </h2>
              </div>
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-sage-700"
              >
                Punya model sendiri? Konsultasikan di WhatsApp →
              </a>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {portfolios.map((p) => (
                <article
                  key={p.id}
                  className="group relative aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-sage-100"
                >
                  <img
                    loading="lazy"
                    src={p.image_url}
                    alt={p.title}
                    className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.035]"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/35 to-transparent p-6 pt-28 text-white">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-sage-200">
                      {p.category}
                    </span>
                    <h3 className="mt-2 text-xl font-bold tracking-tight">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-white/75">
                      {p.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-pad bg-ink text-white">
          <div className="container-page">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-3 font-bold uppercase tracking-widest text-sage-300">
                Kenapa MZ Tailor
              </p>
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                Nyaman sejak konsultasi pertama
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  Ruler,
                  "Ukuran personal",
                  "Data ukuran tersimpan aman untuk pesanan berikutnya.",
                ],
                [
                  Star,
                  "Hasil berkualitas",
                  "Kontrol kualitas dilakukan sebelum pesanan diserahkan.",
                ],
                [
                  MessageCircle,
                  "Mudah dihubungi",
                  "Update status siap dikirim melalui WhatsApp.",
                ],
                [
                  Heart,
                  "Loyalitas dihargai",
                  "Satu pesanan selesai mendapatkan satu stempel.",
                ],
              ].map(([Icon, t, d]) => (
                <div key={String(t)}>
                  <Icon className="text-sage-300" />
                  <h3 className="mt-5 text-lg font-bold">{String(t)}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {String(d)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="section-pad">
          <div className="container-page">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-3 font-bold uppercase tracking-widest text-sage-600">
                Cara kerja
              </p>
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                Empat langkah sebelum kami mulai menjahit
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                [
                  "01",
                  "Konsultasi model",
                  "Kirim referensi dan kebutuhanmu melalui WhatsApp.",
                ],
                [
                  "02",
                  "Konfirmasi",
                  "Admin menghubungi untuk detail dan harga.",
                ],
                ["03", "Proses jahit", "Pantau progres dari update WhatsApp."],
                ["04", "Selesai", "Ambil pesanan dan dapatkan satu stempel."],
              ].map(([n, t, d]) => (
                <div key={n} className="relative rounded-3xl bg-sage-50 p-6">
                  <span className="text-4xl font-extrabold text-sage-200">
                    {n}
                  </span>
                  <h3 className="mt-7 font-bold">{t}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{d}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
              >
                <WhatsAppIcon size={18} /> Konsultasi via WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section className="section-pad bg-sage-100">
          <div className="container-page grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="mb-3 font-bold uppercase tracking-widest text-sage-700">
                Program loyalitas
              </p>
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                Lima kali menjahit, satu kejutan menanti.
              </h2>
              <p className="mt-5 max-w-xl leading-8 text-slate-600">
                Setiap nomor pesanan yang selesai mendapat satu stempel.
                Kumpulkan lima stempel untuk membuka reward spesial dari MZ
                TAILOR.
              </p>
            </div>
            <div className="card p-7">
              <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className="grid aspect-square place-items-center rounded-full bg-sage-600 text-white shadow-lg"
                  >
                    <Scissors size={20} />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-sage-100 pt-5">
                <span className="font-bold">5 / 5 stempel</span>
                <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-800">
                  Reward aktif!
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="section-pad">
          <div className="container-page grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <p className="mb-3 font-bold uppercase tracking-widest text-sage-600">
                FAQ
              </p>
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                Yang sering ditanyakan
              </h2>
              <p className="mt-4 text-slate-500">
                Belum menemukan jawaban? Hubungi kami melalui WhatsApp.
              </p>
            </div>
            <div className="divide-y divide-sage-100">
              {faqs.map(([q, a]) => (
                <details key={q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                    {q}
                    <ChevronDown
                      className="shrink-0 transition group-open:rotate-180"
                      size={20}
                    />
                  </summary>
                  <p className="mt-3 pr-8 text-sm leading-7 text-slate-500">
                    {a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-8">
          <div className="container-page overflow-hidden rounded-[2rem] bg-sage-700 px-6 py-12 text-center text-white sm:px-12">
            <WhatsAppIcon className="mx-auto text-sage-200" size={40} />
            <h2 className="mx-auto mt-5 max-w-xl text-3xl font-extrabold">
              Siap membuat pakaian yang benar-benar pas?
            </h2>
            <p className="mt-3 text-sage-100">
              Konsultasikan kebutuhanmu. Kami senang membantu.
            </p>
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 font-bold text-sage-800 hover:bg-sage-50"
            >
              <WhatsAppIcon size={18} /> Hubungi via WhatsApp
            </a>
          </div>
        </section>
      </main>
      <footer className="mt-12 bg-ink py-12 text-white">
        <div className="container-page grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Brand light />
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/55">
              {settings.tagline}
            </p>
          </div>
          <div>
            <b>Lokasi</b>
            <p className="mt-3 flex gap-2 text-sm leading-6 text-white/55">
              <MapPin size={17} className="shrink-0" />
              {settings.address}
            </p>
          </div>
          <div>
            <b>Jam buka</b>
            <p className="mt-3 flex gap-2 text-sm text-white/55">
              <Clock3 size={17} />
              {settings.hours}
            </p>
          </div>
          <div>
            <b>Hubungi</b>
            <a
              href={wa}
              className="mt-3 flex gap-2 text-sm text-white/55 hover:text-white"
            >
              <WhatsAppIcon size={17} />
              {settings.whatsapp}
            </a>
          </div>
        </div>
        <div className="container-page mt-10 border-t border-white/10 pt-6 text-xs text-white/40">
          © {new Date().getFullYear()} MZ TAILOR. Dibuat dengan teliti.
        </div>
      </footer>
    </div>
  );
}

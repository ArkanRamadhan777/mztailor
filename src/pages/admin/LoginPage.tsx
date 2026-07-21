import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Brand } from "../../components/Brand";
import { useAuth } from "../../contexts/AuthContext";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

const schema = z.object({
  email: z.email("Email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
});
type Form = z.infer<typeof schema>;

export function LoginPage() {
  const [show, setShow] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination =
    (location.state as { from?: string } | null)?.from || "/mz-admin/dashboard";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user && isAdmin) navigate(destination, { replace: true });
  }, [user, isAdmin, navigate, destination]);

  useEffect(() => {
    if ((location.state as { forbidden?: boolean } | null)?.forbidden) {
      toast.error("Akun ini tidak memiliki akses admin.");
      void signOut();
    }
  }, [location.state, signOut]);

  const login = async (values: Form) => {
    if (!isSupabaseConfigured) {
      toast.error("Konfigurasi Supabase belum tersedia.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) toast.error("Email atau kata sandi tidak cocok.");
    else navigate(destination, { replace: true });
  };

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(420px,0.8fr)_1.2fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-ink text-white lg:block">
        <img
          src="/images/menswear-koko.png"
          alt="Karya jahitan pria MZ TAILOR"
          className="absolute inset-0 h-full w-full object-cover object-top opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-sage-800/40" />
        <div className="relative flex min-h-screen flex-col justify-between p-12 xl:p-16">
          <Brand light />
          <div className="max-w-md pb-8">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-sage-300">
              Panel internal
            </p>
            <h1 className="text-5xl font-black leading-[1.04] tracking-tight xl:text-6xl">
              Rapi di meja kerja, rapi di setiap jahitan.
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/65">
              Kelola pesanan, pelanggan, ukuran, dan progres pengerjaan MZ
              TAILOR dari satu tempat.
            </p>
          </div>
          <p className="text-xs text-white/40">
            MZ TAILOR · Jahitan rapi, pas di hati.
          </p>
        </div>
      </section>
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sage-50/70 px-5 py-8 sm:px-10">
        <div className="absolute -bottom-24 -right-24 size-72 rounded-full bg-sage-200/45 blur-3xl" />
        <div className="relative w-full max-w-[470px] rounded-[2rem] border border-white/80 bg-white/90 p-7 shadow-[0_24px_70px_rgb(20_83_45_/_0.10)] sm:p-10">
          <div className="mb-16 lg:hidden">
            <Brand />
          </div>
          <div className="mb-9">
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-sage-600">
              <span className="size-2 rounded-full bg-sage-500" /> Masuk admin
            </p>
            <h2 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Halo, selamat datang.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Masuk untuk melanjutkan pengelolaan usaha.
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit(login)}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">
                Email
              </span>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-3.5 text-slate-400"
                  size={18}
                />
                <input
                  className="w-full rounded-xl border border-sage-200 bg-sage-50/45 py-3 pl-10 pr-3 text-base outline-none transition placeholder:text-slate-400 focus:border-sage-500 focus:bg-white focus:ring-4 focus:ring-sage-100"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@mztailor.id"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <span className="mt-2 block text-xs text-red-600">
                  {errors.email.message}
                </span>
              )}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">
                Kata sandi
              </span>
              <div className="relative">
                <LockKeyhole
                  className="absolute left-3 top-3.5 text-slate-400"
                  size={18}
                />
                <input
                  className="w-full rounded-xl border border-sage-200 bg-sage-50/45 py-3 pl-10 pr-10 text-base outline-none transition placeholder:text-slate-400 focus:border-sage-500 focus:bg-white focus:ring-4 focus:ring-sage-100"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  {...register("password")}
                />
                <button
                  type="button"
                  aria-label="Tampilkan kata sandi"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-sage-700"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="mt-2 block text-xs text-red-600">
                  {errors.password.message}
                </span>
              )}
            </label>
            <button
              disabled={isSubmitting}
              className="btn-primary mt-3 w-full rounded-xl py-4 disabled:opacity-60"
            >
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" size={19} />
              ) : (
                "Masuk ke dashboard"
              )}
            </button>
          </form>
          <p className="mt-10 text-center text-xs text-slate-400">
            Akses khusus administrator MZ TAILOR
          </p>
        </div>
      </section>
    </main>
  );
}

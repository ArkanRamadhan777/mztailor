import {
  AtSign,
  Building2,
  Clock3,
  MapPin,
  MessageCircle,
  Save,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../../components/admin/PageHeader";
import { LoadingState } from "../../components/ui";
import { fallbackSettings } from "../../data/fallback";
import { supabase } from "../../lib/supabase";
import type { BusinessSettings } from "../../types";
export function SettingsPage() {
  const [form, setForm] = useState<BusinessSettings | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void supabase
      .from("business_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setForm(data ?? fallbackSettings));
  }, []);
  if (!form) return <LoadingState />;
  const field = (key: keyof BusinessSettings, value: string) =>
    setForm({ ...form, [key]: value });
  const save = async () => {
    setBusy(true);
    const payload = {
      business_name: form.business_name,
      tagline: form.tagline,
      description: form.description,
      whatsapp: form.whatsapp,
      address: form.address,
      instagram: form.instagram || null,
      hours: form.hours,
      hero_image_url: form.hero_image_url || null,
    };
    const result = form.id
      ? await supabase
          .from("business_settings")
          .update(payload)
          .eq("id", form.id)
      : await supabase
          .from("business_settings")
          .insert(payload)
          .select()
          .single();
    if (!form.id && result.data) setForm(result.data);
    setBusy(false);
    if (result.error) toast.error(result.error.message);
    else toast.success("Pengaturan disimpan");
  };
  return (
    <>
      <PageHeader
        title="Pengaturan"
        description="Informasi usaha yang ditampilkan di halaman publik."
      />
      <div className="card max-w-3xl p-5 sm:p-8">
        <div className="mb-7 flex items-center gap-3 border-b border-sage-100 pb-5">
          <span className="grid size-11 place-items-center rounded-2xl bg-sage-100 text-sage-700">
            <Building2 />
          </span>
          <div>
            <b>Profil MZ TAILOR</b>
            <p className="text-xs text-slate-500">
              Pastikan informasi selalu terbaru.
            </p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nama usaha" icon={<Building2 size={16} />}>
            <input
              className="input"
              value={form.business_name}
              onChange={(e) => field("business_name", e.target.value)}
            />
          </Field>
          <Field label="Tagline">
            <input
              className="input"
              value={form.tagline}
              onChange={(e) => field("tagline", e.target.value)}
            />
          </Field>
          <Field label="Deskripsi" wide>
            <textarea
              className="input min-h-28"
              value={form.description}
              onChange={(e) => field("description", e.target.value)}
            />
          </Field>
          <Field label="Nomor WhatsApp" icon={<MessageCircle size={16} />}>
            <input
              className="input"
              value={form.whatsapp}
              onChange={(e) => field("whatsapp", e.target.value)}
            />
          </Field>
            <Field label="Instagram" icon={<AtSign size={16} />}>
            <input
              className="input"
              value={form.instagram ?? ""}
              onChange={(e) => field("instagram", e.target.value)}
            />
          </Field>
          <Field label="Alamat" wide icon={<MapPin size={16} />}>
            <textarea
              className="input"
              value={form.address}
              onChange={(e) => field("address", e.target.value)}
            />
          </Field>
          <Field label="Jam operasional" wide icon={<Clock3 size={16} />}>
            <input
              className="input"
              value={form.hours}
              onChange={(e) => field("hours", e.target.value)}
            />
          </Field>
        </div>
        <button
          className="btn-primary mt-7"
          disabled={busy}
          onClick={() => void save()}
        >
          <Save size={18} />
          {busy ? "Menyimpan..." : "Simpan pengaturan"}
        </button>
      </div>
    </>
  );
}
function Field({
  label,
  icon,
  wide,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="mb-2 flex items-center gap-2 text-xs font-bold">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

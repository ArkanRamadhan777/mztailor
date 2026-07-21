import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  Minus,
  Plus,
  Scissors,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Brand } from "../components/Brand";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const itemSchema = z.object({
  clothing_type: z.string().min(2, "Pilih jenis pakaian"),
  model: z.string().min(2, "Jelaskan model pakaian"),
  quantity: z.number().int().min(1, "Minimal 1").max(100),
  reference: z.any().optional(),
});
const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  whatsapp: z
    .string()
    .regex(/^(\+?62|0)[0-9]{8,13}$/, "Nomor WhatsApp tidak valid"),
  address: z.string().min(8, "Alamat perlu lebih lengkap"),
  measurements: z.object({
    chest: z.string().optional(),
    waist: z.string().optional(),
    hips: z.string().optional(),
    length: z.string().optional(),
    shoulder: z.string().optional(),
    sleeve: z.string().optional(),
  }),
  notes: z.string().max(1000).optional(),
  items: z.array(itemSchema).min(1),
});
type FormData = z.infer<typeof schema>;
const clothing = [
  "Kemeja",
  "Blus",
  "Dress",
  "Gamis",
  "Kebaya",
  "Celana",
  "Rok",
  "Jas",
  "Seragam",
  "Permak",
  "Lainnya",
];

export function OrderPage() {
  const [success, setSuccess] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      whatsapp: "",
      address: "",
      notes: "",
      measurements: {
        chest: "",
        waist: "",
        hips: "",
        length: "",
        shoulder: "",
        sleeve: "",
      },
      items: [{ clothing_type: "", model: "", quantity: 1 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const onSubmit = async (data: FormData) => {
    if (!isSupabaseConfigured) {
      toast.error(
        "Supabase belum dikonfigurasi. Isi file .env terlebih dahulu.",
      );
      return;
    }
    try {
      const items = [];
      for (let i = 0; i < data.items.length; i++) {
        let reference_path: string | null = null;
        const files = data.items[i].reference as FileList | undefined;
        if (files?.[0]) {
          const file = files[0];
          if (file.size > 5 * 1024 * 1024)
            throw new Error("Foto maksimal 5 MB");
          const ext = file.name.split(".").pop() || "jpg";
          const path = `public/${crypto.randomUUID()}.${ext}`;
          const upload = await supabase.storage
            .from("order-references")
            .upload(path, file);
          if (upload.error) throw upload.error;
          reference_path = path;
        }
        items.push({
          clothing_type: data.items[i].clothing_type,
          model: data.items[i].model,
          quantity: data.items[i].quantity,
          reference_path,
        });
      }
      const { data: number, error } = await supabase.rpc(
        "create_public_order",
        {
          p_name: data.name,
          p_whatsapp: data.whatsapp,
          p_address: data.address,
          p_measurements: data.measurements,
          p_notes: data.notes || null,
          p_items: items,
        },
      );
      if (error) throw error;
      setSuccess(String(number));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pesanan gagal dikirim");
    }
  };
  if (success)
    return (
      <main className="grid min-h-screen place-items-center bg-sage-50 p-4">
        <div className="card w-full max-w-lg p-8 text-center sm:p-12">
          <CheckCircle2 className="mx-auto text-sage-600" size={64} />
          <h1 className="mt-6 text-3xl font-extrabold">Pesanan terkirim!</h1>
          <p className="mt-3 leading-7 text-slate-500">
            Simpan nomor pesanan ini. Admin akan menghubungimu melalui WhatsApp
            untuk konfirmasi.
          </p>
          <div className="my-7 rounded-2xl bg-sage-50 p-5">
            <span className="text-xs font-bold uppercase tracking-widest text-sage-600">
              Nomor pesanan
            </span>
            <strong className="mt-2 block text-2xl tracking-wide">
              {success}
            </strong>
          </div>
          <Link to="/" className="btn-primary w-full">
            Kembali ke beranda
          </Link>
        </div>
      </main>
    );
  return (
    <div className="min-h-screen bg-sage-50">
      <header className="border-b border-sage-100 bg-white">
        <div className="container-page flex h-18 items-center justify-between">
          <Brand />
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-bold text-sage-700"
          >
            <ArrowLeft size={17} />{" "}
            <span className="hidden sm:inline">Kembali</span>
          </Link>
        </div>
      </header>
      <main className="container-page grid gap-8 py-8 lg:grid-cols-[.65fr_1.35fr] lg:py-14">
        <aside>
          <div className="lg:sticky lg:top-8">
            <span className="inline-flex rounded-full bg-sage-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sage-700">
              Form pemesanan
            </span>
            <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              Ceritakan pakaian yang kamu inginkan.
            </h1>
            <p className="mt-4 leading-7 text-slate-500">
              Isi data selengkap mungkin. Harga dan estimasi pengerjaan akan
              dikonfirmasi oleh admin.
            </p>
            <div className="mt-8 hidden rounded-3xl bg-sage-700 p-6 text-white lg:block">
              <Scissors />
              <p className="mt-8 font-bold">Data aman dan privat</p>
              <p className="mt-2 text-sm leading-6 text-sage-100">
                Nomor, alamat, ukuran, dan foto referensimu hanya dapat dilihat
                admin.
              </p>
            </div>
          </div>
        </aside>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="card space-y-8 p-5 sm:p-8"
        >
          <FormSection number="01" title="Data pemesan">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nama lengkap" error={errors.name?.message}>
                <input
                  className="input"
                  placeholder="Nama kamu"
                  {...register("name")}
                />
              </Field>
              <Field label="Nomor WhatsApp" error={errors.whatsapp?.message}>
                <input
                  className="input"
                  inputMode="tel"
                  placeholder="08xxxxxxxxxx"
                  {...register("whatsapp")}
                />
              </Field>
              <Field
                label="Alamat lengkap"
                error={errors.address?.message}
                wide
              >
                <textarea
                  className="input min-h-24 resize-y"
                  placeholder="Alamat pengambilan/pengantaran"
                  {...register("address")}
                />
              </Field>
            </div>
          </FormSection>
          <FormSection number="02" title="Data ukuran">
            <p className="mb-4 text-xs text-slate-500">
              Isi dalam sentimeter. Boleh dikosongkan jika ingin diukur
              langsung.
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                ["chest", "Lingkar dada"],
                ["waist", "Lingkar pinggang"],
                ["hips", "Lingkar pinggul"],
                ["length", "Panjang baju"],
                ["shoulder", "Lebar bahu"],
                ["sleeve", "Panjang lengan"],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <div className="relative">
                    <input
                      className="input pr-10"
                      inputMode="decimal"
                      placeholder="0"
                      {...register(
                        `measurements.${key as keyof FormData["measurements"]}`,
                      )}
                    />
                    <span className="absolute right-3 top-3 text-xs text-slate-400">
                      cm
                    </span>
                  </div>
                </Field>
              ))}
            </div>
          </FormSection>
          <FormSection number="03" title="Item pesanan">
            <div className="space-y-5">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-2xl border border-sage-100 bg-sage-50/60 p-4 sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <b>Item {index + 1}</b>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="rounded-full p-2 text-red-500 hover:bg-red-50"
                        aria-label="Hapus item"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Jenis pakaian"
                      error={errors.items?.[index]?.clothing_type?.message}
                    >
                      <select
                        className="input"
                        {...register(`items.${index}.clothing_type`)}
                      >
                        <option value="">Pilih jenis</option>
                        {clothing.map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      label="Model pakaian"
                      error={errors.items?.[index]?.model?.message}
                    >
                      <input
                        className="input"
                        placeholder="Contoh: A-line, lengan balon"
                        {...register(`items.${index}.model`)}
                      />
                    </Field>
                    <Field
                      label="Jumlah"
                      error={errors.items?.[index]?.quantity?.message}
                    >
                      <div className="flex items-center rounded-xl border border-sage-200 bg-white">
                        <button
                          type="button"
                          className="p-3"
                          onClick={() => {
                            const el = document.querySelector(
                              `[name='items.${index}.quantity']`,
                            ) as HTMLInputElement;
                            el?.stepDown();
                            el?.dispatchEvent(
                              new Event("input", { bubbles: true }),
                            );
                          }}
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          className="w-full bg-transparent text-center outline-none"
                          type="number"
                          min="1"
                            {...register(`items.${index}.quantity`, {
                              valueAsNumber: true,
                            })}
                        />
                        <button
                          type="button"
                          className="p-3"
                          onClick={() => {
                            const el = document.querySelector(
                              `[name='items.${index}.quantity']`,
                            ) as HTMLInputElement;
                            el?.stepUp();
                            el?.dispatchEvent(
                              new Event("input", { bubbles: true }),
                            );
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </Field>
                    <Field label="Foto referensi">
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-sage-300 bg-white p-3 text-sm text-sage-700 hover:bg-sage-50">
                        <ImagePlus size={18} />
                        <span className="truncate">
                          {(watch(`items.${index}.reference`) as FileList)?.[0]
                            ?.name || "Pilih foto (maks. 5 MB)"}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          {...register(`items.${index}.reference`)}
                        />
                      </label>
                    </Field>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  append({ clothing_type: "", model: "", quantity: 1 })
                }
                className="btn-secondary w-full border-dashed"
              >
                <Plus size={18} /> Tambah item
              </button>
            </div>
          </FormSection>
          <FormSection number="04" title="Catatan tambahan">
            <textarea
              className="input min-h-28 resize-y"
              placeholder="Detail bahan, warna, deadline acara, atau informasi lainnya..."
              {...register("notes")}
            />
          </FormSection>
          <div className="border-t border-sage-100 pt-6">
            <button
              disabled={isSubmitting}
              className="btn-primary w-full py-4 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin" size={19} /> Mengirim
                  pesanan...
                </>
              ) : (
                <>
                  Kirim Pesanan <ArrowLeft className="rotate-180" size={18} />
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">
              Dengan mengirim, kamu menyetujui data digunakan untuk memproses
              pesanan.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
function FormSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-sage-100 text-xs font-extrabold text-sage-700">
          {number}
        </span>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
function Field({
  label,
  error,
  wide,
  children,
}: {
  label: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

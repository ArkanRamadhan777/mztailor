import {
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Ruler,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "../../components/admin/PageHeader";
import {
  ConfirmModal,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
} from "../../components/ui";
import { useSupabaseList } from "../../hooks/useSupabaseList";
import { supabase } from "../../lib/supabase";
import { dateID, normalizePhone } from "../../lib/utils";
import type { Customer } from "../../types";
export function CustomersPage() {
  const { data, loading, error, reload } = useSupabaseList<Customer>(
    "customers",
    "*,customer_measurements(*)",
  );
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Customer | null>(null);
  const [remove, setRemove] = useState<Customer | null>(null);
  const shown = useMemo(
    () =>
      data.filter((x) =>
        `${x.name} ${x.whatsapp}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [data, q],
  );
  const del = async () => {
    if (!remove) return;
    const { error: e } = await supabase
      .from("customers")
      .delete()
      .eq("id", remove.id);
    if (e) toast.error("Pelanggan dengan pesanan tidak dapat dihapus.");
    else {
      toast.success("Pelanggan dihapus");
      setRemove(null);
      await reload();
    }
  };
  return (
    <>
      <PageHeader
        title="Pelanggan"
        description="Simpan kontak dan ukuran pelanggan."
        action={
          <button
            className="btn-primary"
            onClick={() =>
              setEdit({
                id: "",
                name: "",
                whatsapp: "",
                address: "",
                active_stamps: 0,
                available_rewards: 0,
                created_at: "",
              })
            }
          >
            <Plus size={18} /> Tambah pelanggan
          </button>
        }
      />
      <div className="card mb-5 bg-white p-3">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="input h-12 pl-4 pr-11"
            placeholder="Cari pelanggan..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : shown.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((c) => (
            <article key={c.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-full bg-sage-100 font-extrabold text-sage-700">
                    {c.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <b>{c.name}</b>
                    <p className="text-xs text-slate-400">
                      Sejak {dateID(c.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <button
                    className="p-2 text-sage-700"
                    onClick={() => setEdit(c)}
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    className="p-2 text-red-500"
                    onClick={() => setRemove(c)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
              <a
                href={`https://wa.me/${normalizePhone(c.whatsapp)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600"
              >
                <MessageCircle size={16} />
                {c.whatsapp}
              </a>
              <p className="mt-3 flex min-h-10 gap-2 text-xs leading-5 text-slate-500">
                <MapPin className="shrink-0" size={16} />
                {c.address || "Alamat belum diisi"}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-sage-100 pt-4 text-center">
                <div>
                  <b className="block text-lg">
                    {c.customer_measurements?.length ?? 0}
                  </b>
                  <span className="text-[10px] text-slate-400">
                    Data ukuran
                  </span>
                </div>
                <div>
                  <b className="block text-lg text-sage-700">
                    {c.active_stamps}
                  </b>
                  <span className="text-[10px] text-slate-400">Stempel</span>
                </div>
                <div>
                  <b className="block text-lg text-amber-600">
                    {c.available_rewards}
                  </b>
                  <span className="text-[10px] text-slate-400">Reward</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {edit && (
        <CustomerModal
          customer={edit}
          onClose={() => setEdit(null)}
          onSaved={async () => {
            setEdit(null);
            await reload();
          }}
        />
      )}
      <ConfirmModal
        open={!!remove}
        title="Hapus pelanggan?"
        description={`Data ${remove?.name ?? ""} dan seluruh ukuran tersimpan akan dihapus. Pelanggan dengan riwayat pesanan tidak dapat dihapus.`}
        danger
        confirmLabel="Hapus"
        onClose={() => setRemove(null)}
        onConfirm={() => void del()}
      />
    </>
  );
}
function CustomerModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.whatsapp);
  const [address, setAddress] = useState(customer.address ?? "");
  const [measurements, setMeasurements] = useState(
    customer.customer_measurements ?? [],
  );
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (name.length < 2 || phone.length < 8) {
      toast.error("Nama dan WhatsApp wajib diisi.");
      return;
    }
    setBusy(true);
    const payload = { name, whatsapp: phone, address: address || null };
    let id = customer.id;
    const result = id
      ? await supabase.from("customers").update(payload).eq("id", id)
      : await supabase.from("customers").insert(payload).select("id").single();
    if (!id && result.data) id = result.data.id;
    let e = result.error;
    if (!e) {
      for (const m of measurements) {
        const p = {
          customer_id: id,
          label: m.label,
          measurements: m.measurements,
          notes: m.notes,
        };
        const r = m.id
          ? await supabase
              .from("customer_measurements")
              .update(p)
              .eq("id", m.id)
          : await supabase.from("customer_measurements").insert(p);
        if (r.error) e = r.error;
      }
    }
    setBusy(false);
    if (e) toast.error(e.message);
    else {
      toast.success("Pelanggan disimpan");
      onSaved();
    }
  };
  const addMeasurement = () =>
    setMeasurements([
      ...measurements,
      {
        id: "",
        label: "Ukuran utama",
        measurements: {
          dada: "",
          pinggang: "",
          pinggul: "",
          panjang_baju: "",
          bahu: "",
          lengan: "",
        },
        notes: null,
      },
    ]);
  const removeMeasurement = async (i: number) => {
    const m = measurements[i];
    if (m.id)
      await supabase.from("customer_measurements").delete().eq("id", m.id);
    setMeasurements(measurements.filter((_, x) => x !== i));
  };
  return (
    <Modal
      open
      title={customer.id ? "Edit pelanggan" : "Tambah pelanggan"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <label>
          <span className="mb-2 block text-xs font-bold">Nama</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          <span className="mb-2 block text-xs font-bold">WhatsApp</span>
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label>
          <span className="mb-2 block text-xs font-bold">Alamat</span>
          <textarea
            className="input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <b className="flex items-center gap-2 text-sm">
              <Ruler size={17} /> Data ukuran
            </b>
            <button
              onClick={addMeasurement}
              className="text-xs font-bold text-sage-700"
            >
              <Plus size={15} className="inline" /> Tambah
            </button>
          </div>
          {measurements.map((m, i) => (
            <div key={m.id || i} className="mb-3 rounded-2xl bg-sage-50 p-3">
              <div className="flex gap-2">
                <input
                  className="input text-sm font-bold"
                  value={m.label}
                  onChange={(e) =>
                    setMeasurements(
                      measurements.map((x, n) =>
                        n === i ? { ...x, label: e.target.value } : x,
                      ),
                    )
                  }
                />
                <button
                  onClick={() => void removeMeasurement(i)}
                  className="text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {Object.entries(m.measurements).map(([key, value]) => (
                  <label key={key}>
                    <span className="mb-1 block truncate text-[10px] capitalize text-slate-500">
                      {key.replace("_", " ")}
                    </span>
                    <input
                      className="input px-2 py-2 text-xs"
                      value={value}
                      onChange={(e) =>
                        setMeasurements(
                          measurements.map((x, n) =>
                            n === i
                              ? {
                                  ...x,
                                  measurements: {
                                    ...x.measurements,
                                    [key]: e.target.value,
                                  },
                                }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          className="btn-primary w-full"
          disabled={busy}
          onClick={() => void save()}
        >
          {busy ? "Menyimpan..." : "Simpan pelanggan"}
        </button>
      </div>
    </Modal>
  );
}

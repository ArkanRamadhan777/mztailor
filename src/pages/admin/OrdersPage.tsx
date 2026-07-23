import {
  CalendarClock,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "../../components/admin/PageHeader";
import { WhatsAppIcon } from "../../components/WhatsAppIcon";
import {
  ConfirmModal,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
} from "../../components/ui";
import { useSupabaseList } from "../../hooks/useSupabaseList";
import { supabase } from "../../lib/supabase";
import { dateID, normalizePhone, rupiah } from "../../lib/utils";
import {
  statusLabels,
  type Order,
  type OrderItem,
  type OrderStatus,
  type Customer,
} from "../../types";

const statusColors: Record<OrderStatus, string> = {
  received: "bg-blue-50 text-blue-700",
  confirmed: "bg-indigo-50 text-indigo-700",
  in_progress: "bg-amber-50 text-amber-700",
  finishing: "bg-orange-50 text-orange-700",
  ready: "bg-purple-50 text-purple-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};
export function OrdersPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useSupabaseList<Order>(
    "orders",
    "*,customers(name,whatsapp,address),order_items(*)",
  );
  const customers = useSupabaseList<Customer>("customers", "*");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [pending, setPending] = useState<{
    order: Order;
    status: OrderStatus;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const filtered = useMemo(
    () =>
      data.filter(
        (o) =>
          (status === "all" || o.status === status) &&
          `${o.order_number} ${o.customers?.name ?? ""} ${o.customers?.whatsapp ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [data, query, status],
  );
  const updateStatus = async () => {
    if (!pending) return;
    setSaving(true);
    const { error: e } = await supabase
      .from("orders")
      .update({ status: pending.status })
      .eq("id", pending.order.id);
    setSaving(false);
    if (e) {
      toast.error(e.message);
      return;
    }
    toast.success("Status pesanan diperbarui");
    setPending(null);
    await reload();
  };
  const whatsapp = async (order: Order, customStatus?: OrderStatus) => {
    const s = customStatus ?? order.status;
    const msg = `Halo ${order.customers?.name}, update pesanan ${order.order_number}: *${statusLabels[s]}*.${s === "ready" ? " Pesanan sudah dapat diambil." : ""} Terima kasih — MZ TAILOR`;
    await supabase.from("whatsapp_message_logs").insert({
      order_id: order.id,
      phone: order.customers?.whatsapp,
      message: msg,
      status: s,
    });
    window.open(
      `https://wa.me/${normalizePhone(order.customers?.whatsapp ?? "")}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  return (
    <>
      <PageHeader
        title="Pesanan"
        description="Kelola item, harga, estimasi, dan progres pesanan."
        action={
          <button className="btn-primary" onClick={() => navigate("/mz-admin/pesanan/tambah")}>
            <Plus size={18} /> Tambah pesanan
          </button>
        }
      />
      <div className="admin-filter card mb-5 bg-white p-3">
        <div className="admin-filter-search">
          <Search
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            className="input h-12 pl-4 pr-11"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nomor, nama, atau WhatsApp..."
          />
        </div>
        <select
          className="admin-filter-status input h-12"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Semua status</option>
          {Object.entries(statusLabels).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Pesanan tidak ditemukan"
          description="Coba ubah kata kunci atau filter status."
        />
      ) : (
        <div className="grid gap-4">
          {filtered.map((o) => (
            <article key={o.id} className="card p-5">
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sage-50 font-bold text-sage-700">
                    {o.order_items?.reduce((n, i) => n + i.quantity, 0) ?? 0}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <b>{o.order_number}</b>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusColors[o.status]}`}
                      >
                        {statusLabels[o.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold">
                      {o.customers?.name} · {o.customers?.whatsapp}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Masuk {dateID(o.created_at)} · Estimasi{" "}
                      {dateID(o.estimated_completion)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="mr-2 text-left xl:text-right">
                    <span className="block text-xs text-slate-400">Total</span>
                    <b>{rupiah(o.total_price)}</b>
                  </div>
                  <select
                    aria-label="Ubah status"
                    className="input w-auto min-w-48 py-2 text-xs"
                    value={o.status}
                    onChange={(e) =>
                      setPending({
                        order: o,
                        status: e.target.value as OrderStatus,
                      })
                    }
                  >
                    {Object.entries(statusLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <button
                    title="Lihat detail pesanan"
                    className="inline-flex items-center gap-2 rounded-xl border border-sage-100 px-3 py-2.5 text-xs font-bold text-sage-700 hover:bg-sage-50"
                    onClick={() => navigate(`/mz-admin/pesanan/${o.id}`)}
                  >
                    <Pencil size={16} /> Lihat detail
                  </button>
                  <button
                    title="Kirim WhatsApp"
                    className="rounded-xl bg-emerald-500 p-2.5 text-white hover:bg-emerald-600"
                    onClick={() => void whatsapp(o)}
                  >
                    <WhatsAppIcon size={18} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <ConfirmModal
        open={!!pending}
        title="Ubah status pesanan?"
        description={
          pending
            ? `${pending.order.order_number} akan diubah menjadi “${statusLabels[pending.status]}”. Riwayat perubahan akan disimpan dan pesan WhatsApp siap dikirim manual.`
            : ""
        }
        confirmLabel={saving ? "Menyimpan..." : "Ubah status"}
        onClose={() => setPending(null)}
        onConfirm={() => void updateStatus()}
      />
      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onSaved={async () => {
            setSelected(null);
            await reload();
          }}
          onWhatsapp={whatsapp}
        />
      )}
      {createOpen && (
        <AddOrderModal
          customers={customers.data}
          onClose={() => setCreateOpen(false)}
          onSaved={async () => {
            setCreateOpen(false);
            await reload();
          }}
        />
      )}
    </>
  );
}
function OrderModal({
  order,
  onClose,
  onSaved,
  onWhatsapp,
}: {
  order: Order;
  onClose: () => void;
  onSaved: () => void;
  onWhatsapp: (o: Order) => Promise<void>;
}) {
  const [price, setPrice] = useState(String(order.total_price));
  const [date, setDate] = useState(
    order.estimated_completion?.slice(0, 10) ?? "",
  );
  const [notes, setNotes] = useState(order.notes ?? "");
  const [items, setItems] = useState<OrderItem[]>(order.order_items ?? []);
  const [busy, setBusy] = useState(false);
  const add = () =>
    setItems([
      ...items,
      { clothing_type: "", model: "", quantity: 1, unit_price: 0 },
    ]);
  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("orders")
      .update({
        total_price: Number(price) || 0,
        estimated_completion: date || null,
        notes,
      })
      .eq("id", order.id);
    if (!error) {
      for (const item of items) {
        if (item.id)
          await supabase
            .from("order_items")
            .update({
              clothing_type: item.clothing_type,
              model: item.model,
              quantity: item.quantity,
              unit_price: item.unit_price,
            })
            .eq("id", item.id);
        else
          await supabase
            .from("order_items")
            .insert({ ...item, order_id: order.id });
      }
    }
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Pesanan disimpan");
      onSaved();
    }
  };
  const remove = async (i: number) => {
    const item = items[i];
    if (item.id) {
      const { error } = await supabase
        .from("order_items")
        .delete()
        .eq("id", item.id);
      if (error) {
        toast.error(error.message);
        return;
      }
    }
    setItems(items.filter((_, x) => x !== i));
  };
  const openReference = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("order-references")
      .createSignedUrl(path, 60);
    if (error) toast.error(error.message);
    else window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };
  return (
    <Modal open title={`Detail ${order.order_number}`} onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-2xl bg-sage-50 p-4 text-sm">
          <b>{order.customers?.name}</b>
          <p className="mt-1 text-slate-500">{order.customers?.whatsapp}</p>
          <p className="mt-2 text-xs text-slate-500">
            {order.customers?.address}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-2 block text-xs font-bold">Total harga</span>
            <input
              type="number"
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <label>
            <span className="mb-2 block text-xs font-bold">
              Estimasi selesai
            </span>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <b className="text-sm">Item pesanan</b>
            <button
              className="flex items-center gap-1 text-xs font-bold text-sage-700"
              onClick={add}
            >
              <Plus size={15} /> Tambah
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div
                key={item.id ?? i}
                className="rounded-2xl border border-sage-100 p-3"
              >
                <div className="mb-2 flex justify-between">
                  <span className="text-xs font-bold">Item {i + 1}</span>
                  <button
                    onClick={() => void remove(i)}
                    className="text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="input text-sm"
                    placeholder="Jenis pakaian"
                    value={item.clothing_type}
                    onChange={(e) =>
                      setItems(
                        items.map((x, n) =>
                          n === i ? { ...x, clothing_type: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <input
                    className="input text-sm"
                    placeholder="Model"
                    value={item.model}
                    onChange={(e) =>
                      setItems(
                        items.map((x, n) =>
                          n === i ? { ...x, model: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <input
                    type="number"
                    min="1"
                    className="input text-sm"
                    placeholder="Jumlah"
                    value={item.quantity}
                    onChange={(e) =>
                      setItems(
                        items.map((x, n) =>
                          n === i
                            ? { ...x, quantity: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                  />
                  <input
                    type="number"
                    className="input text-sm"
                    placeholder="Harga satuan"
                    value={item.unit_price}
                    onChange={(e) =>
                      setItems(
                        items.map((x, n) =>
                          n === i
                            ? { ...x, unit_price: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                  />
                </div>
                {item.reference_path && (
                  <button
                    type="button"
                    onClick={() => void openReference(item.reference_path!)}
                    className="mt-2 flex items-center gap-1 text-xs font-bold text-sage-700 hover:underline"
                  >
                    <ExternalLink size={13} /> Buka foto referensi
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <label>
          <span className="mb-2 block text-xs font-bold">Catatan</span>
          <textarea
            className="input min-h-20"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="btn-secondary flex-1"
            onClick={() => void onWhatsapp(order)}
          >
            <WhatsAppIcon size={17} /> WhatsApp
          </button>
          <button
            className="btn-primary flex-1"
            disabled={busy}
            onClick={() => void save()}
          >
            <CalendarClock size={17} />
            {busy ? "Menyimpan..." : "Simpan perubahan"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AddOrderModal({
  customers,
  onClose,
  onSaved,
}: {
  customers: Customer[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [address, setAddress] = useState("");
  const [items, setItems] = useState<OrderItem[]>([
    { clothing_type: "", model: "", quantity: 1, unit_price: 0 },
  ]);
  const [total, setTotal] = useState("0");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<OrderStatus>("received");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const pickCustomer = (id: string) => {
    setCustomerId(id);
    const customer = customers.find((item) => item.id === id);
    if (customer) {
      setName(customer.name);
      setWhatsappNumber(customer.whatsapp);
      setAddress(customer.address ?? "");
    }
  };
  const addItem = () =>
    setItems([
      ...items,
      { clothing_type: "", model: "", quantity: 1, unit_price: 0 },
    ]);
  const updateItem = (index: number, patch: Partial<OrderItem>) =>
    setItems(
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  const save = async () => {
    if (
      name.trim().length < 2 ||
      whatsappNumber.trim().length < 8 ||
      items.some((item) => !item.clothing_type || !item.model)
    ) {
      toast.error("Lengkapi pelanggan dan semua item pesanan.");
      return;
    }
    setBusy(true);
    const result = await supabase.rpc("create_public_order", {
      p_name: name,
      p_whatsapp: whatsappNumber,
      p_address: address,
      p_measurements: {},
      p_notes: notes || null,
      p_items: items.map(({ clothing_type, model, quantity }) => ({
        clothing_type,
        model,
        quantity,
      })),
    });
    if (result.error) {
      toast.error(result.error.message);
      setBusy(false);
      return;
    }
    const orderNumber = String(result.data);
    const order = await supabase
      .from("orders")
      .select("id")
      .eq("order_number", orderNumber)
      .single();
    if (order.error || !order.data) {
      toast.error("Pesanan dibuat tetapi detailnya gagal diperbarui.");
      setBusy(false);
      return;
    }
    await supabase
      .from("orders")
      .update({
        total_price: Number(total) || 0,
        estimated_completion: date || null,
        status,
        notes: notes || null,
      })
      .eq("id", order.data.id);
    const createdItems = await supabase
      .from("order_items")
      .select("id")
      .eq("order_id", order.data.id)
      .order("created_at", { ascending: true });
    if (!createdItems.error)
      for (const [index, created] of (createdItems.data ?? []).entries())
        await supabase
          .from("order_items")
          .update({ unit_price: items[index]?.unit_price ?? 0 })
          .eq("id", created.id);
    setBusy(false);
    toast.success(`Pesanan ${orderNumber} berhasil dibuat`);
    onSaved();
  };
  return (
    <Modal open title="Tambah pesanan" onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-2xl bg-sage-50 p-4">
          <label>
            <span className="mb-2 block text-xs font-bold">
              Pilih pelanggan tersimpan
            </span>
            <select
              className="input bg-white"
              value={customerId}
              onChange={(event) => pickCustomer(event.target.value)}
            >
              <option value="">Pelanggan baru</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} · {customer.whatsapp}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-2 block text-xs font-bold">Nama pelanggan</span>
            <input
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama lengkap"
            />
          </label>
          <label>
            <span className="mb-2 block text-xs font-bold">WhatsApp</span>
            <input
              className="input"
              value={whatsappNumber}
              onChange={(event) => setWhatsappNumber(event.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-2 block text-xs font-bold">Alamat</span>
            <textarea
              className="input min-h-20"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Alamat pelanggan"
            />
          </label>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <b className="text-sm">Item pesanan</b>
            <button
              type="button"
              className="text-xs font-bold text-sage-700"
              onClick={addItem}
            >
              <Plus size={15} className="inline" /> Tambah item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-sage-100 bg-sage-50/40 p-4"
              >
                <div className="mb-3 flex items-center justify-between"><b className="text-xs font-bold text-sage-800">Item {index + 1}</b>{items.length > 1 && <button type="button" className="text-xs font-bold text-red-500" onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}>Hapus item</button>}</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label><span className="mb-1.5 block text-[11px] font-bold text-slate-600">Jenis pakaian</span><input className="input text-sm" placeholder="Contoh: Kemeja" value={item.clothing_type} onChange={(event) => updateItem(index, { clothing_type: event.target.value })} /></label>
                  <label><span className="mb-1.5 block text-[11px] font-bold text-slate-600">Model pakaian</span><input className="input text-sm" placeholder="Contoh: Slim fit" value={item.model} onChange={(event) => updateItem(index, { model: event.target.value })} /></label>
                  <label><span className="mb-1.5 block text-[11px] font-bold text-slate-600">Jumlah potong</span><input className="input text-sm" type="number" min="1" placeholder="1" value={item.quantity} onChange={(event) => updateItem(index, { quantity: Math.max(1, Number(event.target.value) || 1) })} /></label>
                  <label><span className="mb-1.5 block text-[11px] font-bold text-slate-600">Harga satuan (Rp)</span><input className="input text-sm" type="number" min="0" placeholder="Masukkan harga" value={item.unit_price || ''} onChange={(event) => updateItem(index, { unit_price: Math.max(0, Number(event.target.value) || 0) })} /></label>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label>
            <span className="mb-2 block text-xs font-bold">Total harga</span>
            <input
              className="input"
              type="number"
              min="0"
              value={total}
              onChange={(event) => setTotal(event.target.value)}
            />
          </label>
          <label>
            <span className="mb-2 block text-xs font-bold">
              Estimasi selesai
            </span>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label>
            <span className="mb-2 block text-xs font-bold">Status awal</span>
            <select
              className="input"
              value={status}
              onChange={(event) => setStatus(event.target.value as OrderStatus)}
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span className="mb-2 block text-xs font-bold">Catatan</span>
          <textarea
            className="input min-h-20"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Catatan pesanan"
          />
        </label>
        <button
          className="btn-primary w-full"
          disabled={busy}
          onClick={() => void save()}
        >
          {busy ? "Membuat pesanan..." : "Simpan pesanan"}
        </button>
      </div>
    </Modal>
  );
}

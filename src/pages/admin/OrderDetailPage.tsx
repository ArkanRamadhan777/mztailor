import { ArrowLeft, CalendarClock, CheckCircle2, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '../../components/admin/PageHeader'
import { LoadingState, ErrorState, Modal } from '../../components/ui'
import { WhatsAppIcon } from '../../components/WhatsAppIcon'
import { supabase } from '../../lib/supabase'
import { dateID, normalizePhone, rupiah } from '../../lib/utils'
import { statusLabels, type Order, type OrderItem, type OrderStatus } from '../../types'

export function OrderDetailPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<OrderStatus>('received')
  const [saving, setSaving] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editItems, setEditItems] = useState<OrderItem[]>([])
  const [editNotes, setEditNotes] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editBusy, setEditBusy] = useState(false)

  const load = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    const result = await supabase.from('orders').select('*,customers(name,whatsapp,address),order_items(*),rewards(name,description,reward_type,discount_value)').eq('id', orderId).single()
    if (result.error) setError(result.error.message)
    else { setOrder(result.data as Order); setStatus(result.data.status) }
    setLoading(false)
  }, [orderId])
  useEffect(() => { void load() }, [load])

  const saveStatus = async () => {
    if (!order) return
    setSaving(true)
    const result = await supabase.from('orders').update({ status }).eq('id', order.id)
    setSaving(false)
    if (result.error) toast.error(result.error.message)
    else { toast.success('Status diperbarui'); await load() }
  }

  const whatsapp = () => {
    if (!order) return
    const msg = `Halo ${order.customers?.name}, update pesanan ${order.order_number}: *${statusLabels[order.status]}*. Terima kasih — MZ TAILOR`
    void supabase.from('whatsapp_message_logs').insert({ order_id: order.id, phone: order.customers?.whatsapp, message: msg, status: order.status })
    window.open(`https://wa.me/${normalizePhone(order.customers?.whatsapp ?? '')}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
  }

  const openEdit = () => {
    setEditItems(order?.order_items ?? [])
    setEditNotes(order?.notes ?? '')
    setEditDate(order?.estimated_completion?.slice(0, 10) ?? '')
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!order) return
    setEditBusy(true)
    const { error: err } = await supabase.from('orders').update({ estimated_completion: editDate || null, notes: editNotes }).eq('id', order.id)
    if (err) { toast.error(err.message); setEditBusy(false); return }
    for (const item of editItems) {
      if (item.id) await supabase.from('order_items').update({ clothing_type: item.clothing_type, model: item.model, quantity: item.quantity, unit_price: item.unit_price }).eq('id', item.id)
      else await supabase.from('order_items').insert({ ...item, order_id: order.id })
    }
    setEditBusy(false)
    toast.success('Pesanan diperbarui')
    setEditOpen(false)
    await load()
  }

  if (loading) return <LoadingState />
  if (error || !order) return <ErrorState message={error || 'Pesanan tidak ditemukan'} retry={() => void load()} />

  const subtotal = order.subtotal ?? order.order_items?.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) ?? order.total_price
  const discount = order.discount_amount ?? 0

  return (
    <>
      <button className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-sage-700" onClick={() => navigate('/mz-admin/pesanan')}>
        <ArrowLeft size={16} /> Kembali ke pesanan
      </button>
      <PageHeader
        title={order.order_number}
        description={`Dibuat ${dateID(order.created_at)} · Estimasi selesai ${dateID(order.estimated_completion)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={whatsapp}><WhatsAppIcon size={17} /> WhatsApp</button>
            <button className="btn-secondary" onClick={openEdit}><Pencil size={17} /> Edit</button>
            <button className="btn-primary" onClick={() => navigate('/mz-admin/pesanan')}><CheckCircle2 size={17} /> Selesai</button>
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-sage-600">Pelanggan</p>
                <h2 className="mt-2 text-xl font-bold">{order.customers?.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{order.customers?.whatsapp}</p>
                <p className="mt-2 text-sm text-slate-500">{order.customers?.address || 'Alamat belum diisi'}</p>
              </div>
              <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-bold text-sage-700">{statusLabels[order.status]}</span>
            </div>
          </section>
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold">Rincian item</h2>
                <p className="mt-1 text-xs text-slate-500">Ukuran disimpan berbeda untuk setiap item.</p>
              </div>
              <span className="text-xs font-bold text-slate-500">{order.order_items?.length ?? 0} jenis item</span>
            </div>
            <div className="space-y-4">
              {order.order_items?.map((item, index) => (
                <article key={item.id ?? index} className="rounded-2xl border border-sage-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-sage-600">Item {index + 1}</p>
                      <h3 className="mt-1 font-bold">{item.clothing_type} · {item.model}</h3>
                    </div>
                    <b className="text-sage-700">{rupiah(item.quantity * item.unit_price)}</b>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                    {Object.entries(item.measurements ?? {}).filter(([, value]) => value).map(([key, value]) => (
                      <span key={key} className="rounded-lg bg-sage-50 px-2 py-2 text-slate-600">
                        <b className="capitalize">{key}</b><br />{value} cm
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{item.quantity} potong · {rupiah(item.unit_price)}</p>
                </article>
              ))}
            </div>
          </section>
          {order.notes && (
            <section className="card p-5">
              <h2 className="font-bold">Catatan</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{order.notes}</p>
            </section>
          )}
        </div>
        <aside className="h-fit space-y-4 xl:sticky xl:top-24">
          <section className="card p-5">
            <h2 className="font-bold">Status pesanan</h2>
            <select className="input mt-4" value={status} onChange={e => setStatus(e.target.value as OrderStatus)}>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button className="btn-primary mt-3 w-full" disabled={saving || status === order.status} onClick={() => void saveStatus()}>
              <CheckCircle2 size={16} />{saving ? 'Menyimpan...' : 'Simpan status'}
            </button>
          </section>
          <section className="card p-5">
            <h2 className="font-bold">Ringkasan pembayaran</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal item</span>
                <b>{rupiah(subtotal)}</b>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>{order.rewards?.name ? `Reward: ${order.rewards.name}` : 'Diskon reward'}</span>
                <b>- {rupiah(discount)}</b>
              </div>
              <div className="flex justify-between border-t border-sage-100 pt-3 text-base">
                <b>Total akhir</b>
                <b className="text-sage-700">{rupiah(order.total_price)}</b>
              </div>
            </div>
            {order.applied_reward_id && (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Reward sudah digunakan pada pesanan ini. Stempel pelanggan telah direset.</p>
            )}
          </section>
        </aside>
      </div>

      {editOpen && (
        <Modal open onClose={() => setEditOpen(false)} title={'Edit ' + order.order_number}>
          <div className="space-y-5">
            <label>
              <span className="mb-2 block text-xs font-bold">Estimasi selesai</span>
              <input type="date" className="input" value={editDate} onChange={e => setEditDate(e.target.value)} />
            </label>
            <div>
              <div className="mb-3 flex items-center justify-between">
                <b className="text-sm">Item pesanan</b>
                <button className="flex items-center gap-1 text-xs font-bold text-sage-700" onClick={() => setEditItems([...editItems, { clothing_type: '', model: '', quantity: 1, unit_price: 0 }])}>
                  <Plus size={15} /> Tambah
                </button>
              </div>
              <div className="space-y-3">
                {editItems.map((item, i) => (
                  <div key={item.id ?? i} className="rounded-2xl border border-sage-100 p-3">
                    <div className="mb-2 flex justify-between">
                      <span className="text-xs font-bold">Item {i + 1}</span>
                      <button onClick={() => setEditItems(editItems.filter((_, x) => x !== i))}>
                        <Trash2 size={15} className="text-red-500" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input text-sm" placeholder="Jenis pakaian" value={item.clothing_type} onChange={e => setEditItems(editItems.map((x, n) => n === i ? { ...x, clothing_type: e.target.value } : x))} />
                      <input className="input text-sm" placeholder="Model" value={item.model} onChange={e => setEditItems(editItems.map((x, n) => n === i ? { ...x, model: e.target.value } : x))} />
                      <input type="number" min="1" className="input text-sm" placeholder="Jumlah" value={item.quantity} onChange={e => setEditItems(editItems.map((x, n) => n === i ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) } : x))} />
                      <input type="number" className="input text-sm" placeholder="Harga satuan" value={item.unit_price} onChange={e => setEditItems(editItems.map((x, n) => n === i ? { ...x, unit_price: Math.max(0, Number(e.target.value) || 0) } : x))} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <label>
              <span className="mb-2 block text-xs font-bold">Catatan</span>
              <textarea className="input min-h-20" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
            </label>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setEditOpen(false)}>Batal</button>
              <button className="btn-primary flex-1" disabled={editBusy} onClick={() => void saveEdit()}>
                {editBusy ? 'Menyimpan...' : 'Simpan perubahan'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

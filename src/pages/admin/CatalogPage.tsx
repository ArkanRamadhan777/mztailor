import { Eye, EyeOff, ImagePlus, Info, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '../../components/admin/PageHeader'
import { ConfirmModal, EmptyState, ErrorState, LoadingState, Modal } from '../../components/ui'
import { useSupabaseList } from '../../hooks/useSupabaseList'
import { supabase } from '../../lib/supabase'
import type { Portfolio } from '../../types'

export function CatalogPage() {
  const { data, loading, error, reload } = useSupabaseList<Portfolio>('portfolios', '*', 'sort_order')
  const [edit, setEdit] = useState<Partial<Portfolio> | null>(null)
  const [detail, setDetail] = useState<Portfolio | null>(null)
  const [remove, setRemove] = useState<Portfolio | null>(null)
  const toggle = async (item: Portfolio) => { await supabase.from('portfolios').update({ is_active: !item.is_active }).eq('id', item.id); await reload() }
  const del = async () => { if (!remove) return; const { error: e } = await supabase.from('portfolios').delete().eq('id', remove.id); if (e) toast.error(e.message); else toast.success('Katalog dihapus'); setRemove(null); await reload() }

  return <>
    <PageHeader title="Katalog" description="Kelola hasil jahitan yang tampil di landing page." action={<button className="btn-primary" onClick={() => setEdit({ title: '', description: '', category: '', image_url: '', is_active: true, sort_order: data.length + 1 })}><Plus size={18} /> Tambah karya</button>} />
    {loading ? <LoadingState /> : error ? <ErrorState message={error} retry={reload} /> : data.length === 0 ? <EmptyState title="Katalog masih kosong" /> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {data.map(item => <article key={item.id} className="card overflow-hidden">
        <button className="group relative block aspect-square w-full bg-sage-50" onClick={() => setDetail(item)} aria-label={`Lihat detail ${item.title}`}>
          <img src={item.image_url} alt={item.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
          <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold ${item.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white'}`}>{item.is_active ? 'Tampil' : 'Disembunyikan'}</span>
          <span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-white/90 text-sage-700 opacity-0 shadow-sm transition group-hover:opacity-100"><Info size={16} /></span>
        </button>
        <div className="p-4 sm:p-5"><p className="text-xs font-bold uppercase tracking-widest text-sage-600">{item.category || 'Umum'}</p><h2 className="mt-2 truncate text-lg font-bold text-ink">{item.title}</h2><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-6 text-slate-500">{item.description || 'Belum ada deskripsi karya.'}</p><div className="mt-4 flex justify-end gap-1 border-t border-sage-100 pt-3"><button title="Tampilkan/sembunyikan" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-50" onClick={() => void toggle(item)}>{item.is_active ? <EyeOff size={18} /> : <Eye size={18} />}</button><button title="Edit karya" className="rounded-lg p-2 text-sage-700 transition hover:bg-sage-50" onClick={() => setEdit(item)}><Pencil size={18} /></button><button title="Hapus karya" className="rounded-lg p-2 text-red-500 transition hover:bg-red-50" onClick={() => setRemove(item)}><Trash2 size={18} /></button></div></div>
      </article>)}
    </div>}
    {edit && <CatalogModal value={edit} onClose={() => setEdit(null)} onSaved={async () => { setEdit(null); await reload() }} />}
    {detail && <Modal open title={detail.title} onClose={() => setDetail(null)}><img src={detail.image_url} alt={detail.title} className="aspect-square w-full rounded-2xl object-cover" /><p className="mt-4 text-xs font-bold uppercase tracking-widest text-sage-600">{detail.category || 'Umum'}</p><p className="mt-2 text-sm leading-6 text-slate-600">{detail.description || 'Belum ada deskripsi karya.'}</p></Modal>}
    <ConfirmModal open={!!remove} title="Hapus karya?" description="Karya akan dihapus permanen dari katalog." danger confirmLabel="Hapus" onClose={() => setRemove(null)} onConfirm={() => void del()} />
  </>
}

function CatalogModal({ value, onClose, onSaved }: { value: Partial<Portfolio>; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(value); const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState(''); const [cropX, setCropX] = useState(50); const [cropY, setCropY] = useState(50); const [cropChanged, setCropChanged] = useState(false); const [busy, setBusy] = useState(false)
  useEffect(() => { if (!file) return; const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url) }, [file])
  const cropUpload = async (path: string) => {
    const image = new Image(); let source = ''
    if (file) { source = URL.createObjectURL(file) } else if (form.image_url) { const response = await fetch(form.image_url); if (!response.ok) throw new Error('Foto lama tidak dapat dibaca'); source = URL.createObjectURL(await response.blob()) } else return ''
    image.crossOrigin = 'anonymous'; image.src = source
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Foto tidak dapat dibaca')) })
    const side = Math.min(image.naturalWidth, image.naturalHeight); const sx = (image.naturalWidth - side) * cropX / 100; const sy = (image.naturalHeight - side) * cropY / 100
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 1200; canvas.getContext('2d')?.drawImage(image, sx, sy, side, side, 0, 0, 1200, 1200); URL.revokeObjectURL(source)
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(x => x ? resolve(x) : reject(new Error('Crop foto gagal')), 'image/jpeg', .9)); const upload = await supabase.storage.from('portfolio').upload(path, blob, { contentType: 'image/jpeg', upsert: false }); if (upload.error) throw upload.error; return supabase.storage.from('portfolio').getPublicUrl(path).data.publicUrl
  }
  const save = async () => { if (!form.title) { toast.error('Judul wajib diisi'); return } setBusy(true); try { let image = form.image_url || ''; if (file || cropChanged) image = await cropUpload(`catalog/${crypto.randomUUID()}.jpg`); const payload = { title: form.title, description: form.description || null, category: form.category || null, image_url: image, is_active: form.is_active ?? true, sort_order: Number(form.sort_order) || 0 }; const result = form.id ? await supabase.from('portfolios').update(payload).eq('id', form.id) : await supabase.from('portfolios').insert(payload); if (result.error) throw result.error; toast.success('Katalog disimpan'); onSaved() } catch (e) { toast.error(e instanceof Error ? e.message : 'Katalog gagal disimpan') } finally { setBusy(false) } }
  const source = preview || form.image_url || ''
  return <Modal open title={form.id ? 'Edit karya' : 'Tambah karya'} onClose={onClose}><div className="space-y-4"><label><span className="mb-2 block text-xs font-bold">Judul</span><input className="input" value={form.title ?? ''} onChange={e => setForm({ ...form, title: e.target.value })} /></label><div className="grid grid-cols-2 gap-3"><label><span className="mb-2 block text-xs font-bold">Kategori</span><input className="input" value={form.category ?? ''} onChange={e => setForm({ ...form, category: e.target.value })} /></label><label><span className="mb-2 block text-xs font-bold">Urutan</span><input type="number" className="input" value={form.sort_order ?? 0} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} /></label></div><label><span className="mb-2 block text-xs font-bold">Deskripsi detail</span><textarea className="input min-h-24" placeholder="Bahan, potongan, detail jahitan..." value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} /></label><label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-sage-300 p-4 text-sm text-sage-700"><ImagePlus /> {file?.name || 'Ganti foto (opsional)'}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>{source && <div className="space-y-3"><div className="aspect-square overflow-hidden rounded-2xl bg-sage-50"><img src={source} className="h-full w-full object-cover" style={{ objectPosition: `${cropX}% ${cropY}%` }} /></div><div className="grid gap-2 rounded-2xl bg-sage-50 p-3 text-xs"><b className="text-sage-800">Atur potongan gambar 1:1</b><label className="flex items-center gap-3">Geser horizontal <input type="range" min="0" max="100" value={cropX} onChange={e => { setCropX(Number(e.target.value)); setCropChanged(true) }} className="w-full accent-emerald-600" /></label><label className="flex items-center gap-3">Geser vertikal <input type="range" min="0" max="100" value={cropY} onChange={e => { setCropY(Number(e.target.value)); setCropChanged(true) }} className="w-full accent-emerald-600" /></label><p className="text-slate-500">Foto lama juga bisa dipotong ulang tanpa upload ulang.</p></div></div>}<label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.is_active ?? true} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Tampilkan di landing page</label><button className="btn-primary w-full" onClick={() => void save()} disabled={busy}>{busy ? 'Memotong & menyimpan...' : 'Simpan karya'}</button></div></Modal>
}

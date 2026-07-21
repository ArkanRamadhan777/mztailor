import type { BusinessSettings, Portfolio, Service } from '../types'

export const fallbackSettings: BusinessSettings = {
  business_name: 'MZ TAILOR', tagline: 'Jahitan rapi, pas di hati.',
  description: 'Melayani jahit pakaian wanita dan pria, permak, serta seragam dengan pengerjaan teliti dan ukuran yang nyaman.',
  whatsapp: '6281234567890', address: 'Jl. Melati No. 12, Indonesia', instagram: '@mztailor', hours: 'Senin–Sabtu, 08.00–17.00',
}
export const fallbackServices: Service[] = [
  { id:'1', name:'Jahit Custom', description:'Pakaian dibuat khusus sesuai ukuran dan model pilihanmu.', starting_price:150000, icon:'scissors', is_active:true, sort_order:1 },
  { id:'2', name:'Permak Pakaian', description:'Perbaikan ukuran, resleting, panjang, dan detail lainnya.', starting_price:30000, icon:'ruler', is_active:true, sort_order:2 },
  { id:'3', name:'Seragam', description:'Pengerjaan seragam keluarga, sekolah, dan komunitas.', starting_price:120000, icon:'shirt', is_active:true, sort_order:3 },
]
export const fallbackPortfolios: Portfolio[] = [
  { id:'1', title:'Kemeja Hijau Modern', description:'Potongan bersih dengan ukuran yang presisi.', image_url:'/images/menswear-hero.png', category:'Kemeja Pria', is_active:true, sort_order:1 },
  { id:'2', title:'Setelan Linen Pria', description:'Ringan, rapi, dan nyaman untuk acara istimewa.', image_url:'/images/menswear-suit.png', category:'Setelan Pria', is_active:true, sort_order:2 },
  { id:'3', title:'Baju Koko Modern', description:'Detail bordir lembut dengan siluet kontemporer.', image_url:'/images/menswear-koko.png', category:'Busana Pria', is_active:true, sort_order:3 },
]

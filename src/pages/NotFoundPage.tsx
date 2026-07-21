import { Link } from 'react-router-dom'
import { Scissors } from 'lucide-react'
export function NotFoundPage(){return <main className="grid min-h-screen place-items-center bg-sage-50 p-5 text-center"><div><Scissors className="mx-auto text-sage-500" size={48}/><p className="mt-5 text-7xl font-extrabold text-sage-200">404</p><h1 className="mt-2 text-2xl font-bold">Halaman tidak ditemukan</h1><p className="mt-3 text-slate-500">Alamat yang kamu tuju tidak tersedia.</p><Link to="/" className="btn-primary mt-7">Kembali ke beranda</Link></div></main>}

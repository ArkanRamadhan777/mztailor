import { Link } from 'react-router-dom'

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="MZ TAILOR beranda"
      className={`group inline-flex items-baseline font-black tracking-[0.12em] ${light ? 'text-white' : 'text-ink'}`}
    >
      <span className="text-[1.08rem] leading-none">MZ</span>
      <span className={`ml-1.5 text-[1.08rem] leading-none transition-colors ${light ? 'text-white/65 group-hover:text-white' : 'text-sage-700 group-hover:text-sage-600'}`}>
        TAILOR
      </span>
    </Link>
  )
}

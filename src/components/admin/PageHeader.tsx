import type { ReactNode } from 'react'
export function PageHeader({title,description,action}:{title:string;description:string;action?:ReactNode}){return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1><p className="mt-1 text-sm text-slate-500">{description}</p></div>{action}</div>}

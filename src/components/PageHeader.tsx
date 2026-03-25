export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-5 pt-7 pb-4">
      <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 leading-tight">{title}</h1>
      {subtitle && <p className="text-sm text-slate-400 mt-1 font-medium">{subtitle}</p>}
    </div>
  )
}

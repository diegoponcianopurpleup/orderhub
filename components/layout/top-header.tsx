type HeaderProps = {
  name: string
  logoUrl?: string | null
  slogan?: string | null
}

export function TopHeader({ name, slogan }: HeaderProps) {
  return (
    <header className="panel mb-4 flex flex-wrap items-center justify-between gap-4">
      
      <div className="flex items-center gap-3">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-bold">
          {name.slice(0,2).toUpperCase()}
        </div>

        <div>
          <h1 className="text-lg font-bold">{name}</h1>
          <p className="text-xs text-slate-500">
            {slogan || "Sistema comercial white-label"}
          </p>
        </div>

      </div>

    </header>
  )
}
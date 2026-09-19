export function MateMasieSignature() {
  return <div className="relative mt-16 min-h-[260px] overflow-hidden" aria-label="Sabedoria e prudência">
    <div className="pointer-events-none absolute -bottom-28 -right-24 hidden h-72 w-72 opacity-[0.06] md:block" aria-hidden="true">
      <div className="mate-masie-watermark" />
    </div>
    <div className="absolute bottom-4 right-4 flex max-w-[440px] items-center gap-5 sm:right-8">
      <div className="mate-masie-symbol h-14 w-14 shrink-0" aria-hidden="true" />
      <div className="h-16 w-px bg-brand-900/30" aria-hidden="true" />
      <div>
        <p className="font-serif text-xl italic leading-relaxed text-brand-900/80">“Ninguém testa a profundidade de um rio com os dois pés.”</p>
        <p className="mt-2 text-sm italic text-brand-900/55">Ditado Ashanti</p>
      </div>
    </div>
  </div>
}

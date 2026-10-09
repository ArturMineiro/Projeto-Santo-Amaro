import type { ReactNode } from "react";

/** Moldura das telas de entrada: marca no topo, conteúdo numa coluna estreita. */
export default function AuthShell({ children, title, intro }: { children: ReactNode; title: string; intro?: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <div className="bg-leaf text-white">
        <div className="mx-auto max-w-md px-5 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="" width={44} height={44} className="rounded-[12px] ring-2 ring-white/30" />
            <span className="font-display text-[1.5rem] font-extrabold">RecebeAqui</span>
          </div>
          <h1 className="mt-8 text-[2.125rem] font-extrabold leading-[1.1] text-white">{title}</h1>
          {intro && <div className="mt-3 text-[1.125rem] text-white/85">{intro}</div>}
        </div>
      </div>
      <main className="mx-auto -mt-10 max-w-md px-4 pb-10">
        <div className="card p-5 shadow-[0_2px_0_#D5DFD7]">{children}</div>
      </main>
    </div>
  );
}

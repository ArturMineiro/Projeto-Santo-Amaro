import type { ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import type { PageMeta } from "../../lib/systemTypes";
import { IconSearch } from "../Icons";

const nav = [
  { to: "/sistema", label: "Visão geral", end: true },
  { to: "/sistema/associacoes", label: "Associações" },
  { to: "/sistema/vinculos", label: "Vínculos" },
  { to: "/sistema/logs", label: "Logs" },
];

/** Moldura do painel do sistema: faixa escura no topo para não confundir com o painel da associação. */
export function SystemLayout() {
  const { membership, logout, session } = useAuth();
  const hasAssociationPanel = membership?.status === "approved" && membership.role === "admin";

  return (
    <div className="min-h-dvh">
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <img src="/favicon.svg" alt="" width={36} height={36} className="rounded-[10px]" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[1.25rem] font-extrabold leading-tight">Sistema</p>
            <p className="truncate text-[0.9375rem] text-white/70">{session?.user.name}</p>
          </div>
          {hasAssociationPanel && (
            <Link to="/painel" className="hidden min-h-[44px] items-center rounded-full px-3 font-bold text-sun hover:bg-white/10 sm:inline-flex">
              Painel da associação
            </Link>
          )}
          <button type="button" className="min-h-[44px] rounded-full px-3 font-bold text-white/85 hover:bg-white/10" onClick={() => void logout()}>
            Sair
          </button>
        </div>
        <nav aria-label="Seções do sistema" className="mx-auto max-w-5xl overflow-x-auto px-2">
          <ul className="flex min-w-max">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex min-h-[52px] items-center border-b-4 px-3 sm:px-4 font-bold ${isActive ? "border-sun text-white" : "border-transparent text-white/70 hover:text-white"}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-5">
        <Outlet />
        {hasAssociationPanel && (
          <Link to="/painel" className="btn-link mt-8 sm:hidden">
            Ir para o painel da associação
          </Link>
        )}
      </main>
    </div>
  );
}

export function SearchBox({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <IconSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
      <input id={id} type="search" className="input pl-12" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off" />
    </div>
  );
}

/** Filtro em forma de select nativo: melhor no celular que dropdown customizado. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <select className="input pr-8" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Pager({ meta, onPage }: { meta?: PageMeta; onPage: (page: number) => void }) {
  if (!meta || meta.last_page <= 1) return null;
  return (
    <nav aria-label="Páginas" className="mt-4 flex items-center justify-between gap-3">
      <button type="button" className="btn-secondary min-h-[48px]" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>
        Anterior
      </button>
      <span className="text-muted">
        Página {meta.current_page} de {meta.last_page}
      </span>
      <button
        type="button"
        className="btn-secondary min-h-[48px]"
        disabled={meta.current_page >= meta.last_page}
        onClick={() => onPage(meta.current_page + 1)}
      >
        Próxima
      </button>
    </nav>
  );
}

export type PillTone = "green" | "yellow" | "red" | "gray";

const pillTones: Record<PillTone, string> = {
  green: "bg-leaf-soft text-leaf-dark",
  yellow: "bg-sun-soft text-sun-dark",
  red: "bg-alert-soft text-alert",
  gray: "bg-paper text-muted border border-line",
};

export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.875rem] font-bold ${pillTones[tone]}`}>{children}</span>;
}

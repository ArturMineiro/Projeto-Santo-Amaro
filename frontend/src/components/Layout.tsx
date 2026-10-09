import { NavLink, Outlet, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../auth/authContext";
import { IconBack, IconBox, IconHome, IconPlus, IconSettings, IconUsers } from "./Icons";

/** Cabeçalho de página: título grande + voltar opcional + ação à direita. */
export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: string | boolean;
  action?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header className="flex items-start gap-2 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
      {back && (
        <button
          type="button"
          className="icon-btn -ml-3 mt-0.5"
          aria-label="Voltar"
          onClick={() => (typeof back === "string" ? navigate(back) : navigate(-1))}
        >
          <IconBack size={28} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-[1.875rem] font-extrabold leading-tight">{title}</h1>
        {subtitle && <div className="mt-1 text-muted">{subtitle}</div>}
      </div>
      {action}
    </header>
  );
}

/** Coluna central confortável para leitura em qualquer tela. */
export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <main className={`mx-auto w-full px-4 pb-10 ${wide ? "max-w-3xl" : "max-w-xl"}`}>{children}</main>;
}

const navItems = [
  { to: "/painel", label: "Início", icon: IconHome, end: true },
  { to: "/painel/encomendas", label: "Encomendas", icon: IconBox },
  { to: "/painel/nova", label: "Registrar", icon: IconPlus, primary: true },
  { to: "/painel/moradores", label: "Moradores", icon: IconUsers },
  { to: "/painel/associacao", label: "Ajustes", icon: IconSettings },
];

/** Layout da administração: barra inferior com o "Registrar" sempre à mão. */
export function AdminLayout() {
  const { membership } = useAuth();

  return (
    <div className="min-h-dvh pb-[calc(88px+env(safe-area-inset-bottom))]">
      <div className="border-b border-line bg-white/60">
        <p className="mx-auto max-w-3xl truncate px-4 py-2 text-[1rem] font-bold text-leaf-dark">{membership?.association?.name}</p>
      </div>
      <Outlet />
      <nav
        aria-label="Menu principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto grid max-w-3xl grid-cols-5">
          {navItems.map(({ to, label, icon: Icon, end, primary }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex min-h-[72px] flex-col items-center justify-center gap-1 text-[0.875rem] font-bold ${
                    primary ? "text-ink" : isActive ? "text-leaf" : "text-muted"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {primary ? (
                      <span className={`-mt-6 grid h-14 w-14 place-items-center rounded-full border-4 border-white ${isActive ? "bg-leaf-dark" : "bg-leaf"} text-white shadow-[0_2px_0_#154D38]`}>
                        <Icon size={28} strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span className={`grid h-8 w-14 place-items-center rounded-full ${isActive ? "bg-leaf-soft" : ""}`}>
                        <Icon size={24} />
                      </span>
                    )}
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

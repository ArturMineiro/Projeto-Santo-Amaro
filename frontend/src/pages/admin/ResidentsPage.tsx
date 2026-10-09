import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import NewResidentSheet from "../../components/admin/NewResidentSheet";
import ResidentSheet from "../../components/admin/ResidentSheet";
import { IconChevron, IconPlus, IconSearch } from "../../components/Icons";
import { Page, PageHeader } from "../../components/Layout";
import { EmptyState, ErrorState, Spinner } from "../../components/ui";
import { relativeDate } from "../../lib/format";
import { useApi, useDebounced } from "../../lib/hooks";
import type { Membership } from "../../lib/types";

export default function ResidentsPage() {
  const { session } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("aba") === "pendentes" ? "pending" : "approved";
  const [query, setQuery] = useState("");
  const search = useDebounced(query.trim(), 300);
  const [open, setOpen] = useState<Membership | null>(null);
  const [adding, setAdding] = useState(false);

  const list = useApi<{ data: Membership[] }>("/admin/residents", { status: tab, search: search || undefined });
  const pendingCount = useApi<{ data: Membership[] }>("/admin/residents", { status: "pending" });
  const pending = pendingCount.data?.data.length ?? 0;

  const reloadAll = () => {
    list.reload();
    pendingCount.reload();
  };

  return (
    <Page wide>
      <PageHeader
        title="Moradores"
        action={
          <button type="button" className="btn-primary min-h-[48px] px-4" onClick={() => setAdding(true)}>
            <IconPlus size={22} />
            Novo
          </button>
        }
      />

      <div role="tablist" aria-label="Situação do cadastro" className="tabs">
        <button type="button" role="tab" className="tab" aria-selected={tab === "approved"} onClick={() => setParams({}, { replace: true })}>
          Confirmados
        </button>
        <button
          type="button"
          role="tab"
          className="tab"
          aria-selected={tab === "pending"}
          onClick={() => setParams({ aba: "pendentes" }, { replace: true })}
        >
          Para confirmar
          {pending > 0 && <span className="ml-2 rounded-full bg-sun px-2 py-0.5 text-[0.875rem] text-ink">{pending}</span>}
        </button>
      </div>

      <div className="relative mt-3">
        <label htmlFor="resident-filter" className="sr-only">
          Buscar morador
        </label>
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id="resident-filter"
          type="search"
          className="input pl-12"
          placeholder="Nome, casa ou telefone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="mt-4">
        {!list.data && list.loading && <Spinner />}
        {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
        {list.data &&
          (list.data.data.length === 0 ? (
            <EmptyState
              title={search ? "Ninguém encontrado" : tab === "pending" ? "Nenhum cadastro para confirmar" : "Nenhum morador ainda"}
              action={
                !search && tab === "approved" ? (
                  <button type="button" className="btn-primary" onClick={() => setAdding(true)}>
                    Cadastrar o primeiro morador
                  </button>
                ) : undefined
              }
            >
              {tab === "pending" && !search ? "Quando alguém se cadastrar com o código da associação, aparece aqui." : undefined}
            </EmptyState>
          ) : (
            <ul className={`divide-y divide-line overflow-hidden rounded-card border border-line bg-white ${list.loading ? "opacity-60" : ""}`}>
              {list.data.data.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => setOpen(m)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-leaf-soft font-display text-[1.25rem] font-extrabold text-leaf-dark">
                      {m.user?.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">
                        {m.user?.name}
                        {m.role === "admin" && <span className="ml-2 text-[0.875rem] font-bold text-leaf">administração</span>}
                      </span>
                      <span className="block truncate text-[1rem] text-muted">
                        {[m.unit, m.user?.phone_formatted].filter(Boolean).join(", ")}
                      </span>
                      {tab === "pending" && <span className="block text-[0.9375rem] text-muted">Pediu {relativeDate(m.created_at)}</span>}
                      {tab === "approved" && !m.user?.has_access && (
                        <span className="block text-[0.9375rem] text-muted">Ainda não criou senha</span>
                      )}
                    </span>
                    {!!m.waiting_packages && (
                      <span className="rounded-full bg-sun-soft px-2.5 py-1 text-[0.875rem] font-bold text-sun-dark">{m.waiting_packages}</span>
                    )}
                    <IconChevron className="shrink-0 text-muted" size={20} />
                  </button>
                </li>
              ))}
            </ul>
          ))}
      </div>

      <ResidentSheet resident={open} onClose={() => setOpen(null)} onChanged={reloadAll} currentUserId={session!.user.id} />
      <NewResidentSheet
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={() => {
          setAdding(false);
          reloadAll();
        }}
      />
    </Page>
  );
}

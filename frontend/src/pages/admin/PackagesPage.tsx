import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PackageRow from "../../components/admin/PackageRow";
import PackageSheet from "../../components/admin/PackageSheet";
import { IconSearch } from "../../components/Icons";
import { Page, PageHeader } from "../../components/Layout";
import { EmptyState, ErrorState, Spinner } from "../../components/ui";
import { useApi, useDebounced } from "../../lib/hooks";
import type { Package, PackageStatus, Paginated } from "../../lib/types";

export default function PackagesPage() {
  const [params, setParams] = useSearchParams();
  const notNotified = params.get("sem_aviso") === "1";
  const [status, setStatus] = useState<PackageStatus>("received");
  const [query, setQuery] = useState("");
  const search = useDebounced(query.trim(), 350);
  const [openId, setOpenId] = useState<number | null>(null);

  const { data, error, loading, reload } = useApi<Paginated<Package>>("/admin/packages", {
    status,
    search: search || undefined,
    not_notified: status === "received" && notNotified ? 1 : undefined,
    per_page: 100,
  });

  const total = data?.meta.total ?? 0;
  const shown = data?.data.length ?? 0;

  return (
    <Page wide>
      <PageHeader title="Encomendas" />

      <div role="tablist" aria-label="Situação" className="tabs">
        <button type="button" role="tab" className="tab" aria-selected={status === "received"} onClick={() => setStatus("received")}>
          Esperando
        </button>
        <button type="button" role="tab" className="tab" aria-selected={status === "picked_up"} onClick={() => setStatus("picked_up")}>
          Entregues
        </button>
      </div>

      {status === "received" && (
        <label className="mt-3 flex min-h-[48px] cursor-pointer items-center gap-3 font-bold">
          <input
            type="checkbox"
            className="h-6 w-6 accent-leaf"
            checked={notNotified}
            onChange={(e) => setParams(e.target.checked ? { sem_aviso: "1" } : {}, { replace: true })}
          />
          Só as que faltam avisar
        </label>
      )}

      <div className="relative mt-3">
        <label htmlFor="package-search" className="sr-only">
          Buscar encomenda
        </label>
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id="package-search"
          type="search"
          className="input pl-12"
          placeholder="Nome, casa, código ou descrição"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="mt-4" aria-busy={loading}>
        {!data && loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data &&
          (shown === 0 ? (
            <EmptyState title={search ? "Nada encontrado" : status === "received" ? "Nenhuma encomenda esperando" : "Nenhuma entrega ainda"}>
              {search ? "Confira o nome ou tente só uma parte dele." : undefined}
            </EmptyState>
          ) : (
            <>
              <ul className={`divide-y divide-line overflow-hidden rounded-card border border-line bg-white ${loading ? "opacity-60" : ""}`}>
                {data.data.map((pkg) => (
                  <li key={pkg.id}>
                    <PackageRow pkg={pkg} onOpen={setOpenId} />
                  </li>
                ))}
              </ul>
              {total > shown && (
                <p className="mt-3 text-center text-muted">
                  Mostrando {shown} de {total}. Use a busca para achar as mais antigas.
                </p>
              )}
            </>
          ))}
      </div>

      <PackageSheet packageId={openId} onClose={() => setOpenId(null)} onChanged={reload} />
    </Page>
  );
}

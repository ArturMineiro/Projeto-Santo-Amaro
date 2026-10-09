import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FilterSelect, Pager, Pill, SearchBox } from "../../components/system/common";
import { EmptyState, ErrorState, Notice, Spinner } from "../../components/ui";
import { plural, relativeDate } from "../../lib/format";
import { useApi, useDebounced } from "../../lib/hooks";
import { statusLabel } from "../../lib/systemFormat";
import type { PageOf, SystemMembership } from "../../lib/systemTypes";

/** Todos os vínculos pessoa ↔ associação do sistema. */
export default function SystemMemberships() {
  const [params, setParams] = useSearchParams();
  const associationId = params.get("associacao") ?? "";
  const [query, setQuery] = useState("");
  const search = useDebounced(query.trim(), 350);
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  const list = useApi<PageOf<SystemMembership>>("/system/memberships", {
    search: search || undefined,
    status: status || undefined,
    role: role || undefined,
    association_id: associationId || undefined,
    page,
  });

  const filterName = associationId ? list.data?.data[0]?.association?.name : null;
  const reset = (fn: () => void) => () => {
    fn();
    setPage(1);
  };

  return (
    <div>
      <h1 className="text-[1.875rem] font-extrabold">Vínculos</h1>
      <p className="mt-1 text-muted">Quem participa de qual associação. Busque por nome, telefone, email, casa ou nome da associação.</p>

      {associationId && (
        <div className="mt-4">
          <Notice
            action={
              <button type="button" className="btn-secondary min-h-[48px]" onClick={() => setParams({}, { replace: true })}>
                Ver todas
              </button>
            }
          >
            Mostrando só a associação <strong>{filterName ?? `#${associationId}`}</strong>.
          </Notice>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="sm:flex-[2]">
          <SearchBox id="member-search" value={query} onChange={(v) => reset(() => setQuery(v))()} placeholder="Buscar pessoa ou associação" />
        </div>
        <div className="flex gap-2 sm:flex-[2]">
          <FilterSelect
            label="Situação"
            value={status}
            onChange={(v) => reset(() => setStatus(v))()}
            options={[
              { value: "", label: "Toda situação" },
              { value: "approved", label: "Confirmados" },
              { value: "pending", label: "Para confirmar" },
              { value: "rejected", label: "Recusados" },
            ]}
          />
          <FilterSelect
            label="Papel"
            value={role}
            onChange={(v) => reset(() => setRole(v))()}
            options={[
              { value: "", label: "Todo papel" },
              { value: "admin", label: "Administração" },
              { value: "resident", label: "Moradores" },
            ]}
          />
        </div>
      </div>

      <div className="mt-4">
        {!list.data && list.loading && <Spinner />}
        {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
        {list.data &&
          (list.data.data.length === 0 ? (
            <EmptyState title="Nenhum vínculo encontrado" />
          ) : (
            <>
              <p className="mb-2 text-muted">{plural(list.data.meta.total, "vínculo", "vínculos")}</p>
              <ul className={`divide-y divide-line overflow-hidden rounded-card border border-line bg-white ${list.loading ? "opacity-60" : ""}`}>
                {list.data.data.map((m) => (
                  <li key={m.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{m.user.name}</span>
                        {m.role === "admin" && <Pill tone="green">Administração</Pill>}
                        <Pill tone={statusLabel[m.status].tone}>{statusLabel[m.status].text}</Pill>
                        {!m.user.is_active && <Pill tone="red">Acesso desativado</Pill>}
                      </p>
                      <p className="text-[1rem] text-muted">{[m.user.phone_formatted, m.user.email, m.unit].filter(Boolean).join(", ")}</p>
                    </div>
                    <div className="text-[1rem] sm:w-64 sm:text-right">
                      {m.association && (
                        <Link to={`/sistema/associacoes?abrir=${m.association.id}`} className="font-bold text-leaf underline">
                          {m.association.name}
                        </Link>
                      )}
                      <p className="text-[0.9375rem] text-muted">
                        Desde {relativeDate(m.approved_at ?? m.created_at)}
                        {m.user.has_access ? "" : ", sem senha"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <Pager meta={list.data.meta} onPage={setPage} />
            </>
          ))}
      </div>
    </div>
  );
}

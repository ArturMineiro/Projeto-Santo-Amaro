import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { IconChevron } from "../../components/Icons";
import Sheet from "../../components/Sheet";
import { FilterSelect, Pager, Pill, SearchBox } from "../../components/system/common";
import { EmptyState, ErrorState, Notice, Spinner } from "../../components/ui";
import api, { errorMessage } from "../../lib/api";
import { fullDate, plural, relativeDate } from "../../lib/format";
import { useApi, useDebounced } from "../../lib/hooks";
import { ACTIONS, actionTone, statusLabel } from "../../lib/systemFormat";
import type { PageOf, SystemAssociation, SystemAssociationDetail } from "../../lib/systemTypes";
import { toast } from "../../lib/toast";

export default function SystemAssociations() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const search = useDebounced(query.trim(), 350);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const openId = Number(params.get("abrir")) || null;

  const list = useApi<PageOf<SystemAssociation>>("/system/associations", { search: search || undefined, status: status || undefined, page });

  function open(id: number | null) {
    setParams(id ? { abrir: String(id) } : {}, { replace: !id });
  }

  return (
    <div>
      <h1 className="text-[1.875rem] font-extrabold">Associações</h1>
      <p className="mt-1 text-muted">Busque pelo nome, código de convite, email, endereço ou pelo nome/telefone de quem administra.</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="sm:flex-[2]">
          <SearchBox
            id="assoc-search"
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Buscar associação"
          />
        </div>
        <FilterSelect
          label="Situação"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={[
            { value: "", label: "Todas" },
            { value: "active", label: "Ativas" },
            { value: "inactive", label: "Desativadas" },
          ]}
        />
      </div>

      <div className="mt-4">
        {!list.data && list.loading && <Spinner />}
        {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
        {list.data &&
          (list.data.data.length === 0 ? (
            <EmptyState title="Nenhuma associação encontrada">{search ? "Tente outra parte do nome." : undefined}</EmptyState>
          ) : (
            <>
              <p className="mb-2 text-muted">{plural(list.data.meta.total, "associação", "associações")}</p>
              <ul className={`divide-y divide-line overflow-hidden rounded-card border border-line bg-white ${list.loading ? "opacity-60" : ""}`}>
                {list.data.data.map((a) => (
                  <li key={a.id}>
                    <button type="button" onClick={() => open(a.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper">
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-bold">{a.name}</span>
                          {!a.is_active && <Pill tone="red">Desativada</Pill>}
                          {a.pending_count > 0 && <Pill tone="yellow">{a.pending_count} para confirmar</Pill>}
                        </span>
                        <span className="block text-[1rem] text-muted">
                          {plural(a.residents_count, "morador", "moradores")}, {a.waiting_count} esperando, {a.packages_count} no total
                        </span>
                        <span className="block text-[0.9375rem] text-muted">
                          {a.last_package_at ? `Última encomenda ${relativeDate(a.last_package_at)}` : "Nenhuma encomenda ainda"}
                        </span>
                      </span>
                      <IconChevron className="shrink-0 text-muted" size={20} />
                    </button>
                  </li>
                ))}
              </ul>
              <Pager meta={list.data.meta} onPage={setPage} />
            </>
          ))}
      </div>

      <Sheet open={openId !== null} onClose={() => open(null)} title="Associação">
        {openId !== null && <AssociationDetail id={openId} onChanged={list.reload} />}
      </Sheet>
    </div>
  );
}

function AssociationDetail({ id, onChanged }: { id: number; onChanged: () => void }) {
  const { data, error, reload } = useApi<SystemAssociationDetail>(`/system/associations/${id}`);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle(active: boolean) {
    setBusy(true);
    try {
      const res = await api.patch<{ message: string }>(`/system/associations/${id}`, { is_active: active });
      toast(res.data.message);
      setConfirming(false);
      reload();
      onChanged();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <Spinner />;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-display text-[1.375rem] font-extrabold leading-tight">{data.name}</p>
        <p className="mt-1 flex flex-wrap gap-2">
          {data.is_active ? <Pill tone="green">Ativa</Pill> : <Pill tone="red">Desativada</Pill>}
          <Pill tone="gray">Código {data.invite_code}</Pill>
        </p>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[1rem]">
        <dt className="text-muted">Criada</dt>
        <dd>{fullDate(data.created_at)}</dd>
        {data.pickup_hours && (
          <>
            <dt className="text-muted">Horário</dt>
            <dd>{data.pickup_hours}</dd>
          </>
        )}
        {data.address && (
          <>
            <dt className="text-muted">Endereço</dt>
            <dd>{data.address}</dd>
          </>
        )}
        {(data.phone || data.email) && (
          <>
            <dt className="text-muted">Contato</dt>
            <dd className="break-all">{[data.phone, data.email].filter(Boolean).join(", ")}</dd>
          </>
        )}
        <dt className="text-muted">Encomendas</dt>
        <dd>
          {data.waiting_count} esperando, {data.packages_count} no total
        </dd>
      </dl>

      {data.failed_notifications_30d > 0 && (
        <Notice tone="error">
          {plural(data.failed_notifications_30d, "aviso falhou", "avisos falharam")} nos últimos 30 dias.{" "}
          <Link className="underline" to={`/sistema/logs?aba=avisos&status=failed&associacao=${data.id}`}>
            Ver
          </Link>
        </Notice>
      )}

      <section>
        <div className="flex items-end justify-between gap-3">
          <h3 className="font-sans text-[1.125rem] font-bold">Vínculos ({data.memberships.length})</h3>
          <Link to={`/sistema/vinculos?associacao=${data.id}`} className="btn-link">
            Filtrar em Vínculos
          </Link>
        </div>
        <ul className="mt-2 divide-y divide-line overflow-hidden rounded-card border border-line">
          {data.memberships.map((m) => (
            <li key={m.id} className="px-4 py-3">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-bold">{m.user.name}</span>
                {m.role === "admin" && <Pill tone="green">Administração</Pill>}
                {m.status !== "approved" && <Pill tone={statusLabel[m.status].tone}>{statusLabel[m.status].text}</Pill>}
              </p>
              <p className="text-[1rem] text-muted">
                {[m.unit, m.user.phone_formatted, m.user.email].filter(Boolean).join(", ")}
              </p>
              <p className="text-[0.9375rem] text-muted">
                {m.user.has_access ? "Já usa o site" : "Sem senha ainda"}
                {m.waiting_packages ? `, ${m.waiting_packages} esperando` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3">
          <h3 className="font-sans text-[1.125rem] font-bold">Atividade recente</h3>
          <Link to={`/sistema/logs?associacao=${data.id}`} className="btn-link">
            Ver tudo
          </Link>
        </div>
        {data.recent_activity.length === 0 ? (
          <p className="text-muted">Nada registrado ainda.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {data.recent_activity.map((a) => (
              <li key={a.id} className="text-[1rem]">
                <Pill tone={actionTone(a.action)}>{ACTIONS[a.action] ?? a.action}</Pill> <span>{a.description}</span>
                <span className="block text-[0.875rem] text-muted">
                  {relativeDate(a.created_at)}
                  {a.user ? `, por ${a.user.name}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.is_active ? (
        confirming ? (
          <div className="flex flex-col gap-3 rounded-card bg-alert-soft p-4">
            <p className="font-bold text-alert">
              Desativar? Ninguém da associação consegue usar o painel nem ver encomendas até reativar. Os dados ficam guardados.
            </p>
            <button type="button" className="btn w-full bg-alert text-white" disabled={busy} onClick={() => void toggle(false)}>
              Desativar associação
            </button>
            <button type="button" className="btn-secondary w-full" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
          </div>
        ) : (
          <button type="button" className="btn-danger w-full" onClick={() => setConfirming(true)}>
            Desativar associação
          </button>
        )
      ) : (
        <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => void toggle(true)}>
          Reativar associação
        </button>
      )}
    </div>
  );
}

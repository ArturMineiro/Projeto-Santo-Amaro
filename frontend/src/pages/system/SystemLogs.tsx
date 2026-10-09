import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FilterSelect, Pager, Pill, SearchBox } from "../../components/system/common";
import { EmptyState, ErrorState, Spinner } from "../../components/ui";
import { fullDate, relativeDate } from "../../lib/format";
import { useApi, useDebounced } from "../../lib/hooks";
import { ACTIONS, actionTone, formatBytes } from "../../lib/systemFormat";
import type { ActivityEntry, AppLogEntry, NotificationEntry, PageOf } from "../../lib/systemTypes";

type Tab = "atividades" | "avisos" | "servidor";

export default function SystemLogs() {
  const [params, setParams] = useSearchParams();
  const tab = (["atividades", "avisos", "servidor"].includes(params.get("aba") ?? "") ? params.get("aba") : "atividades") as Tab;
  const associationId = params.get("associacao") ?? "";

  function go(next: Tab) {
    const p: Record<string, string> = { aba: next };
    if (associationId && next !== "servidor") p.associacao = associationId;
    setParams(p, { replace: true });
  }

  return (
    <div>
      <h1 className="text-[1.875rem] font-extrabold">Logs</h1>

      <div role="tablist" aria-label="Tipo de log" className="tabs mt-4">
        <button type="button" role="tab" className="tab" aria-selected={tab === "atividades"} onClick={() => go("atividades")}>
          Atividades
        </button>
        <button type="button" role="tab" className="tab" aria-selected={tab === "avisos"} onClick={() => go("avisos")}>
          Avisos
        </button>
        <button type="button" role="tab" className="tab" aria-selected={tab === "servidor"} onClick={() => go("servidor")}>
          Servidor
        </button>
      </div>

      {associationId && tab !== "servidor" && (
        <p className="mt-3 text-muted">
          Filtrando uma associação.{" "}
          <button type="button" className="btn-link" onClick={() => setParams({ aba: tab }, { replace: true })}>
            Ver de todas
          </button>
        </p>
      )}

      <div className="mt-4">
        {tab === "atividades" && <ActivityTab key={associationId} associationId={associationId} />}
        {tab === "avisos" && <NotificationsTab key={associationId} associationId={associationId} initialStatus={params.get("status") ?? ""} />}
        {tab === "servidor" && <ServerLogTab />}
      </div>
    </div>
  );
}

const ACTION_GROUPS = [
  { value: "", label: "Toda atividade" },
  { value: "auth.login_failed", label: "Senhas erradas" },
  { value: "auth", label: "Entradas no site" },
  { value: "package", label: "Encomendas" },
  { value: "resident", label: "Moradores" },
  { value: "association", label: "Associações" },
];

function ActivityTab({ associationId }: { associationId: string }) {
  const [query, setQuery] = useState("");
  const search = useDebounced(query.trim(), 350);
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);

  const list = useApi<PageOf<ActivityEntry>>("/system/activity", {
    search: search || undefined,
    action: action || undefined,
    association_id: associationId || undefined,
    page,
  });

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="sm:flex-[2]">
          <SearchBox
            id="activity-search"
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Buscar por texto, pessoa ou IP"
          />
        </div>
        <FilterSelect
          label="Tipo de atividade"
          value={action}
          onChange={(v) => {
            setAction(v);
            setPage(1);
          }}
          options={ACTION_GROUPS}
        />
      </div>

      <div className="mt-4">
        {!list.data && list.loading && <Spinner />}
        {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
        {list.data &&
          (list.data.data.length === 0 ? (
            <EmptyState title="Nada registrado" />
          ) : (
            <>
              <ol className={`divide-y divide-line overflow-hidden rounded-card border border-line bg-white ${list.loading ? "opacity-60" : ""}`}>
                {list.data.data.map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <p className="flex flex-wrap items-center gap-2">
                      <Pill tone={actionTone(a.action)}>{ACTIONS[a.action] ?? a.action}</Pill>
                      <span>{a.description}</span>
                    </p>
                    <p className="mt-0.5 text-[0.9375rem] text-muted">
                      <time dateTime={a.created_at ?? undefined} title={fullDate(a.created_at)}>
                        {relativeDate(a.created_at)}
                      </time>
                      {a.user ? `, ${a.user.name}` : ""}
                      {a.association && (
                        <>
                          {", "}
                          <Link to={`/sistema/associacoes?abrir=${a.association.id}`} className="underline">
                            {a.association.name}
                          </Link>
                        </>
                      )}
                      {a.ip ? `, IP ${a.ip}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
              <Pager meta={list.data.meta} onPage={setPage} />
            </>
          ))}
      </div>
    </>
  );
}

function NotificationsTab({ associationId, initialStatus }: { associationId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [channel, setChannel] = useState("");
  const [page, setPage] = useState(1);

  const list = useApi<PageOf<NotificationEntry>>("/system/notifications", {
    status: status || undefined,
    channel: channel || undefined,
    association_id: associationId || undefined,
    page,
  });

  return (
    <>
      <div className="flex gap-2">
        <FilterSelect
          label="Resultado"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={[
            { value: "", label: "Todos" },
            { value: "sent", label: "Enviados" },
            { value: "failed", label: "Falharam" },
          ]}
        />
        <FilterSelect
          label="Canal"
          value={channel}
          onChange={(v) => {
            setChannel(v);
            setPage(1);
          }}
          options={[
            { value: "", label: "Todo canal" },
            { value: "whatsapp", label: "WhatsApp" },
            { value: "email", label: "Email" },
          ]}
        />
      </div>

      <div className="mt-4">
        {!list.data && list.loading && <Spinner />}
        {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
        {list.data &&
          (list.data.data.length === 0 ? (
            <EmptyState title="Nenhum aviso" />
          ) : (
            <>
              <ol className={`divide-y divide-line overflow-hidden rounded-card border border-line bg-white ${list.loading ? "opacity-60" : ""}`}>
                {list.data.data.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <p className="flex flex-wrap items-center gap-2">
                      <Pill tone={n.status === "sent" ? "green" : "red"}>{n.status === "sent" ? "Enviado" : "Falhou"}</Pill>
                      <span className="font-bold">
                        {n.channel === "whatsapp" ? (n.provider === "manual" ? "WhatsApp manual" : "WhatsApp") : "Email"}
                      </span>
                      <span className="text-muted">para {n.resident ?? n.recipient}</span>
                    </p>
                    <p className="text-[0.9375rem] text-muted">
                      {n.recipient}
                      {n.provider && n.provider !== "manual" ? `, via ${n.provider}` : ""}, {relativeDate(n.created_at)}
                      {n.association ? `, ${n.association.name}` : ""}
                    </p>
                    {n.error && <p className="mt-1 break-words rounded-[10px] bg-alert-soft px-3 py-2 text-[0.9375rem] text-alert">{n.error}</p>}
                  </li>
                ))}
              </ol>
              <Pager meta={list.data.meta} onPage={setPage} />
            </>
          ))}
      </div>
    </>
  );
}

const levelTone: Record<string, "red" | "yellow" | "gray" | "green"> = {
  emergency: "red",
  alert: "red",
  critical: "red",
  error: "red",
  warning: "yellow",
  notice: "gray",
  info: "green",
  debug: "gray",
};

function ServerLogTab() {
  const [level, setLevel] = useState("");
  const [query, setQuery] = useState("");
  const search = useDebounced(query.trim(), 400);
  const { data, error, loading, reload } = useApi<{ size: number; data: AppLogEntry[] }>("/system/app-log", {
    level: level || undefined,
    search: search || undefined,
    limit: 150,
  });

  return (
    <>
      <p className="text-muted">Últimas linhas de storage/logs/laravel.log{data ? ` (arquivo com ${formatBytes(data.size)})` : ""}. Mais recentes primeiro.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="sm:flex-[2]">
          <SearchBox id="log-search" value={query} onChange={setQuery} placeholder="Buscar no log" />
        </div>
        <FilterSelect
          label="Nível"
          value={level}
          onChange={setLevel}
          options={[
            { value: "", label: "Todos os níveis" },
            { value: "error", label: "Erros" },
            { value: "warning", label: "Alertas" },
            { value: "info", label: "Informações" },
          ]}
        />
        <button type="button" className="btn-secondary" onClick={reload} disabled={loading}>
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      <div className="mt-4">
        {!data && loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data &&
          (data.data.length === 0 ? (
            <EmptyState title="Log vazio">Nada encontrado com esse filtro.</EmptyState>
          ) : (
            <ol className="flex flex-col gap-2">
              {data.data.map((e, i) => (
                <li key={`${e.time}-${i}`} className="rounded-card border border-line bg-white px-4 py-3">
                  <p className="flex flex-wrap items-center gap-2 text-[0.9375rem]">
                    <Pill tone={levelTone[e.level] ?? "gray"}>{e.level}</Pill>
                    <span className="text-muted tabular-nums">{e.time}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words font-mono text-[0.875rem] leading-relaxed">{e.message}</p>
                  {e.details && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-[0.9375rem] font-bold text-leaf">Detalhes</summary>
                      <pre className="mt-2 max-h-72 overflow-auto rounded-[10px] bg-paper p-3 text-[0.8125rem] leading-relaxed">{e.details}</pre>
                    </details>
                  )}
                </li>
              ))}
            </ol>
          ))}
      </div>
    </>
  );
}

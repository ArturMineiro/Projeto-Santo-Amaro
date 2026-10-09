import { Link } from "react-router-dom";
import { ErrorState, Notice, Spinner } from "../../components/ui";
import { fullDate } from "../../lib/format";
import { useApi } from "../../lib/hooks";
import { formatBytes } from "../../lib/systemFormat";
import type { SystemOverview } from "../../lib/systemTypes";

function Stat({ label, value, note, alert = false }: { label: string; value: number; note?: string; alert?: boolean }) {
  return (
    <div className="bg-white px-4 py-4">
      <dt className="text-[0.9375rem] text-muted">{label}</dt>
      <dd className={`font-display text-[2rem] font-extrabold leading-none tabular-nums ${alert ? "text-alert" : ""}`}>{value.toLocaleString("pt-BR")}</dd>
      {note && <dd className="mt-1 text-[0.9375rem] text-muted">{note}</dd>}
    </div>
  );
}

const dayFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "numeric", timeZone: "UTC" });
const weekdayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });

export default function SystemHome() {
  const { data, error, loading, reload } = useApi<SystemOverview>("/system/overview");

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return loading ? <Spinner /> : null;

  const { totals: t, notifications_7d: n, system: s } = data;
  const max = Math.max(1, ...data.packages_per_day.map((d) => d.total));
  const diskUsed = s.disk_free && s.disk_total ? 1 - s.disk_free / s.disk_total : null;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-[1.875rem] font-extrabold">Visão geral</h1>

      {data.warnings.length > 0 && (
        <div className="-mt-4 flex flex-col gap-2">
          {data.warnings.map((w) => (
            <Notice key={w.text} tone={w.tone}>
              {w.text}
            </Notice>
          ))}
        </div>
      )}

      <section aria-labelledby="t-communities">
        <h2 id="t-communities" className="text-[1.375rem] font-semibold">
          Comunidades e pessoas
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-4">
          <Stat label="Associações" value={t.associations} note={t.associations_inactive ? `${t.associations_inactive} desativada(s)` : "todas ativas"} />
          <Stat label="Pessoas" value={t.users} note={`${t.users_without_access} sem senha ainda`} />
          <Stat label="Vínculos confirmados" value={t.memberships_approved} note={`${t.admins} na administração`} />
          <Stat label="Para confirmar" value={t.memberships_pending} note={`${t.memberships_rejected} recusados`} alert={t.memberships_pending > 0} />
        </dl>
      </section>

      <section aria-labelledby="t-packages">
        <h2 id="t-packages" className="text-[1.375rem] font-semibold">
          Encomendas
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-4">
          <Stat label="Total registradas" value={t.packages} />
          <Stat label="Esperando" value={t.packages_waiting} />
          <Stat label="Há mais de 7 dias" value={t.packages_waiting_over_7_days} alert={t.packages_waiting_over_7_days > 0} />
          <Stat label="Chegaram hoje" value={t.packages_today} />
        </dl>

        <figure className="mt-3 rounded-card border border-line bg-white p-4">
          <figcaption className="font-bold">Encomendas registradas por dia (14 dias)</figcaption>
          <div className="mt-4 flex h-36 items-end gap-1" role="img" aria-label={data.packages_per_day.map((d) => `${dayFmt.format(new Date(d.day))}: ${d.total}`).join(", ")}>
            {data.packages_per_day.map((d) => (
              <div key={d.day} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[0.8125rem] font-bold tabular-nums">{d.total || ""}</span>
                <span className="w-full rounded-t-[6px] bg-leaf" style={{ height: `${Math.max(d.total ? 6 : 2, (d.total / max) * 100)}%`, opacity: d.total ? 1 : 0.25 }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1 text-center text-[0.75rem] text-muted" aria-hidden>
            {data.packages_per_day.map((d, i) => (
              <span key={d.day} className="min-w-0 flex-1 truncate">
                {i % 2 === 1 || data.packages_per_day.length < 8 ? weekdayFmt.format(new Date(d.day)).replace(".", "") : ""}
              </span>
            ))}
          </div>
        </figure>

        {data.busiest.length > 0 && (
          <div className="mt-3 rounded-card border border-line bg-white">
            <p className="px-4 pt-4 font-bold">Mais encomendas esperando</p>
            <ul className="mt-2 divide-y divide-line">
              {data.busiest.map((a) => (
                <li key={a.id}>
                  <Link to={`/sistema/associacoes?abrir=${a.id}`} className="flex min-h-[52px] items-center justify-between gap-3 px-4 hover:bg-paper">
                    <span className="truncate font-bold">{a.name}</span>
                    <span className="font-display text-[1.25rem] font-extrabold tabular-nums">{a.waiting_count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section aria-labelledby="t-notify">
        <h2 id="t-notify" className="text-[1.375rem] font-semibold">
          Avisos nos últimos 7 dias
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-5 [&>div:last-child]:col-span-2 sm:[&>div:last-child]:col-span-1">
          <Stat label="WhatsApp automático" value={n.whatsapp_sent} />
          <Stat label="WhatsApp manual" value={n.whatsapp_manual} />
          <Stat label="Email" value={n.email_sent} />
          <Stat label="WhatsApp falhou" value={n.whatsapp_failed} alert={n.whatsapp_failed > 0} />
          <Stat label="Email falhou" value={n.email_failed} alert={n.email_failed > 0} />
        </dl>
        {n.whatsapp_failed + n.email_failed > 0 && (
          <Link to="/sistema/logs?aba=avisos&status=failed" className="btn-link mt-2">
            Ver avisos que falharam
          </Link>
        )}
      </section>

      <section aria-labelledby="t-server">
        <h2 id="t-server" className="text-[1.375rem] font-semibold">
          Servidor
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 rounded-card border border-line bg-white p-4 sm:grid-cols-2 [&>div]:flex [&>div]:justify-between [&>div]:gap-4 [&>div]:border-b [&>div]:border-line [&>div]:py-2.5 [&_dt]:text-muted [&_dd]:text-right [&_dd]:font-bold">
          <div>
            <dt>Ambiente</dt>
            <dd>
              {s.environment}
              {s.debug ? " (debug ligado)" : ""}
            </dd>
          </div>
          <div>
            <dt>Endereço</dt>
            <dd className="break-all">{s.url}</dd>
          </div>
          <div>
            <dt>Laravel / PHP</dt>
            <dd>
              {s.laravel_version} / {s.php_version}
            </dd>
          </div>
          <div>
            <dt>Banco de dados</dt>
            <dd className="break-all">{s.database}</dd>
          </div>
          <div>
            <dt>WhatsApp</dt>
            <dd>{s.whatsapp_driver === "none" ? "manual (gratuito)" : s.whatsapp_driver}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{s.mail_mailer === "log" ? "só no log (teste)" : s.mail_mailer}</dd>
          </div>
          <div>
            <dt>Fila</dt>
            <dd>
              {s.queue_connection}
              {s.queue_pending ? `, ${s.queue_pending} pendente(s)` : ""}
              {s.queue_failed ? `, ${s.queue_failed} com falha` : ""}
            </dd>
          </div>
          <div>
            <dt>Migrations aplicadas</dt>
            <dd>{s.migrations ?? "?"}</dd>
          </div>
          <div>
            <dt>Disco livre</dt>
            <dd className={diskUsed !== null && diskUsed > 0.9 ? "text-alert" : ""}>
              {s.disk_free ? `${formatBytes(s.disk_free)} de ${formatBytes(s.disk_total)}` : "?"}
            </dd>
          </div>
          <div>
            <dt>Arquivo de log</dt>
            <dd>
              <Link to="/sistema/logs?aba=servidor" className="text-leaf underline">
                {formatBytes(s.log_size)}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Fuso horário</dt>
            <dd>{s.timezone}</dd>
          </div>
          <div>
            <dt>Hora do servidor</dt>
            <dd>{fullDate(s.server_time)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

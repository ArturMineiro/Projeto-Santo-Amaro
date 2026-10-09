import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import PackageRow from "../../components/admin/PackageRow";
import PackageSheet from "../../components/admin/PackageSheet";
import { IconBox, IconPlus } from "../../components/Icons";
import { Page, PageHeader } from "../../components/Layout";
import { EmptyState, ErrorState, Notice, Spinner } from "../../components/ui";
import { plural } from "../../lib/format";
import { useApi } from "../../lib/hooks";
import type { Dashboard, Package, Paginated } from "../../lib/types";

export default function AdminHome() {
  const { session } = useAuth();
  const stats = useApi<Dashboard>("/admin/dashboard");
  const waiting = useApi<Paginated<Package>>("/admin/packages", { status: "received", per_page: 8 });
  const [openId, setOpenId] = useState<number | null>(null);

  const d = stats.data;
  const reloadAll = () => {
    stats.reload();
    waiting.reload();
  };

  return (
    <Page wide>
      <PageHeader title={`Olá, ${session?.user.first_name}!`} />

      {/* A ação principal do dia: chegou encomenda, registra. */}
      <Link
        to="/painel/nova"
        className="group flex items-center gap-4 rounded-card bg-leaf p-5 text-white shadow-[0_3px_0_#154D38] hover:bg-leaf-dark"
      >
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[18px] bg-sun text-ink">
          <IconPlus size={36} strokeWidth={2.5} />
        </span>
        <span>
          <span className="block font-display text-[1.625rem] font-extrabold leading-tight">Chegou encomenda</span>
          <span className="block text-white/85">Registrar e avisar o morador</span>
        </span>
      </Link>

      {d && (
        <div className="mt-5 flex flex-col gap-3">
          {d.pending_residents > 0 && (
            <Notice
              tone="warning"
              action={
                <Link to="/painel/moradores?aba=pendentes" className="btn-secondary min-h-[48px]">
                  Ver
                </Link>
              }
            >
              <strong>{plural(d.pending_residents, "cadastro esperando", "cadastros esperando")}</strong> sua confirmação.
            </Notice>
          )}
          {d.waiting_not_notified > 0 && (
            <Notice
              tone="warning"
              action={
                <Link to="/painel/encomendas?sem_aviso=1" className="btn-secondary min-h-[48px]">
                  Ver
                </Link>
              }
            >
              <strong>{plural(d.waiting_not_notified, "encomenda", "encomendas")}</strong> sem aviso ao morador. Abra e use “Avisar pelo meu
              WhatsApp”.
            </Notice>
          )}
          {d.failed_notifications_7d > 0 && (
            <Notice tone="error">
              {plural(d.failed_notifications_7d, "aviso não foi entregue", "avisos não foram entregues")} nesta semana. Abra a
              encomenda e use “Avisar pelo meu WhatsApp”.
            </Notice>
          )}
          {!d.whatsapp_enabled && (
            <Notice>
              O envio automático por WhatsApp está desligado. Os avisos vão por email, e você pode avisar pelo seu WhatsApp com um toque.
            </Notice>
          )}
        </div>
      )}

      {d && (
        <dl className="mt-6 grid grid-cols-3 divide-x divide-line rounded-card border border-line bg-white text-center">
          <div className="px-2 py-4">
            <dt className="text-[0.9375rem] text-muted">Esperando</dt>
            <dd className="font-display text-[2rem] font-extrabold leading-none">{d.waiting}</dd>
          </div>
          <div className="px-2 py-4">
            <dt className="text-[0.9375rem] text-muted">Chegaram hoje</dt>
            <dd className="font-display text-[2rem] font-extrabold leading-none">{d.received_today}</dd>
          </div>
          <div className="px-2 py-4">
            <dt className="text-[0.9375rem] text-muted">Entregues hoje</dt>
            <dd className="font-display text-[2rem] font-extrabold leading-none">{d.picked_up_today}</dd>
          </div>
        </dl>
      )}

      <section className="mt-8" aria-labelledby="waiting-title">
        <div className="flex items-end justify-between gap-3">
          <h2 id="waiting-title" className="text-[1.5rem] font-semibold">
            Esperando retirada
          </h2>
          {(waiting.data?.meta.total ?? 0) > 0 && (
            <Link to="/painel/encomendas" className="btn-link">
              Ver todas
            </Link>
          )}
        </div>
        {d && d.waiting_over_7_days > 0 && (
          <p className="mt-1 font-bold text-alert">{plural(d.waiting_over_7_days, "está", "estão")} esperando há mais de uma semana.</p>
        )}

        <div className="mt-3">
          {!waiting.data && waiting.loading && <Spinner />}
          {waiting.error && <ErrorState message={waiting.error} onRetry={waiting.reload} />}
          {waiting.data &&
            (waiting.data.data.length === 0 ? (
              <div className="card">
                <EmptyState title="Tudo entregue">Nenhuma encomenda esperando retirada.</EmptyState>
              </div>
            ) : (
              <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white">
                {waiting.data.data.map((pkg) => (
                  <li key={pkg.id}>
                    <PackageRow pkg={pkg} onOpen={setOpenId} />
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </section>

      <Link to="/minhas" className="btn-link mt-6">
        <IconBox size={20} />
        Ver as minhas encomendas
      </Link>

      <PackageSheet packageId={openId} onClose={() => setOpenId(null)} onChanged={reloadAll} />
    </Page>
  );
}

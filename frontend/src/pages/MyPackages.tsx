import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { IconClock, IconRefresh, IconUser } from "../components/Icons";
import { Page, PageHeader } from "../components/Layout";
import Ticket from "../components/Ticket";
import { EmptyState, ErrorState, Spinner } from "../components/ui";
import { plural, relativeDate } from "../lib/format";
import { useApi } from "../lib/hooks";
import type { Package } from "../lib/types";

interface MyPackages {
  waiting: Package[];
  history: Package[];
}

/** Tela do morador: o que está esperando por ele na associação. */
export default function MyPackagesPage() {
  const { session, membership } = useAuth();
  const { data, error, loading, reload } = useApi<MyPackages>("/my/packages");
  const [showHistory, setShowHistory] = useState(false);
  const association = membership?.association;
  const isAdmin = membership?.role === "admin";

  return (
    <div className="min-h-dvh">
      <Page>
        <PageHeader
          title={`Olá, ${session?.user.first_name}!`}
          subtitle={association?.name}
          back={isAdmin ? "/painel" : undefined}
          action={
            <Link to="/perfil" className="icon-btn -mr-2" aria-label="Meus dados">
              <IconUser size={28} />
            </Link>
          }
        />

        {!data && loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={reload} />}

        {data && (
          <>
            {data.waiting.length > 0 ? (
              <section aria-labelledby="waiting-title">
                <h2 id="waiting-title" className="text-[1.5rem] font-semibold">
                  {data.waiting.length === 1 ? "Tem 1 encomenda esperando por você" : `Tem ${data.waiting.length} encomendas esperando por você`}
                </h2>
                <p className="mt-1 text-muted">Mostre o código na hora de retirar.</p>
                <ul className="mt-4 flex flex-col gap-3">
                  {data.waiting.map((pkg) => (
                    <li key={pkg.id}>
                      <Ticket pkg={pkg} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <div className="card mt-2">
                <EmptyState title="Nada esperando por você agora">
                  Quando chegar algo no seu nome, a associação registra e você recebe o aviso no WhatsApp.
                </EmptyState>
              </div>
            )}

            {(association?.pickup_hours || association?.address) && (
              <section className="mt-6 flex gap-3 rounded-card bg-leaf-soft p-4 text-leaf-dark">
                <IconClock className="mt-0.5 shrink-0" />
                <div>
                  <h2 className="font-sans text-[1.125rem] font-bold text-leaf-dark">Onde e quando retirar</h2>
                  {association.pickup_hours && <p>{association.pickup_hours}</p>}
                  {association.address && <p>{association.address}</p>}
                </div>
              </section>
            )}

            <button type="button" className="btn-secondary mt-6 w-full" onClick={reload} disabled={loading}>
              <IconRefresh size={22} className={loading ? "animate-spin" : ""} />
              {loading ? "Atualizando…" : "Atualizar"}
            </button>

            {data.history.length > 0 && (
              <section className="mt-8">
                <button
                  type="button"
                  className="flex min-h-[56px] w-full items-center justify-between font-bold"
                  aria-expanded={showHistory}
                  onClick={() => setShowHistory((v) => !v)}
                >
                  <span>Já retiradas ({plural(data.history.length, "encomenda", "encomendas")})</span>
                  <span className="text-leaf underline">{showHistory ? "Esconder" : "Ver"}</span>
                </button>
                {showHistory && (
                  <ul className="divide-y divide-line rounded-card border border-line bg-white">
                    {data.history.map((pkg) => (
                      <li key={pkg.id} className="px-4 py-3">
                        <p className="font-bold capitalize">
                          {pkg.type_label}
                          {pkg.description ? `: ${pkg.description}` : ""}
                        </p>
                        <p className="text-[1rem] text-muted">
                          Retirada {relativeDate(pkg.picked_up_at)}
                          {pkg.picked_up_by_name ? ` por ${pkg.picked_up_by_name}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </Page>
    </div>
  );
}

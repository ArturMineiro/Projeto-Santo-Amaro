import { useState } from "react";
import api, { errorMessage, fieldErrors } from "../../lib/api";
import { fullDate, relativeDate } from "../../lib/format";
import { useApi } from "../../lib/hooks";
import { toast } from "../../lib/toast";
import type { Package } from "../../lib/types";
import { IconBell, IconCheck, IconWhatsApp } from "../Icons";
import Sheet from "../Sheet";
import Ticket from "../Ticket";
import { Field, Notice, Spinner } from "../ui";

/** Detalhes de uma encomenda + ações da administração (entregar, reavisar...). */
export default function PackageSheet({
  packageId,
  onClose,
  onChanged,
}: {
  packageId: number | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  return (
    <Sheet open={packageId !== null} onClose={onClose} title="Encomenda">
      {packageId !== null && <PackageDetails id={packageId} onClose={onClose} onChanged={onChanged} />}
    </Sheet>
  );
}

function PackageDetails({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
  const { data: fetched, error, reload } = useApi<Package>(`/admin/packages/${id}`);
  const [override, setOverride] = useState<Package | null>(null);
  const pkg = override ?? fetched;

  const [mode, setMode] = useState<"view" | "pickup" | "delete">("view");
  const [pickup, setPickup] = useState({ pickup_code: "", picked_up_by_name: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<{ data: { message: string; package?: Package } }>, closeAfter = false) {
    setBusy(true);
    setErrors({});
    try {
      const { data } = await action();
      toast(data.message);
      if (data.package) setOverride(data.package);
      setMode("view");
      onChanged();
      if (closeAfter) onClose();
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      if (!fe.pickup_code) toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <Notice tone="error" action={<button className="btn-secondary min-h-[48px]" onClick={reload}>Tentar de novo</button>}>{error}</Notice>;
  if (!pkg) return <Spinner />;

  const resident = pkg.resident;
  const waiting = pkg.status === "received";
  const lastNotifications = (pkg.notifications ?? []).slice(0, 4);

  return (
    <div className="flex flex-col gap-5">
      <Ticket
        pkg={pkg}
        title={resident?.name}
        subtitle={[pkg.unit, resident?.phone_formatted].filter(Boolean).join(", ")}
      />

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[1rem]">
        {pkg.description && (
          <>
            <dt className="text-muted">Descrição</dt>
            <dd className="font-bold">{pkg.description}</dd>
          </>
        )}
        {pkg.tracking_code && (
          <>
            <dt className="text-muted">Rastreio</dt>
            <dd className="break-all font-bold">{pkg.tracking_code}</dd>
          </>
        )}
        <dt className="text-muted">Chegou</dt>
        <dd>
          {fullDate(pkg.arrived_at)}
          {pkg.registered_by ? `, registrada por ${pkg.registered_by}` : ""}
        </dd>
        {pkg.picked_up_at && (
          <>
            <dt className="text-muted">Retirada</dt>
            <dd>
              {fullDate(pkg.picked_up_at)}
              {pkg.picked_up_by_name ? ` por ${pkg.picked_up_by_name}` : ""}
              {pkg.delivered_by ? `, entregue por ${pkg.delivered_by}` : ""}
            </dd>
          </>
        )}
        {pkg.notes && (
          <>
            <dt className="text-muted">Observação</dt>
            <dd>{pkg.notes}</dd>
          </>
        )}
      </dl>

      {waiting && (
        <section>
          <h3 className="font-sans text-[1.125rem] font-bold">Avisos enviados</h3>
          {lastNotifications.length === 0 ? (
            <p className="text-muted">Nenhum aviso enviado ainda.</p>
          ) : (
            <ul className="mt-1 flex flex-col gap-1 text-[1rem]">
              {lastNotifications.map((n, i) => (
                <li key={i} className={n.status === "failed" ? "text-alert" : "text-leaf-dark"}>
                  {n.status === "sent" ? "Enviado" : "Falhou"} por {n.channel === "whatsapp" ? "WhatsApp" : "email"}{" "}
                  {relativeDate(n.created_at)}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {mode === "pickup" && (
        <form
          className="flex flex-col gap-4 rounded-card bg-leaf-soft p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => api.post(`/admin/packages/${pkg.id}/pickup`, pickup), true);
          }}
        >
          <Field
            label="Código que o morador mostrou"
            hint="Opcional. Se preencher, o sistema confere."
            inputMode="numeric"
            maxLength={6}
            value={pickup.pickup_code}
            onChange={(e) => setPickup({ ...pickup, pickup_code: e.target.value.replace(/\D/g, "") })}
            error={errors.pickup_code}
            autoFocus
          />
          <Field
            label="Quem retirou"
            hint="Deixe em branco se foi o próprio morador."
            value={pickup.picked_up_by_name}
            onChange={(e) => setPickup({ ...pickup, picked_up_by_name: e.target.value })}
          />
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            <IconCheck />
            {busy ? "Confirmando…" : "Confirmar entrega"}
          </button>
          <button type="button" className="btn-secondary w-full" onClick={() => setMode("view")}>
            Cancelar
          </button>
        </form>
      )}

      {mode === "delete" && (
        <div className="flex flex-col gap-3 rounded-card bg-alert-soft p-4">
          <p className="font-bold text-alert">Apagar este registro? Use só se foi cadastrado por engano.</p>
          <button
            type="button"
            className="btn w-full bg-alert text-white"
            disabled={busy}
            onClick={() => void run(() => api.delete(`/admin/packages/${pkg.id}`), true)}
          >
            Apagar registro
          </button>
          <button type="button" className="btn-secondary w-full" onClick={() => setMode("view")}>
            Cancelar
          </button>
        </div>
      )}

      {mode === "view" && (
        <div className="flex flex-col gap-3">
          {waiting ? (
            <>
              <button type="button" className="btn-primary w-full" onClick={() => setMode("pickup")}>
                <IconCheck />
                Entregar ao morador
              </button>
              <button
                type="button"
                className="btn-secondary w-full"
                disabled={busy}
                onClick={() => void run(() => api.post(`/admin/packages/${pkg.id}/notify`))}
              >
                <IconBell size={22} />
                Reenviar aviso
              </button>
              {pkg.whatsapp_link && (
                <a href={pkg.whatsapp_link} target="_blank" rel="noreferrer" className="btn-whatsapp w-full">
                  <IconWhatsApp />
                  Avisar pelo meu WhatsApp
                </a>
              )}
            </>
          ) : (
            <button
              type="button"
              className="btn-secondary w-full"
              disabled={busy}
              onClick={() => void run(() => api.post(`/admin/packages/${pkg.id}/undo-pickup`))}
            >
              Desfazer entrega (marcada por engano)
            </button>
          )}
          <button type="button" className="btn-link self-center text-alert" onClick={() => setMode("delete")}>
            Apagar registro
          </button>
        </div>
      )}
    </div>
  );
}

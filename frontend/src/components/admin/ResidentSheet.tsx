import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage, fieldErrors } from "../../lib/api";
import { maskPhone, plural, relativeDate, whatsappChatLink } from "../../lib/format";
import { toast } from "../../lib/toast";
import type { Membership } from "../../lib/types";
import { IconBox, IconCheck, IconWhatsApp } from "../Icons";
import Sheet from "../Sheet";
import { Field, Notice, PhoneField, Toggle } from "../ui";

export default function ResidentSheet({
  resident,
  onClose,
  onChanged,
  currentUserId,
}: {
  resident: Membership | null;
  onClose: () => void;
  onChanged: () => void;
  currentUserId: number;
}) {
  return (
    <Sheet open={resident !== null} onClose={onClose} title={resident?.user?.name ?? "Morador"}>
      {resident && <ResidentDetails resident={resident} onClose={onClose} onChanged={onChanged} isMe={resident.user?.id === currentUserId} />}
    </Sheet>
  );
}

function ResidentDetails({
  resident,
  onClose,
  onChanged,
  isMe,
}: {
  resident: Membership;
  onClose: () => void;
  onChanged: () => void;
  isMe: boolean;
}) {
  const user = resident.user!;
  const [mode, setMode] = useState<"view" | "edit" | "reject" | "remove">("view");
  const [form, setForm] = useState({
    name: user.name,
    phone: maskPhone(user.phone),
    email: user.email ?? "",
    unit: resident.unit ?? "",
    admin: resident.role === "admin",
  });
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<{ data: { message: string } }>) {
    setBusy(true);
    setErrors({});
    try {
      const { data } = await action();
      toast(data.message);
      onChanged();
      onClose();
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      if (Object.keys(fe).length === 0 || fe.role || fe.membership) toast(errorMessage(err), "error");
      setBusy(false);
    }
  }

  function saveEdit(e: FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = { unit: form.unit || null, role: form.admin ? "admin" : "resident" };
    // Dados pessoais só quando a pessoa ainda não criou acesso próprio
    if (!user.has_access) Object.assign(payload, { name: form.name, phone: form.phone, email: form.email || null });
    void run(() => api.patch(`/admin/residents/${resident.id}`, payload));
  }

  if (resident.status === "pending") {
    return (
      <div className="flex flex-col gap-4">
        <InfoList resident={resident} />
        <Notice tone="warning">Pediu para entrar {relativeDate(resident.created_at)}. Confirme se a pessoa mora na comunidade.</Notice>
        {mode === "reject" ? (
          <>
            <Field label="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} hint="A pessoa vê esse motivo." />
            <button
              type="button"
              className="btn w-full bg-alert text-white"
              disabled={busy}
              onClick={() => void run(() => api.post(`/admin/residents/${resident.id}/reject`, { rejection_reason: reason || null }))}
            >
              Recusar cadastro
            </button>
            <button type="button" className="btn-secondary w-full" onClick={() => setMode("view")}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn-primary w-full"
              disabled={busy}
              onClick={() => void run(() => api.post(`/admin/residents/${resident.id}/approve`))}
            >
              <IconCheck />
              Confirmar morador
            </button>
            <button type="button" className="btn-danger w-full" onClick={() => setMode("reject")}>
              Recusar
            </button>
          </>
        )}
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <form onSubmit={saveEdit} className="flex flex-col gap-5" noValidate>
        {user.has_access && <Notice>Nome, telefone e email agora são editados pela própria pessoa, em “Meus dados”.</Notice>}
        <Field
          label="Nome"
          value={form.name}
          disabled={user.has_access}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
        />
        <PhoneField
          label="WhatsApp"
          value={form.phone}
          disabled={user.has_access}
          onChange={(phone) => setForm({ ...form, phone })}
          error={errors.phone}
        />
        <Field
          label="Email"
          type="email"
          value={form.email}
          disabled={user.has_access}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />
        <Field label="Casa, rua ou apartamento" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} error={errors.unit} />
        <Toggle
          label="Faz parte da administração"
          description="Pode registrar encomendas e cuidar dos moradores."
          checked={form.admin}
          onChange={(admin) => setForm({ ...form, admin })}
        />
        {errors.role && <Notice tone="error">{errors.role}</Notice>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" className="btn-secondary w-full" onClick={() => setMode("view")}>
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <InfoList resident={resident} />

      {mode === "remove" ? (
        <div className="flex flex-col gap-3 rounded-card bg-alert-soft p-4">
          <p className="font-bold text-alert">
            Remover {user.first_name} da associação? O histórico de encomendas continua guardado.
          </p>
          <button
            type="button"
            className="btn w-full bg-alert text-white"
            disabled={busy}
            onClick={() => void run(() => api.delete(`/admin/residents/${resident.id}`))}
          >
            Remover
          </button>
          <button type="button" className="btn-secondary w-full" onClick={() => setMode("view")}>
            Cancelar
          </button>
        </div>
      ) : (
        <>
          <Link to={`/painel/nova?morador=${resident.id}`} className="btn-primary w-full">
            <IconBox />
            Registrar encomenda
          </Link>
          <a href={whatsappChatLink(user.phone)} target="_blank" rel="noreferrer" className="btn-whatsapp w-full">
            <IconWhatsApp />
            Chamar no WhatsApp
          </a>
          <button type="button" className="btn-secondary w-full" onClick={() => setMode("edit")}>
            Editar dados
          </button>
          {!isMe && (
            <button type="button" className="btn-link self-center text-alert" onClick={() => setMode("remove")}>
              Remover da associação
            </button>
          )}
        </>
      )}
    </div>
  );
}

function InfoList({ resident }: { resident: Membership }) {
  const user = resident.user!;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
      <dt className="text-muted">WhatsApp</dt>
      <dd className="font-bold">{user.phone_formatted}</dd>
      {resident.unit && (
        <>
          <dt className="text-muted">Endereço</dt>
          <dd className="font-bold">{resident.unit}</dd>
        </>
      )}
      {user.email && (
        <>
          <dt className="text-muted">Email</dt>
          <dd className="break-all">{user.email}</dd>
        </>
      )}
      {resident.status === "approved" && (
        <>
          <dt className="text-muted">Esperando</dt>
          <dd>{resident.waiting_packages ? plural(resident.waiting_packages, "encomenda", "encomendas") : "nada"}</dd>
          <dt className="text-muted">Acesso</dt>
          <dd>{user.has_access ? "Já usa o site" : "Ainda não criou senha"}</dd>
        </>
      )}
      {resident.role === "admin" && (
        <>
          <dt className="text-muted">Papel</dt>
          <dd>Administração</dd>
        </>
      )}
    </dl>
  );
}

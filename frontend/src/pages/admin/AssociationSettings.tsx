import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import { IconBox, IconRefresh, IconShare, IconUser, IconWhatsApp } from "../../components/Icons";
import { Page, PageHeader } from "../../components/Layout";
import { ErrorState, Field, Spinner } from "../../components/ui";
import api, { errorMessage, fieldErrors } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { toast } from "../../lib/toast";
import type { Association } from "../../lib/types";

export default function AssociationSettings() {
  const { data, error, reload } = useApi<Association>("/association");

  return (
    <Page>
      <PageHeader title="Ajustes" />
      {error && <ErrorState message={error} onRetry={reload} />}
      {!data && !error && <Spinner />}
      {data && <Settings key={data.id} association={data} />}
    </Page>
  );
}

function Settings({ association }: { association: Association }) {
  const { refresh, logout } = useAuth();
  const [current, setCurrent] = useState(association);
  const [form, setForm] = useState({
    name: association.name,
    pickup_hours: association.pickup_hours ?? "",
    address: association.address ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmNewCode, setConfirmNewCode] = useState(false);

  const code = current.invite_code ?? "";
  const inviteLink = `${window.location.origin}/cadastro?codigo=${code}`;
  const inviteText = `Agora as encomendas da ${current.name} são avisadas pelo WhatsApp! Faça seu cadastro: ${inviteLink} (código ${code})`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: current.name, text: inviteText });
      } catch {
        // pessoa cancelou o compartilhamento
      }
      return;
    }
    await navigator.clipboard.writeText(inviteText);
    toast("Convite copiado. Cole no grupo.");
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const { data } = await api.patch<{ message: string; association: Association }>("/admin/association", {
        name: form.name,
        pickup_hours: form.pickup_hours || null,
        address: form.address || null,
      });
      setCurrent(data.association);
      toast(data.message);
      void refresh();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  async function newCode() {
    try {
      const { data } = await api.post<{ message: string; association: Association }>("/admin/association/invite-code");
      setCurrent(data.association);
      setConfirmNewCode(false);
      toast(data.message);
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="invite-title" className="overflow-hidden rounded-card border border-line bg-white">
        <div className="p-5">
          <h2 id="invite-title" className="text-[1.375rem] font-semibold">
            Convide os moradores
          </h2>
          <p className="mt-1 text-muted">Com este código cada morador faz o próprio cadastro. Você confirma depois.</p>
        </div>
        <div className="border-y-[3px] border-dashed border-ink/30 bg-sun px-5 py-5 text-center">
          <span className="block text-[0.9375rem] font-bold">Código da associação</span>
          <span className="ticket-code mt-1 block text-[2.75rem] tracking-[0.18em]">{code}</span>
        </div>
        <div className="flex flex-col gap-3 p-5">
          <a href={`https://wa.me/?text=${encodeURIComponent(inviteText)}`} target="_blank" rel="noreferrer" className="btn-whatsapp w-full">
            <IconWhatsApp />
            Mandar no grupo do WhatsApp
          </a>
          <button type="button" className="btn-secondary w-full" onClick={() => void share()}>
            <IconShare size={22} />
            Compartilhar ou copiar
          </button>
          {confirmNewCode ? (
            <div className="rounded-btn bg-alert-soft p-4">
              <p className="font-bold text-alert">O código atual vai parar de funcionar. Quem já se cadastrou não é afetado.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" className="btn flex-1 bg-alert text-white" onClick={() => void newCode()}>
                  Gerar novo
                </button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setConfirmNewCode(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn-link self-center" onClick={() => setConfirmNewCode(true)}>
              <IconRefresh size={18} />
              Gerar outro código
            </button>
          )}
        </div>
      </section>

      <form onSubmit={save} className="card flex flex-col gap-5 p-5" noValidate>
        <h2 className="text-[1.375rem] font-semibold">Dados da associação</h2>
        <Field label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
        <Field
          label="Horário de retirada"
          hint="Vai junto no aviso para o morador."
          placeholder="Seg a sex, 8h às 18h"
          value={form.pickup_hours}
          onChange={(e) => setForm({ ...form, pickup_hours: e.target.value })}
          error={errors.pickup_hours}
        />
        <Field label="Endereço da sede" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} error={errors.address} />
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </form>

      <nav aria-label="Sua conta" className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white">
        <Link to="/perfil" className="flex min-h-[60px] items-center gap-3 px-4 font-bold hover:bg-paper">
          <IconUser /> Meus dados e senha
        </Link>
        <Link to="/minhas" className="flex min-h-[60px] items-center gap-3 px-4 font-bold hover:bg-paper">
          <IconBox /> Minhas encomendas
        </Link>
      </nav>

      <button type="button" className="btn-danger w-full" onClick={() => void logout()}>
        Sair da conta
      </button>
    </div>
  );
}

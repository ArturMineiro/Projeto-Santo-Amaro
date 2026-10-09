import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../auth/authContext";
import { Page, PageHeader } from "../components/Layout";
import { Field, Notice, PhoneField, Toggle } from "../components/ui";
import api, { errorMessage, fieldErrors } from "../lib/api";
import { maskPhone } from "../lib/format";
import type { Session } from "../lib/types";
import { toast } from "../lib/toast";

export default function Profile() {
  const { session, membership, updateSession, logout } = useAuth();
  const user = session!.user;

  const [form, setForm] = useState({
    name: user.name,
    phone: maskPhone(user.phone),
    email: user.email ?? "",
    notify_whatsapp: user.notify_whatsapp,
    notify_email: user.notify_email,
  });
  const [pass, setPass] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<"" | "data" | "password">("");

  async function save(payload: object, kind: "data" | "password") {
    setSaving(kind);
    setErrors({});
    try {
      const { data } = await api.patch<Session & { message: string }>("/auth/profile", payload);
      updateSession(data);
      toast(kind === "password" ? "Senha trocada." : "Dados salvos.");
      if (kind === "password") setPass({ current_password: "", password: "", password_confirmation: "" });
    } catch (err) {
      setErrors(fieldErrors(err));
      if (Object.keys(fieldErrors(err)).length === 0) toast(errorMessage(err), "error");
    } finally {
      setSaving("");
    }
  }

  function onSubmitData(e: FormEvent) {
    e.preventDefault();
    void save({ ...form, email: form.email || null }, "data");
  }

  function onSubmitPassword(e: FormEvent) {
    e.preventDefault();
    void save(pass, "password");
  }

  const noChannel = !form.notify_whatsapp && (!form.notify_email || !form.email);

  return (
    <Page>
      <PageHeader title="Meus dados" back />

      <form onSubmit={onSubmitData} className="card flex flex-col gap-5 p-5" noValidate>
        <Field label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
        <PhoneField label="WhatsApp" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} error={errors.phone} />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          hint="Opcional. Usado se o WhatsApp falhar."
        />

        <div className="border-t border-line pt-3">
          <h2 className="mb-1 text-[1.25rem] font-semibold">Como quer ser avisado</h2>
          <Toggle
            label="WhatsApp"
            description="Mensagem quando sua encomenda chegar."
            checked={form.notify_whatsapp}
            onChange={(v) => setForm({ ...form, notify_whatsapp: v })}
          />
          <Toggle
            label="Email"
            description={form.email ? form.email : "Cadastre um email acima para usar."}
            checked={form.notify_email}
            onChange={(v) => setForm({ ...form, notify_email: v })}
          />
          {noChannel && (
            <Notice tone="warning">Sem nenhum aviso ligado, você só vai saber das encomendas abrindo o site.</Notice>
          )}
        </div>

        <button type="submit" className="btn-primary w-full" disabled={saving === "data"}>
          {saving === "data" ? "Salvando…" : "Salvar dados"}
        </button>
      </form>

      <form onSubmit={onSubmitPassword} className="card mt-5 flex flex-col gap-5 p-5" noValidate>
        <h2 className="text-[1.25rem] font-semibold">Trocar senha</h2>
        <Field
          label="Senha atual"
          type="password"
          autoComplete="current-password"
          value={pass.current_password}
          onChange={(e) => setPass({ ...pass, current_password: e.target.value })}
          error={errors.current_password}
        />
        <Field
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          value={pass.password}
          onChange={(e) => setPass({ ...pass, password: e.target.value })}
          error={errors.password}
        />
        <Field
          label="Repita a nova senha"
          type="password"
          autoComplete="new-password"
          value={pass.password_confirmation}
          onChange={(e) => setPass({ ...pass, password_confirmation: e.target.value })}
        />
        <button type="submit" className="btn-secondary w-full" disabled={saving === "password" || !pass.password}>
          {saving === "password" ? "Trocando…" : "Trocar senha"}
        </button>
      </form>

      {membership && (
        <p className="mt-6 text-center text-muted">
          Você faz parte da {membership.association?.name}
          {membership.unit ? ` (${membership.unit})` : ""}.
        </p>
      )}
      <button type="button" className="btn-danger mt-4 w-full" onClick={() => void logout()}>
        Sair da conta
      </button>
    </Page>
  );
}

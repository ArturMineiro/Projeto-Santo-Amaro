import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import AuthShell from "../components/AuthShell";
import { Field, Notice, PhoneField } from "../components/ui";
import api, { errorMessage, fieldErrors } from "../lib/api";
import type { SessionResponse } from "../lib/types";

export default function RegisterAssociation() {
  const { applySession } = useAuth();
  const [form, setForm] = useState({
    association_name: "",
    pickup_hours: "",
    address: "",
    name: "",
    phone: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setErrors({});
    setError("");
    try {
      const { data } = await api.post<SessionResponse>("/auth/register-association", form);
      applySession(data);
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
      setSending(false);
    }
  }

  return (
    <AuthShell title="Cadastre sua associação" intro="Depois é só passar o código para os moradores.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && Object.keys(errors).length === 0 && <Notice tone="error">{error}</Notice>}

        <fieldset className="flex flex-col gap-5">
          <legend className="mb-4 font-display text-[1.375rem] font-semibold">A associação</legend>
          <Field
            label="Nome da associação"
            placeholder="Associação de Moradores…"
            value={form.association_name}
            onChange={(e) => set("association_name")(e.target.value)}
            error={errors.association_name}
            required
          />
          <Field
            label="Horário de retirada"
            hint="Vai junto no aviso para o morador."
            placeholder="Seg a sex, 8h às 18h"
            value={form.pickup_hours}
            onChange={(e) => set("pickup_hours")(e.target.value)}
            error={errors.pickup_hours}
          />
          <Field label="Endereço da sede" value={form.address} onChange={(e) => set("address")(e.target.value)} error={errors.address} />
        </fieldset>

        <fieldset className="flex flex-col gap-5 border-t border-line pt-5">
          <legend className="mb-4 pt-5 font-display text-[1.375rem] font-semibold">Quem vai cuidar</legend>
          <Field label="Seu nome" autoComplete="name" value={form.name} onChange={(e) => set("name")(e.target.value)} error={errors.name} required />
          <PhoneField label="Seu WhatsApp" hint="Você entra com ele." value={form.phone} onChange={set("phone")} error={errors.phone} required />
          <Field
            label="Email (se tiver)"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
            error={errors.email}
          />
          <Field
            label="Crie uma senha"
            hint="Pelo menos 6 letras ou números."
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set("password")(e.target.value)}
            error={errors.password}
            required
          />
          <Field
            label="Repita a senha"
            type="password"
            autoComplete="new-password"
            value={form.password_confirmation}
            onChange={(e) => set("password_confirmation")(e.target.value)}
            required
          />
        </fieldset>

        <button type="submit" className="btn-primary w-full" disabled={sending}>
          {sending ? "Criando…" : "Criar associação"}
        </button>
        <p className="text-center text-[1rem] text-muted">
          Já tem cadastro?{" "}
          <Link to="/" className="btn-link">
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

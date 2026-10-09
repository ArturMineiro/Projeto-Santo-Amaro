import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import AuthShell from "../components/AuthShell";
import { IconCheck } from "../components/Icons";
import { Field, Notice, PhoneField } from "../components/ui";
import api, { errorMessage, fieldErrors } from "../lib/api";
import type { SessionResponse } from "../lib/types";

interface InviteInfo {
  name: string;
  pickup_hours: string | null;
}

async function fetchInvite(code: string): Promise<InviteInfo> {
  const { data } = await api.get<InviteInfo>(`/invites/${encodeURIComponent(code.trim())}`);
  return data;
}

function inviteError(err: unknown): string {
  const message = errorMessage(err);
  return message === "Código não encontrado."
    ? "Não achamos esse código. Confira as letras com a administração da associação."
    : message;
}

/** Cadastro do morador. Passo 1: código da associação. Passo 2: dados. */
export default function RegisterResident() {
  const { applySession } = useAuth();
  const [params] = useSearchParams();
  const [code, setCode] = useState(() => (params.get("codigo") ?? "").toUpperCase());
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const linkCode = params.get("codigo");
  const [checking, setChecking] = useState(Boolean(linkCode));
  const [codeError, setCodeError] = useState("");

  const [form, setForm] = useState({ name: "", phone: "", unit: "", email: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function checkCode(value: string) {
    setChecking(true);
    setCodeError("");
    try {
      setInvite(await fetchInvite(value));
    } catch (err) {
      setCodeError(inviteError(err));
    } finally {
      setChecking(false);
    }
  }

  // Link de convite já traz o código: confere sozinho
  useEffect(() => {
    if (!linkCode) return;
    fetchInvite(linkCode)
      .then(setInvite)
      .catch((err) => setCodeError(inviteError(err)))
      .finally(() => setChecking(false));
  }, [linkCode]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setErrors({});
    setError("");
    try {
      const { data } = await api.post<SessionResponse>("/auth/register", { ...form, invite_code: code });
      applySession(data);
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
      setSending(false);
    }
  }

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  if (!invite) {
    return (
      <AuthShell title="Faça seu cadastro" intro="Leva menos de um minuto.">
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            void checkCode(code);
          }}
        >
          <Field
            label="Código da associação"
            hint="São 6 letras e números. A administração da associação te passa."
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12))}
            autoCapitalize="characters"
            autoComplete="off"
            className="input font-display text-[1.5rem] font-extrabold tracking-[0.2em]"
            error={codeError}
            required
          />
          <button type="submit" className="btn-primary w-full" disabled={checking || code.length < 4}>
            {checking ? "Conferindo…" : "Continuar"}
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

  return (
    <AuthShell title="Faça seu cadastro">
      <div className="mb-5 flex items-start gap-3 rounded-btn bg-leaf-soft p-4">
        <IconCheck className="mt-0.5 shrink-0 text-leaf" />
        <div>
          <p className="font-bold text-leaf-dark">{invite.name}</p>
          <button type="button" className="text-[1rem] text-leaf-dark underline" onClick={() => setInvite(null)}>
            Não é essa? Trocar código
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && Object.keys(errors).length === 0 && <Notice tone="error">{error}</Notice>}

        <Field label="Seu nome" autoComplete="name" value={form.name} onChange={(e) => set("name")(e.target.value)} error={errors.name} required />
        <PhoneField
          label="Seu WhatsApp"
          hint="É por ele que você vai receber os avisos."
          value={form.phone}
          onChange={set("phone")}
          error={errors.phone}
          required
        />
        <Field
          label="Casa, rua ou apartamento"
          hint="Ajuda a associação a achar você. Ex.: Casa 12, Rua B"
          value={form.unit}
          onChange={(e) => set("unit")(e.target.value)}
          error={errors.unit}
        />
        <Field
          label="Email (se tiver)"
          type="email"
          inputMode="email"
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

        <button type="submit" className="btn-primary w-full" disabled={sending}>
          {sending ? "Enviando…" : "Concluir cadastro"}
        </button>
      </form>
    </AuthShell>
  );
}

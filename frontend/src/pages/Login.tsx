import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import AuthShell from "../components/AuthShell";
import { Field, Notice } from "../components/ui";
import { errorMessage } from "../lib/api";
import { maskPhone } from "../lib/format";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await login(form.login.trim(), form.password);
    } catch (err) {
      setError(errorMessage(err));
      setSending(false);
    }
  }

  // Aceita telefone (com máscara) ou email no mesmo campo
  function onLoginChange(value: string) {
    const looksLikePhone = /^[\d\s()+-]*$/.test(value) && value.replace(/\D/g, "").length > 0;
    setForm({ ...form, login: looksLikePhone ? maskPhone(value) : value });
  }

  return (
    <AuthShell title="Suas encomendas, sem perder mensagem no grupo." intro="Quando algo chegar na associação, você recebe o aviso no WhatsApp.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <h2 className="text-[1.5rem] font-semibold">Entrar</h2>
        {error && <Notice tone="error">{error}</Notice>}

        <Field
          label="Seu WhatsApp"
          hint="Também pode usar seu email."
          inputMode="tel"
          autoComplete="username"
          placeholder="(11) 99999-8888"
          value={form.login}
          onChange={(e) => onLoginChange(e.target.value)}
          required
        />
        <Field
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button type="submit" className="btn-primary w-full" disabled={sending || !form.login || !form.password}>
          {sending ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <div className="mt-6 border-t border-line pt-5">
        <p className="font-bold">Primeira vez aqui?</p>
        <p className="text-muted">Peça o código da sua associação e faça seu cadastro.</p>
        <Link to="/cadastro" className="btn-secondary mt-3 w-full">
          Fazer meu cadastro
        </Link>
        <p className="mt-5 text-center text-[1rem] text-muted">
          Cuida de uma associação?{" "}
          <Link to="/criar-associacao" className="btn-link">
            Cadastre a associação
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

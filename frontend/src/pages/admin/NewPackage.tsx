import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NewResidentSheet from "../../components/admin/NewResidentSheet";
import { IconBell, IconCheck, IconPlus, IconSearch, IconWhatsApp, PackageTypeIcon } from "../../components/Icons";
import { Page, PageHeader } from "../../components/Layout";
import Ticket from "../../components/Ticket";
import { ErrorState, Field, Notice, Spinner, Toggle } from "../../components/ui";
import api, { errorMessage } from "../../lib/api";
import { useApi } from "../../lib/hooks";
import { toast } from "../../lib/toast";
import type { Membership, Package, PackageType } from "../../lib/types";

const TYPES: { value: PackageType; label: string }[] = [
  { value: "package", label: "Pacote" },
  { value: "letter", label: "Carta" },
  { value: "document", label: "Documento" },
  { value: "other", label: "Outro" },
];

const CARRIERS = ["Correios", "Mercado Livre", "Shopee", "Amazon", "Magalu"];

/** Sem acento e minúsculo, para "jose" achar "José". */
function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Fluxo principal da associação, pensado para poucos toques:
 * 1) quem é o morador  2) o que chegou  3) pronto, aviso enviado.
 */
export default function NewPackage() {
  const [params, setParams] = useSearchParams();
  const residents = useApi<{ data: Membership[] }>("/admin/residents");
  const [selectedId, setSelectedId] = useState<number | null>(() => Number(params.get("morador")) || null);
  const [created, setCreated] = useState<Package | null>(null);

  const selected = residents.data?.data.find((m) => m.id === selectedId) ?? null;

  function restart() {
    setCreated(null);
    setSelectedId(null);
    setParams({}, { replace: true });
  }

  if (created) return <Done pkg={created} onAnother={restart} />;

  return (
    <Page>
      <PageHeader title="Chegou encomenda" subtitle={selected ? "O que chegou?" : "Para quem é?"} back={selected ? false : "/painel"} />

      {!residents.data && residents.loading && <Spinner />}
      {residents.error && <ErrorState message={residents.error} onRetry={residents.reload} />}

      {residents.data &&
        (selected ? (
          <PackageForm resident={selected} onChange={() => setSelectedId(null)} onCreated={setCreated} />
        ) : (
          <ResidentPicker
            residents={residents.data.data}
            onPick={(m) => setSelectedId(m.id)}
            onCreated={(m) => {
              residents.reload();
              setSelectedId(m.id);
            }}
          />
        ))}
    </Page>
  );
}

function ResidentPicker({
  residents,
  onPick,
  onCreated,
}: {
  residents: Membership[];
  onPick: (m: Membership) => void;
  onCreated: (m: Membership) => void;
}) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    const digits = query.replace(/\D/g, "");
    if (!q) return residents;
    return residents.filter(
      (m) =>
        normalize(m.user?.name ?? "").includes(q) ||
        normalize(m.unit ?? "").includes(q) ||
        (digits.length >= 3 && (m.user?.phone ?? "").includes(digits)),
    );
  }, [query, residents]);

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 bg-paper px-4 pb-3 pt-1">
        <label htmlFor="resident-search" className="sr-only">
          Buscar morador
        </label>
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="resident-search"
            type="search"
            className="input pl-12"
            placeholder="Nome, casa ou telefone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            autoComplete="off"
          />
        </div>
      </div>

      {results.length > 0 ? (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white">
          {results.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => onPick(m)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-leaf-soft font-display text-[1.25rem] font-extrabold text-leaf-dark">
                  {m.user?.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{m.user?.name}</span>
                  <span className="block truncate text-[1rem] text-muted">{[m.unit, m.user?.phone_formatted].filter(Boolean).join(", ")}</span>
                </span>
                {!!m.waiting_packages && (
                  <span className="rounded-full bg-sun-soft px-2.5 py-1 text-[0.875rem] font-bold text-sun-dark">{m.waiting_packages} esperando</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-center text-muted">Ninguém com “{query}” na lista.</p>
      )}

      <button type="button" className="btn-secondary mt-4 w-full" onClick={() => setAdding(true)}>
        <IconPlus />
        Cadastrar morador novo
      </button>

      <NewResidentSheet
        open={adding}
        initialName={/\d/.test(query) ? "" : query}
        onClose={() => setAdding(false)}
        onCreated={(m) => {
          setAdding(false);
          onCreated(m);
        }}
      />
    </>
  );
}

function PackageForm({ resident, onChange, onCreated }: { resident: Membership; onChange: () => void; onCreated: (p: Package) => void }) {
  const [form, setForm] = useState({ type: "package" as PackageType, description: "", carrier: "", tracking_code: "", notify: true });
  const [more, setMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const user = resident.user!;

  async function submit() {
    setSending(true);
    setError("");
    try {
      const { data } = await api.post<{ message: string; package: Package }>("/admin/packages", {
        membership_id: resident.id,
        type: form.type,
        description: form.description || null,
        carrier: form.carrier || null,
        tracking_code: form.tracking_code || null,
        notify: form.notify,
      });
      onCreated(data.package);
    } catch (err) {
      setError(errorMessage(err));
      setSending(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="flex items-center gap-3 rounded-card border border-line bg-white p-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-leaf font-display text-[1.25rem] font-extrabold text-white">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">{user.name}</span>
          <span className="block truncate text-[1rem] text-muted">{[resident.unit, user.phone_formatted].filter(Boolean).join(", ")}</span>
        </span>
        <button type="button" className="btn-link" onClick={onChange}>
          Trocar
        </button>
      </div>

      <fieldset>
        <legend className="label">O que chegou?</legend>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <label
              key={t.value}
              className={`flex min-h-[64px] cursor-pointer items-center gap-3 rounded-btn border-2 px-4 font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-leaf-dark ${
                form.type === t.value ? "border-leaf bg-leaf-soft text-leaf-dark" : "border-line bg-white"
              }`}
            >
              <input
                type="radio"
                name="type"
                value={t.value}
                checked={form.type === t.value}
                onChange={() => setForm({ ...form, type: t.value })}
                className="sr-only"
              />
              <PackageTypeIcon type={t.value} />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        label="Descrição (opcional)"
        placeholder="Ex.: caixa média, envelope pardo"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        maxLength={255}
      />

      <fieldset>
        <legend className="label">Quem entregou (opcional)</legend>
        <div className="flex flex-wrap gap-2">
          {CARRIERS.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={form.carrier === c}
              onClick={() => setForm({ ...form, carrier: form.carrier === c ? "" : c })}
              className={`min-h-[48px] rounded-full border-2 px-4 font-bold ${
                form.carrier === c ? "border-leaf bg-leaf text-white" : "border-line bg-white text-ink"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </fieldset>

      {more ? (
        <Field
          label="Código de rastreio"
          value={form.tracking_code}
          onChange={(e) => setForm({ ...form, tracking_code: e.target.value })}
          autoCapitalize="characters"
        />
      ) : (
        <button type="button" className="btn-link self-start" onClick={() => setMore(true)}>
          Adicionar código de rastreio
        </button>
      )}

      <div className="rounded-card border border-line bg-white px-4">
        <Toggle
          label={`Avisar ${user.first_name} agora`}
          description={user.notify_whatsapp ? "Por WhatsApp" + (user.email ? " (e email se falhar)" : "") : user.email ? "Por email" : "Sem WhatsApp nem email ativo"}
          checked={form.notify}
          onChange={(notify) => setForm({ ...form, notify })}
        />
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <button type="submit" className="btn-primary w-full text-[1.25rem]" disabled={sending}>
        <IconCheck />
        {sending ? "Registrando…" : form.notify ? `Registrar e avisar ${user.first_name}` : "Registrar"}
      </button>
    </form>
  );
}

function Done({ pkg, onAnother }: { pkg: Package; onAnother: () => void }) {
  const notifications = pkg.notifications ?? [];
  const sent = notifications.filter((n) => n.status === "sent");
  const whatsappOk = sent.some((n) => n.channel === "whatsapp");
  const emailOk = sent.some((n) => n.channel === "email");
  const name = pkg.resident?.first_name ?? "o morador";

  async function resend() {
    try {
      const { data } = await api.post<{ message: string }>(`/admin/packages/${pkg.id}/notify`);
      toast(data.message);
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  }

  return (
    <Page>
      <PageHeader title="Registrada!" subtitle={`Guarde junto da encomenda o código abaixo.`} />

      <Ticket pkg={pkg} title={pkg.resident?.name} subtitle={pkg.unit} className="stamp-in" />

      <div className="mt-5">
        {whatsappOk ? (
          <Notice tone="success">
            <span className="inline-flex items-center gap-2 font-bold">
              <IconWhatsApp /> {name} já recebeu o aviso no WhatsApp.
            </span>
          </Notice>
        ) : emailOk ? (
          <Notice tone="success">
            <span className="font-bold">Aviso enviado por email para {name}.</span>
          </Notice>
        ) : notifications.length > 0 ? (
          <Notice tone="error">O aviso automático não foi entregue. Avise pelo seu WhatsApp abaixo.</Notice>
        ) : (
          <Notice tone="warning">Nenhum aviso foi enviado.</Notice>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {pkg.whatsapp_link && !whatsappOk && (
          <a href={pkg.whatsapp_link} target="_blank" rel="noreferrer" className="btn-whatsapp w-full">
            <IconWhatsApp />
            Avisar pelo meu WhatsApp
          </a>
        )}
        <button type="button" className="btn-primary w-full" onClick={onAnother}>
          <IconPlus />
          Registrar outra
        </button>
        {!whatsappOk && notifications.length > 0 && (
          <button type="button" className="btn-secondary w-full" onClick={() => void resend()}>
            <IconBell size={22} />
            Tentar aviso automático de novo
          </button>
        )}
        <Link to="/painel" className="btn-secondary w-full">
          Voltar ao início
        </Link>
      </div>
    </Page>
  );
}

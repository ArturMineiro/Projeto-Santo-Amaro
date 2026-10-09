import { useState } from "react";
import type { FormEvent } from "react";
import api, { errorMessage, fieldErrors } from "../../lib/api";
import { toast } from "../../lib/toast";
import type { Membership } from "../../lib/types";
import Sheet from "../Sheet";
import { Field, Notice, PhoneField } from "../ui";

/** Cadastro rápido de morador feito pela administração (sem senha). */
export default function NewResidentSheet({
  open,
  onClose,
  onCreated,
  initialName = "",
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (membership: Membership) => void;
  initialName?: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Novo morador">
      <NewResidentForm onCreated={onCreated} initialName={initialName} />
    </Sheet>
  );
}

function NewResidentForm({ onCreated, initialName }: { onCreated: (m: Membership) => void; initialName: string }) {
  const [form, setForm] = useState({ name: initialName, phone: "", unit: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setErrors({});
    try {
      const { data } = await api.post<{ message: string; resident: Membership }>("/admin/residents", {
        ...form,
        email: form.email || null,
      });
      toast(data.message);
      onCreated(data.resident);
    } catch (err) {
      setErrors(fieldErrors(err));
      if (Object.keys(fieldErrors(err)).length === 0) toast(errorMessage(err), "error");
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <Notice>A pessoa já fica confirmada e passa a receber avisos. Se quiser, depois ela cria a senha com o código da associação.</Notice>
      <Field label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} autoFocus required />
      <PhoneField label="WhatsApp" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} error={errors.phone} required />
      <Field
        label="Casa, rua ou apartamento"
        value={form.unit}
        onChange={(e) => setForm({ ...form, unit: e.target.value })}
        error={errors.unit}
      />
      <Field
        label="Email (se tiver)"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        error={errors.email}
      />
      <button type="submit" className="btn-primary w-full" disabled={sending}>
        {sending ? "Salvando…" : "Cadastrar morador"}
      </button>
    </form>
  );
}

import { useId, useSyncExternalStore } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { maskPhone } from "../lib/format";
import { dismissToast, toastStore } from "../lib/toast";
import { IconCheck, IconClose } from "./Icons";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Field({ label, hint, error, id, ...props }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div>
      <label htmlFor={inputId} className="label">
        {label}
      </label>
      <input id={inputId} className="input" aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...props} />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 font-bold text-alert" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-[1rem] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Campo de WhatsApp com máscara e teclado numérico. */
export function PhoneField({
  value,
  onChange,
  ...props
}: Omit<FieldProps, "value" | "onChange"> & { value: string; onChange: (value: string) => void }) {
  return (
    <Field
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      placeholder="(11) 99999-8888"
      value={value}
      onChange={(e) => onChange(maskPhone(e.target.value))}
      {...props}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex min-h-[56px] cursor-pointer items-center gap-4 py-2">
      <span className="flex-1">
        <span className="block font-bold">{label}</span>
        {description && <span className="block text-[1rem] text-muted">{description}</span>}
      </span>
      <input id={id} type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className="relative h-8 w-14 shrink-0 rounded-full bg-line transition-colors after:absolute after:left-1 after:top-1 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-leaf peer-checked:after:translate-x-6 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-leaf-dark"
      />
    </label>
  );
}

export function Spinner({ label = "Carregando" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-muted">
      <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-line border-t-leaf" aria-hidden />
      <span>{label}…</span>
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Spinner />
    </div>
  );
}

export function Notice({
  tone = "info",
  children,
  action,
}: {
  tone?: "info" | "warning" | "error" | "success";
  children: ReactNode;
  action?: ReactNode;
}) {
  const tones = {
    info: "bg-leaf-soft text-leaf-dark",
    success: "bg-leaf-soft text-leaf-dark",
    warning: "bg-sun-soft text-ink",
    error: "bg-alert-soft text-alert",
  };
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-btn px-4 py-3 ${tones[tone]}`} role={tone === "error" ? "alert" : undefined}>
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="px-2 py-10 text-center">
      <h2 className="text-[1.375rem] font-semibold">{title}</h2>
      {children && <p className="mx-auto mt-2 max-w-sm text-muted">{children}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="py-6">
      <Notice
        tone="error"
        action={
          <button type="button" className="btn-secondary min-h-[48px]" onClick={onRetry}>
            Tentar de novo
          </button>
        }
      >
        {message}
      </Notice>
    </div>
  );
}

export function Toaster() {
  const items = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))]"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-btn px-4 py-3 font-bold text-white shadow-lg ${
            t.kind === "error" ? "bg-alert" : "bg-ink"
          }`}
        >
          {t.kind === "success" && <IconCheck className="shrink-0 text-sun" />}
          <span className="flex-1">{t.message}</span>
          <button type="button" className="-m-2 p-2" aria-label="Fechar aviso" onClick={() => dismissToast(t.id)}>
            <IconClose size={20} />
          </button>
        </div>
      ))}
    </div>
  );
}

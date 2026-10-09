/** Avisos rápidos ("Entrega confirmada."). Store mínima, sem dependências. */
export type ToastKind = "success" | "error";
export interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function toast(message: string, kind: ToastKind = "success") {
  const id = nextId++;
  items = [...items, { id, message, kind }];
  emit();
  setTimeout(() => dismissToast(id), kind === "error" ? 6000 : 3500);
}

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export function clearToasts() {
  items = [];
  emit();
}

export const toastStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => items,
};

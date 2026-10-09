/** Máscara enquanto digita: "11999998888" -> "(11) 99999-8888" */
export function maskPhone(value: string): string {
  let d = value.replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  d = d.slice(0, 11);

  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });
const fullFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" });

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "hoje às 14:30", "ontem às 9:10", "há 3 dias", "12 de mar." */
export function relativeDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);

  if (days <= 0) return `hoje às ${timeFmt.format(date)}`;
  if (days === 1) return `ontem às ${timeFmt.format(date)}`;
  if (days < 7) return `há ${days} dias`;
  return dateFmt.format(date);
}

export function fullDate(iso: string | null | undefined): string {
  return iso ? fullFmt.format(new Date(iso)) : "";
}

/** Dias desde a data (para destacar quem espera há muito tempo). */
export function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function whatsappChatLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

import { createHmac, timingSafeEqual } from "node:crypto";




// Reject stale deliveries and compare HMAC digests in constant time.
export const MAX_ALTER_SEK = 300;


export function zerlegeSignatur(kopf: string): { t: number; v1: string } | null {
  const teile: Record<string, string> = {};
  for (const stueck of kopf.split(",")) {
    const [k, v] = stueck.trim().split("=");
    if (k && v) teile[k] = v;
  }
  const t = Number(teile.t);
  if (!Number.isFinite(t) || !teile.v1) return null;
  return { t, v1: teile.v1 };
}


export function pruefeZustellung(
  kopf: string | undefined,
  rumpf: string,
  geheimnis: string,
  jetztSek: number,
): string | null {
  if (!kopf) return "The signature header is missing.";
  const zerlegt = zerlegeSignatur(kopf);
  if (!zerlegt) return "The signature header must use the format t=...,v1=...";

  if (Math.abs(jetztSek - zerlegt.t) > MAX_ALTER_SEK) {
    return `The delivery timestamp is outside the ${MAX_ALTER_SEK}-second acceptance window.`;
  }

  const erwartet = createHmac("sha256", geheimnis).update(`${zerlegt.t}.${rumpf}`).digest("hex");


  const a = Buffer.from(erwartet, "hex");
  const b = Buffer.from(zerlegt.v1, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return "The signature does not match this delivery.";
  }
  return null;
}

import { createHmac, timingSafeEqual } from "node:crypto";

/* Prüfung der DocuFleet-Signatur — bewusst OHNE jeden n8n-Import.
 *
 * Diese Trennung hat genau einen Grund: So lässt sich der sicherheitskritische
 * Teil des Auslösers im gewöhnlichen Testlauf prüfen, ohne dass dafür das
 * n8n-SDK installiert sein muss. Der Knoten daneben ist dann nur noch Verdrahtung.
 *
 * Die Gegenseite steht in `src/lib/webhooks.ts` (signaturBasis /
 * signaturHeaderWert). Ändert sich dort das Format, ändert es sich hier mit —
 * die Tests halten beide Seiten aneinander.
 */

/** Wie alt eine Zustellung höchstens sein darf. Fünf Minuten decken Laufzeit und
 *  Uhrenversatz ab, ohne ein brauchbares Zeitfenster fürs Wiedereinspielen zu
 *  lassen. */
export const MAX_ALTER_SEK = 300;

/** Zerlegt `t=…,v1=…`. Null, wenn die Kopfzeile nicht die erwartete Form hat. */
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

/**
 * Signatur und Alter prüfen. Rückgabe ist der Grund der Ablehnung — oder null,
 * wenn die Zustellung echt ist.
 *
 * ⛔ DER ZEITSTEMPEL WIRD MITGEPRÜFT, nicht bloß mitgelesen. Er steht im
 * signierten Text; ohne Altersprüfung ließe sich eine einmal abgefangene
 * Zustellung beliebig oft erneut einspielen, mit gültiger Signatur.
 */
export function pruefeZustellung(
  kopf: string | undefined,
  rumpf: string,
  geheimnis: string,
  jetztSek: number,
): string | null {
  if (!kopf) return "Die Signatur-Kopfzeile fehlt.";
  const zerlegt = zerlegeSignatur(kopf);
  if (!zerlegt) return "Die Signatur-Kopfzeile hat nicht die Form t=…,v1=…";

  if (Math.abs(jetztSek - zerlegt.t) > MAX_ALTER_SEK) {
    return `Die Zustellung ist älter als ${MAX_ALTER_SEK} Sekunden — sie wird abgewiesen, damit sie sich nicht erneut einspielen lässt.`;
  }

  const erwartet = createHmac("sha256", geheimnis).update(`${zerlegt.t}.${rumpf}`).digest("hex");

  /* Zeitgleicher Vergleich: Ein gewöhnliches === verriete über die Laufzeit, wie
     viele Zeichen stimmen — daraus ließe sich die Signatur Zeichen für Zeichen
     erraten. Die Längenprüfung davor ist nötig, weil timingSafeEqual bei
     ungleicher Länge wirft; sie verrät nur die Länge, und die ist ohnehin fest. */
  const a = Buffer.from(erwartet, "hex");
  const b = Buffer.from(zerlegt.v1, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return "Die Signatur stimmt nicht — das Geheimnis passt nicht zu dieser Zustellung.";
  }
  return null;
}

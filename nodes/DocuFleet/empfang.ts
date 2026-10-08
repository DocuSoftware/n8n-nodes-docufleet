import { pruefeZustellung } from "./signatur";

/** Immer den geprüften Rohtext parsen, niemals einen zweiten Request-Body. */
export function empfangeZustellung(
  roh: unknown,
  kopf: unknown,
  geheimnis: unknown,
  jetztSek: number,
): Record<string, unknown> {
  if (typeof geheimnis !== "string" || !geheimnis.trim()) {
    throw new Error("Das Signaturgeheimnis fehlt. Hinterlegen Sie den Zugang für dieses Webhook-Ziel.");
  }
  const text = Buffer.isBuffer(roh) ? roh.toString("utf8") : roh;
  if (typeof text !== "string" || !text) {
    throw new Error("Der unveränderte Anfrage-Rohtext fehlt. Die Zustellung wird nicht übernommen.");
  }
  const grund = pruefeZustellung(
    typeof kopf === "string" ? kopf : undefined, text, geheimnis, jetztSek,
  );
  if (grund) throw new Error(grund);

  let wert: unknown;
  try {
    wert = JSON.parse(text);
  } catch {
    throw new Error("Die signierte Zustellung enthält kein gültiges JSON.");
  }
  if (!wert || typeof wert !== "object" || Array.isArray(wert)) {
    throw new Error("Die signierte Zustellung enthält kein Ereignis.");
  }
  const daten = wert as Record<string, unknown>;
  if (
    typeof daten.ereignis !== "string" || !daten.ereignis ||
    typeof daten.zustellung_id !== "string" || !daten.zustellung_id ||
    !daten.daten || typeof daten.daten !== "object" || Array.isArray(daten.daten)
  ) {
    throw new Error("Ereignis, Zustellkennung oder Daten fehlen in der signierten Zustellung.");
  }
  return daten;
}

import { pruefeZustellung } from "./signatur";


export function empfangeZustellung(
  roh: unknown,
  kopf: unknown,
  geheimnis: unknown,
  jetztSek: number,
): Record<string, unknown> {
  if (typeof geheimnis !== "string" || !geheimnis.trim()) {
    throw new Error("The signing secret is missing. Configure the credentials for this webhook destination.");
  }
  const text = Buffer.isBuffer(roh) ? roh.toString("utf8") : roh;
  if (typeof text !== "string" || !text) {
    throw new Error("The unmodified request body is missing. The delivery was rejected.");
  }
  const grund = pruefeZustellung(
    typeof kopf === "string" ? kopf : undefined, text, geheimnis, jetztSek,
  );
  if (grund) throw new Error(grund);

  let wert: unknown;
  let parseError = false;
  try {
    wert = JSON.parse(text);
  } catch {
    parseError = true;
  }
  // The node wraps this sanitized helper error in NodeOperationError.
  if (parseError) throw new Error("The signed delivery does not contain valid JSON.");
  if (!wert || typeof wert !== "object" || Array.isArray(wert)) {
    throw new Error("The signed delivery does not contain an event.");
  }
  const daten = wert as Record<string, unknown>;
  if (
    typeof daten.ereignis !== "string" || !daten.ereignis ||
    typeof daten.zustellung_id !== "string" || !daten.zustellung_id ||
    !daten.daten || typeof daten.daten !== "object" || Array.isArray(daten.daten)
  ) {
    throw new Error("The signed delivery is missing its event, delivery ID, or data.");
  }
  return daten;
}

import type { INodeType, INodeTypeDescription } from "n8n-workflow";

/* Der DocuFleet-Knoten für n8n — beschreibend, ohne eigenen Ausführungscode.
 *
 * WARUM BESCHREIBEND („declarative"): Jede Aktion hier ist ein einzelner
 * REST-Aufruf. n8n baut ihn aus `routing` selbst zusammen, samt Fehlerbehandlung
 * und Blätterung. Eine eigene `execute`-Funktion wäre Code, den jemand pflegen
 * muss, um dasselbe zu tun — und der beim nächsten n8n-Wechsel bricht.
 *
 * DIE AUSWAHL IST BEWUSST KLEIN. Angeboten wird, was ein Fremdsystem
 * üblicherweise braucht: Bestand lesen, Kosten und Schäden hereingeben, Termine
 * eintragen. Nicht angeboten wird alles, was an einer Person hängt — die
 * Schnittstelle kennt dafür keinen Umfang, und das ist eine zugesagte
 * Eigenschaft, keine Lücke.
 */
export class DocuFleet implements INodeType {
  description: INodeTypeDescription = {
    displayName: "DocuFleet",
    name: "docuFleet",
    icon: "file:docufleet.svg",
    group: ["transform"],
    version: 1,
    subtitle: '={{$parameter["vorgang"] + ": " + $parameter["bereich"]}}',
    description: "Fuhrpark lesen und pflegen",
    defaults: { name: "DocuFleet" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "docuFleetApi", required: true }],
    requestDefaults: {
      baseURL: "={{$credentials.basisUrl}}/api/v1",
      headers: { "content-type": "application/json" },
    },
    properties: [
      {
        displayName: "Bereich",
        name: "bereich",
        type: "options",
        noDataExpression: true,
        options: [
          { name: "Fahrzeug", value: "fahrzeuge" },
          { name: "Vertrag", value: "vertraege" },
          { name: "Kosten", value: "kosten" },
          { name: "Schaden", value: "schaeden" },
          { name: "Termin", value: "termine" },
        ],
        default: "fahrzeuge",
      },

      /* ---- Vorgänge je Bereich ------------------------------------------- */
      {
        displayName: "Vorgang",
        name: "vorgang",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { bereich: ["fahrzeuge"] } },
        options: [
          {
            name: "Auflisten",
            value: "liste",
            action: "Fahrzeuge auflisten",
            routing: { request: { method: "GET", url: "/fahrzeuge" } },
          },
          {
            name: "Kilometerstand melden",
            value: "kmMelden",
            action: "Kilometerstand melden",
            routing: {
              request: {
                method: "PUT",
                url: '=/fahrzeuge/{{$parameter["objektId"]}}/kilometerstand',
              },
            },
          },
        ],
        default: "liste",
      },
      {
        displayName: "Vorgang",
        name: "vorgang",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { bereich: ["vertraege"] } },
        options: [
          {
            name: "Auflisten",
            value: "liste",
            action: "Vertraege auflisten",
            routing: { request: { method: "GET", url: "/vertraege" } },
          },
        ],
        default: "liste",
      },
      {
        displayName: "Vorgang",
        name: "vorgang",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { bereich: ["kosten"] } },
        options: [
          {
            name: "Auflisten",
            value: "liste",
            action: "Kosten auflisten",
            routing: { request: { method: "GET", url: "/kosten" } },
          },
          {
            name: "Buchen",
            value: "anlegen",
            action: "Kostenzeile buchen",
            routing: { request: { method: "POST", url: "/kosten" } },
          },
        ],
        default: "liste",
      },
      {
        displayName: "Vorgang",
        name: "vorgang",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { bereich: ["schaeden"] } },
        options: [
          {
            name: "Auflisten",
            value: "liste",
            action: "Schaeden auflisten",
            routing: { request: { method: "GET", url: "/schaeden" } },
          },
          {
            name: "Melden",
            value: "anlegen",
            action: "Schaden melden",
            routing: { request: { method: "POST", url: "/schaeden" } },
          },
        ],
        default: "liste",
      },
      {
        displayName: "Vorgang",
        name: "vorgang",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { bereich: ["termine"] } },
        options: [
          {
            name: "Auflisten",
            value: "liste",
            action: "Termine auflisten",
            routing: { request: { method: "GET", url: "/termine" } },
          },
          {
            name: "Anlegen",
            value: "anlegen",
            action: "Termin anlegen",
            routing: { request: { method: "POST", url: "/termine" } },
          },
        ],
        default: "liste",
      },

      /* ---- Gemeinsame Felder fürs Lesen ----------------------------------- */
      {
        displayName: "Nur Geändertes",
        name: "geaendertSeit",
        type: "dateTime",
        default: "",
        displayOptions: { show: { vorgang: ["liste"] } },
        description:
          "Nur Einträge, die sich seit diesem Zeitpunkt geändert haben. Damit wird aus dem Abruf ein Abgleich statt eines Vollabzugs — bei einer großen Flotte der Unterschied zwischen Sekunden und Minuten.",
        routing: {
          request: { qs: { geaendert_seit: "={{$value || undefined}}" } },
        },
      },
      {
        displayName: "Höchstens",
        name: "limit",
        type: "number",
        typeOptions: { minValue: 1, maxValue: 200 },
        default: 50,
        displayOptions: { show: { vorgang: ["liste"] } },
        description: "Einträge je Seite, höchstens 200.",
        routing: { request: { qs: { limit: "={{$value}}" } } },
      },

      /* ---- Felder je Schreibvorgang --------------------------------------- */
      {
        displayName: "Fahrzeug-ID",
        name: "objektId",
        type: "string",
        default: "",
        required: true,
        displayOptions: { show: { bereich: ["fahrzeuge"], vorgang: ["kmMelden"] } },
      },
      {
        displayName: "Kilometerstand",
        name: "km",
        type: "number",
        /* ⛔ Die Grenzen stehen hier AUSGESCHRIEBEN, und das ist die eine Stelle,
           an der das so sein muss: Dieses Paket liegt außerhalb des
           Wurzel-tsconfig und kann `@/lib/api/grenzen` nicht importieren. Die
           maßgeblichen Werte stehen dort als `KM_MIN`/`KM_MAX` — wer sie ändert,
           muss diese Zeile mitziehen. Ohne sie sah ein n8n-Nutzer die Grenze in
           der Maske nicht und bekam für einen zu großen Wert einen 400, während
           das Nachbarfeld „Höchstens" seine Grenzen sehr wohl führt. */
        typeOptions: { minValue: 0, maxValue: 2147483647 },
        default: 0,
        required: true,
        displayOptions: { show: { bereich: ["fahrzeuge"], vorgang: ["kmMelden"] } },
        description:
          "Ein kleinerer Wert als der gespeicherte wird von DocuFleet abgewiesen — rückwärts wird nicht geschrieben.",
        routing: { request: { body: { km: "={{$value}}" } } },
      },
      {
        displayName: "Felder",
        name: "felder",
        type: "json",
        default: "{}",
        displayOptions: { show: { vorgang: ["anlegen"] } },
        description:
          "Der Rumpf, so wie ihn die Schnittstelle erwartet. Welche Felder Pflicht sind, steht in der Beschreibung unter /api/v1/openapi — bei einem Schaden etwa objekt_id und beschreibung.",
        routing: { request: { body: "={{JSON.parse($value)}}" } },
      },
    ],
  };
}

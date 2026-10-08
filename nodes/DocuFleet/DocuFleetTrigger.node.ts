import type {
  IDataObject,
  IHookFunctions,
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
} from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";
import { empfangeZustellung } from "./empfang";

/* Auslöser: DocuFleet ruft n8n an, statt dass n8n nachfragt.
 *
 * ⛔ DIESER KNOTEN PRÜFT DIE SIGNATUR — und das ist sein eigentlicher Inhalt.
 * Eine n8n-Webhook-Adresse ist erratbar lang, aber nicht geheim; wer sie kennt,
 * könnte sonst beliebige „Schäden" in den Ablauf des Kunden einspeisen. DocuFleet
 * signiert jede Zustellung mit HMAC-SHA256 über `<zeitstempel>.<rumpf>` und
 * schickt sie als `x-docufleet-signatur: t=<unix-sekunden>,v1=<hex>`.
 *
 * Der Zeitstempel steht MIT im signierten Text. Deshalb genügt es nicht, ihn zu
 * lesen — er muss auch auf sein Alter geprüft werden, sonst ließe sich eine
 * einmal abgefangene Zustellung beliebig oft erneut einspielen, mit gültiger
 * Signatur.
 */

const EREIGNISSE = [
  { name: "Schaden gemeldet", value: "schaden.gemeldet" },
  { name: "Kosten gebucht", value: "kosten.gebucht" },
  { name: "Vertrag läuft ab", value: "vertrag.laeuft_ab" },
  { name: "Prüfung fällig", value: "pruefung.faellig" },
  { name: "Führerscheinkontrolle überfällig", value: "fuehrerschein.ueberfaellig" },
  { name: "Fahrzeug angelegt", value: "objekt.angelegt" },
  { name: "Fahrzeug archiviert", value: "objekt.archiviert" },
  { name: "Fahrer gewechselt", value: "objekt.fahrer_geaendert" },
  { name: "Wartung abgeschlossen", value: "wartung.abgeschlossen" },
  { name: "Dokument abgelegt", value: "dokument.abgelegt" },
  { name: "Verstoß eingegangen", value: "verstoss.eingegangen" },
];

export class DocuFleetTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: "DocuFleet Auslöser",
    name: "docuFleetTrigger",
    icon: "file:docufleet.svg",
    group: ["trigger"],
    version: [1, 2],
    description: "Startet, wenn in DocuFleet etwas passiert",
    defaults: { name: "DocuFleet Auslöser" },
    inputs: [],
    outputs: ["main"],
    credentials: [
      { name: "docuFleetWebhook", required: true, displayOptions: { show: { "@version": [2] } } },
    ],
    webhooks: [
      {
        name: "default",
        httpMethod: "POST",
        responseMode: "onReceived",
        path: "webhook",
      },
    ],
    properties: [
      {
        displayName: "Signaturgeheimnis",
        name: "geheimnis",
        type: "string",
        typeOptions: { password: true },
        default: "",
        required: true,
        displayOptions: { show: { "@version": [1] } },
        description:
          "Wird in DocuFleet beim Anlegen des Ziels erzeugt und dort einmalig angezeigt (Einstellungen → Webhooks).",
      },
      {
        displayName: "Ereignisse",
        name: "ereignisse",
        type: "multiOptions",
        options: EREIGNISSE,
        default: [],
        description:
          "Nur zur Erinnerung: Welche Ereignisse tatsächlich ankommen, wird am Ziel in DocuFleet festgelegt. Was hier nicht angehakt ist, wird verworfen.",
      },
    ],
  };

  /* Kein automatisches An- und Abmelden: DocuFleet-Ziele werden bewusst in der
     Oberfläche angelegt, samt Geheimnis und Auswahl der Ereignisse. Ein Knoten,
     der sie im Hintergrund erzeugt, hinterließe bei jedem Verschieben ein
     verwaistes Ziel, das weiter zustellt. */
  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        return true;
      },
      async create(this: IHookFunctions): Promise<boolean> {
        return true;
      },
      async delete(this: IHookFunctions): Promise<boolean> {
        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();
    // V1 bleibt lesbar. Neue Workflows speichern das Geheimnis ausschließlich
    // in n8n-Credentials, damit es nicht im Workflow-Export landet.
    const geheimnis = this.getNode().typeVersion >= 2
      ? (await this.getCredentials("docuFleetWebhook")).geheimnis
      : this.getNodeParameter("geheimnis");
    const gewaehlt = (this.getNodeParameter("ereignisse", []) as string[]) ?? [];
    let rumpf: Record<string, unknown>;
    try {
      rumpf = empfangeZustellung(
        (req as { rawBody?: unknown }).rawBody,
        req.headers["x-docufleet-signatur"],
        geheimnis,
        Math.floor(Date.now() / 1000),
      );
    } catch (fehler) {
      throw new NodeOperationError(this.getNode(),
        `Zustellung abgewiesen: ${fehler instanceof Error ? fehler.message : "Ungültige Zustellung."}`);
    }
    if (!EREIGNISSE.some((e) => e.value === rumpf.ereignis) ||
      (gewaehlt.length > 0 && !gewaehlt.includes(rumpf.ereignis as string))) {
      // Angenommen, aber nicht weitergereicht — DocuFleet soll keinen Fehlschlag
      // sehen und die Zustellung nicht wiederholen.
      return { noWebhookResponse: false, workflowData: [] };
    }

    return { workflowData: [this.helpers.returnJsonArray([rumpf as IDataObject])] };
  }
}

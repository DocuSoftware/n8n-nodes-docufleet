import type {
  ICredentialsDecrypted,
  ICredentialTestFunctions,
  INodeCredentialTestResult,
  IDataObject,
  IHookFunctions,
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
} from "n8n-workflow";
import { NodeOperationError, NodeConnectionTypes } from "n8n-workflow";
import { empfangeZustellung } from "./empfang";



const EREIGNISSE = [
  { name: "Damage Report Created", value: "schaden.gemeldet" },
  { name: "Cost Created", value: "kosten.gebucht" },
  { name: "Contract Expiring", value: "vertrag.laeuft_ab" },
  { name: "Inspection Due", value: "pruefung.faellig" },
  { name: "Driving Licence Check Overdue", value: "fuehrerschein.ueberfaellig" },
  { name: "Vehicle Created", value: "objekt.angelegt" },
  { name: "Vehicle Archived", value: "objekt.archiviert" },
  { name: "Driver Changed", value: "objekt.fahrer_geaendert" },
  { name: "Maintenance Completed", value: "wartung.abgeschlossen" },
  { name: "Document Created", value: "dokument.abgelegt" },
  { name: "Traffic Violation Created", value: "verstoss.eingegangen" },
];

export class DocuFleetTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: "DocuFleet Trigger",
    name: "docuFleetTrigger",
    icon: "file:docufleet.svg",
    group: ["trigger"],
    version: [1, 2],
    subtitle: "Signed fleet events",
    description: "Starts a workflow when a DocuFleet event occurs",
    defaults: { name: "DocuFleet Trigger" },
    inputs: [],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      { name: "docuFleetWebhookApi", required: true, testedBy: "webhookSecretTest", displayOptions: { show: { "@version": [2] } } },
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
        displayName: "Signing Secret",
        name: "geheimnis",
        type: "string",
        typeOptions: { password: true },
        default: "",
        required: true,
        displayOptions: { show: { "@version": [1] } },
        description: 'Shown once when you create the webhook destination in DocuFleet Settings > Webhooks',
      },
      {
        displayName: "Events",
        name: "ereignisse",
        type: "multiOptions",
        options: EREIGNISSE,
        default: [],
        description:
          "Select the same events in the DocuFleet webhook destination. Events not selected here are discarded. Leave empty to receive all supported events.",
      },
    ],
  };


  methods = {
    credentialTest: {
      async webhookSecretTest(this: ICredentialTestFunctions, credential: ICredentialsDecrypted): Promise<INodeCredentialTestResult> {
        const secret = credential.data?.geheimnis;
        if (typeof secret !== "string" || secret.trim().length < 16) {
          return { status: "Error", message: "Paste the signing secret from your DocuFleet webhook destination" };
        }
        return { status: "OK", message: "Secret format accepted. Send a test event from DocuFleet to verify the connection and signature." };
      },
    },
  };

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
    // Legacy v1 workflows remain readable. New workflows keep secrets in credentials.
    const geheimnis = this.getNode().typeVersion >= 2
      ? (await this.getCredentials("docuFleetWebhookApi")).geheimnis
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
        `Delivery rejected: ${fehler instanceof Error ? fehler.message : "Invalid delivery."}`);
    }
    if (!EREIGNISSE.some((e) => e.value === rumpf.ereignis) ||
      (gewaehlt.length > 0 && !gewaehlt.includes(rumpf.ereignis as string))) {
      return { noWebhookResponse: false, workflowData: [] };
    }

    return { workflowData: [this.helpers.returnJsonArray([rumpf as IDataObject])] };
  }
}

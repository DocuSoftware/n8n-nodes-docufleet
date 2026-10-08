import type { ICredentialType, INodeProperties } from "n8n-workflow";

/** Separat vom API-Zugang: Ein reiner Empfänger braucht keinen Leseschlüssel. */
export class DocuFleetWebhook implements ICredentialType {
  name = "docuFleetWebhook";
  displayName = "DocuFleet Webhook";
  documentationUrl = "https://docufleet.de/integrationen/api";
  properties: INodeProperties[] = [
    {
      displayName: "Signaturgeheimnis",
      name: "geheimnis",
      type: "string",
      typeOptions: { password: true },
      default: "",
      required: true,
      description:
        "Wird in DocuFleet unter Einstellungen → Webhooks beim Anlegen des Ziels einmalig angezeigt. Kein API-Schlüssel.",
    },
  ];
}

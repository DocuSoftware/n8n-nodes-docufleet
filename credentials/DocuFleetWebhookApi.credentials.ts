import type { ICredentialType, INodeProperties } from "n8n-workflow";


export class DocuFleetWebhookApi implements ICredentialType {
  name = "docuFleetWebhookApi";
  displayName = "DocuFleet Webhook API";
  icon = "file:../nodes/DocuFleet/docufleet.svg" as const;
  documentationUrl = "https://docufleet.de/integrationen/api";
  properties: INodeProperties[] = [
    {
      displayName: "Signing Secret",
      name: "geheimnis",
      type: "string",
      typeOptions: { password: true },
      default: "",
      required: true,
      description:
        "The signing secret shown once when creating the destination in DocuFleet Settings > Webhooks. This is not an API key.",
    },
  ];
}

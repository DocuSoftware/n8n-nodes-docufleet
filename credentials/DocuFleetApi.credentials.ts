import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from "n8n-workflow";


export class DocuFleetApi implements ICredentialType {
  name = "docuFleetApi";
  displayName = "DocuFleet API";
  icon = "file:../nodes/DocuFleet/docufleet.svg" as const;
  documentationUrl = "https://docufleet.de/integrationen/api";

  properties: INodeProperties[] = [
    {
      displayName: "API Key",
      name: "apiSchluessel",
      type: "string",
      typeOptions: { password: true },
      default: "",
      required: true,
      description:
        "Create an API key in DocuFleet Settings > API Access. The key is shown only once.",
    },
    {
      displayName: "Base URL",
      name: "basisUrl",
      type: "string",
      default: "https://app.docufleet.de",
      required: true,
      description:
        "Only change this URL when using a different DocuFleet environment.",
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        Authorization: "=Bearer {{$credentials.apiSchluessel}}",
      },
    },
  };


  test: ICredentialTestRequest = {
    request: {
      baseURL: "={{$credentials.basisUrl}}",
      url: "/api/v1/fahrzeuge",
      qs: { limit: 1 },
    },
  };
}

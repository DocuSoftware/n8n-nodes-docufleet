import { NodeConnectionTypes } from "n8n-workflow";
import type { INodeType, INodeTypeDescription } from "n8n-workflow";


export class DocuFleet implements INodeType {
  description: INodeTypeDescription = {
    displayName: "DocuFleet",
    name: "docuFleet",
    icon: "file:docufleet.svg",
    group: ["transform"],
    version: 1,
    usableAsTool: true,
    subtitle: '={{$parameter["vorgang"] === "liste" ? "Get many" : $parameter["vorgang"] === "kmMelden" ? "Update odometer" : "Create"}}',
    description: "Read and manage your fleet",
    defaults: { name: "DocuFleet" },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [{ name: "docuFleetApi", required: true }],
    requestDefaults: {
      baseURL: "={{$credentials.basisUrl}}/api/v1",
      headers: { "content-type": "application/json" },
    },
    properties: [
      {
        displayName: "Resource",
        name: "bereich",
        type: "options",
        noDataExpression: true,
        options: [
          { name: "Appointment", value: "termine" },
          { name: "Contract", value: "vertraege" },
          { name: "Cost", value: "kosten" },
          { name: "Damage Report", value: "schaeden" },
          { name: "Vehicle", value: "fahrzeuge" },
        ],
        default: "fahrzeuge",
      },


      {
        displayName: "Operation",
        name: "vorgang",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { bereich: ["fahrzeuge"] } },
        options: [
          {
            name: "Get Many",
            value: "liste",
            action: "Get many vehicles",
            routing: { request: { method: "GET", url: "/fahrzeuge" } },
          },
          {
            name: "Update Odometer",
            value: "kmMelden",
            action: "Update Odometer",
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
        displayName: "Operation",
        name: "vorgang",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { bereich: ["vertraege"] } },
        options: [
          {
            name: "Get Many",
            value: "liste",
            action: "Get many contracts",
            routing: { request: { method: "GET", url: "/vertraege" } },
          },
        ],
        default: "liste",
      },
      {
        displayName: "Operation",
        name: "vorgang",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { bereich: ["kosten"] } },
        options: [
          {
            name: "Get Many",
            value: "liste",
            action: "Get many costs",
            routing: { request: { method: "GET", url: "/kosten" } },
          },
          {
            name: "Create",
            value: "anlegen",
            action: "Create a cost",
            routing: { request: { method: "POST", url: "/kosten" } },
          },
        ],
        default: "liste",
      },
      {
        displayName: "Operation",
        name: "vorgang",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { bereich: ["schaeden"] } },
        options: [
          {
            name: "Get Many",
            value: "liste",
            action: "Get many damage reports",
            routing: { request: { method: "GET", url: "/schaeden" } },
          },
          {
            name: "Create",
            value: "anlegen",
            action: "Create a damage report",
            routing: { request: { method: "POST", url: "/schaeden" } },
          },
        ],
        default: "liste",
      },
      {
        displayName: "Operation",
        name: "vorgang",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { bereich: ["termine"] } },
        options: [
          {
            name: "Get Many",
            value: "liste",
            action: "Get many appointments",
            routing: { request: { method: "GET", url: "/termine" } },
          },
          {
            name: "Create",
            value: "anlegen",
            action: "Create an appointment",
            routing: { request: { method: "POST", url: "/termine" } },
          },
        ],
        default: "liste",
      },


      {
        displayName: "Updated Since",
        name: "geaendertSeit",
        type: "dateTime",
        default: "",
        displayOptions: { show: { vorgang: ["liste"] } },
        description: 'Only return records updated since this timestamp',
        routing: {
          request: { qs: { geaendert_seit: "={{$value || undefined}}" } },
        },
      },
      {
        displayName: "Limit",
        name: "limit",
        type: "number",
        typeOptions: { minValue: 1, maxValue: 200 },
        default: 50,
        displayOptions: { show: { vorgang: ["liste"] } },
        description: 'Max number of results to return',
        routing: { request: { qs: { limit: "={{$value}}" } } },
      },


      {
        displayName: "Offset",
        name: "offset",
        type: "number",
        typeOptions: { minValue: 0 },
        default: 0,
        displayOptions: { show: { vorgang: ["liste"] } },
        description: "Number of records to skip. Increase by the page limit while seite.hat_mehr is true.",
        routing: { request: { qs: { offset: "={{$value}}" } } },
      },
      {
        displayName: "Idempotency Key",
        name: "idempotencyKey",
        type: "string",
        default: "",
        required: true,
        displayOptions: { show: { vorgang: ["anlegen", "kmMelden"] } },
        description: "Map a unique operation ID of 8-255 printable characters without spaces. Reuse it when retrying the same operation.",
        routing: { request: { headers: { "Idempotency-Key": "={{$value}}" } } },
      },
      {
        displayName: "Vehicle ID",
        name: "objektId",
        type: "string",
        default: "",
        required: true,
        displayOptions: { show: { bereich: ["fahrzeuge"], vorgang: ["kmMelden"] } },
      },
      {
        displayName: 'Odometer (Km)',
        name: "km",
        type: "number",

        typeOptions: { minValue: 0, maxValue: 2147483647 },
        default: 0,
        required: true,
        displayOptions: { show: { bereich: ["fahrzeuge"], vorgang: ["kmMelden"] } },
        description: 'The new odometer reading must not be lower than the stored value',
        routing: { request: { body: { km: "={{$value}}" } } },
      },
      {
        displayName: "Fields",
        name: "felder",
        type: "json",
        default: "{}",
        displayOptions: { show: { vorgang: ["anlegen"] } },
        description:
          "JSON request body. Required fields are documented at /api/v1/openapi. Damage reports require objekt_id and beschreibung.",
        routing: { request: { body: "={{JSON.parse($value)}}" } },
      },
    ],
  };
}

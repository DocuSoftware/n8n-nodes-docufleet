import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from "n8n-workflow";

/* Zugangsdaten für DocuFleet: ein API-Schlüssel, sonst nichts.
 *
 * KEIN BENUTZERNAME, KEIN PASSWORT — und das ist Absicht, nicht Sparsamkeit. Ein
 * Schlüssel gehört in DocuFleet keiner Person, sondern einem System; er trägt
 * seine eigenen Umfänge, seine eigene Rolle und ein Ablaufdatum, und er lässt
 * sich einzeln widerrufen, ohne dass jemand sein Passwort ändern muss.
 */
export class DocuFleetApi implements ICredentialType {
  name = "docuFleetApi";
  displayName = "DocuFleet API";
  documentationUrl = "https://docufleet.de/integrationen/api";

  properties: INodeProperties[] = [
    {
      displayName: "API-Schlüssel",
      name: "apiSchluessel",
      type: "string",
      typeOptions: { password: true },
      default: "",
      required: true,
      description:
        "Zu finden in DocuFleet unter Einstellungen → API-Zugang. Der Schlüssel wird nur beim Anlegen angezeigt.",
    },
    {
      displayName: "Adresse",
      name: "basisUrl",
      type: "string",
      default: "https://app.docufleet.de",
      required: true,
      description:
        "Nur ändern, wenn DocuFleet unter einer anderen Adresse läuft — etwa in einer Testumgebung.",
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

  /* Prüft die Zugangsdaten, ohne etwas zu verändern: eine Seite mit genau einem
     Fahrzeug. Schlägt das fehl, sagt DocuFleet im Rumpf, woran es lag — fehlender
     Umfang, abgelaufener oder widerrufener Schlüssel. */
  test: ICredentialTestRequest = {
    request: {
      baseURL: "={{$credentials.basisUrl}}",
      url: "/api/v1/fahrzeuge",
      qs: { limit: 1 },
    },
  };
}

# DocuFleet für n8n

Verbinden Sie Ihren Fuhrpark mit n8n. Das Paket enthält einen Aktionsknoten
**DocuFleet** und den Ereignisknoten **DocuFleet Auslöser**.

## Voraussetzung und Installation

Sie benötigen ein DocuFleet-Konto und eine n8n-Instanz, in der Community Nodes
installiert werden dürfen. Der Besitzer Ihrer DocuFleet-Organisation richtet
API-Schlüssel und Webhook-Ziele ein.

Nach der Veröffentlichung installieren Sie `n8n-nodes-docufleet` in Ihrer
eigenen n8n-Instanz unter Einstellungen → Community Nodes. Die Veröffentlichung
bei npm und die Verifizierung für n8n Cloud sind getrennte Schritte.
Für n8n Cloud muss der Knoten durch n8n freigegeben und dort auffindbar sein.

## Aktionsknoten

1. Öffnen Sie DocuFleet → Einstellungen → Integrationen → Automatisierungen.
2. Bereiten Sie unter n8n einen lesenden Zugang vor. Ergänzen Sie die benötigten
   Bereiche, wenn Ihr Ablauf weitere Daten liest oder Vorgänge anlegt.
3. Sichern Sie den einmalig angezeigten API-Schlüssel in den n8n-Credentials
   **DocuFleet API**. Die Adresse muss zu Ihrer DocuFleet-Umgebung gehören.
4. Wählen Sie im Knoten die gewünschte Ressource und Aktion.

Die Anmeldung liest ein Fahrzeug zur Prüfung des Zugangs. Deshalb benötigt
auch ein schreibender Ablauf `fahrzeuge:lesen`. Fachliche Schreibaktionen
benötigen zusätzlich ihren jeweiligen Schreibbereich. Geben Sie nur die
tatsächlich benötigten Berechtigungen frei.

## Ereignisse empfangen

1. Wählen Sie **DocuFleet Auslöser**, Version 2, und die benötigten Ereignisse.
2. Legen Sie dessen produktive Webhook-Adresse in DocuFleet unter Einstellungen
   → Webhooks als neues Ziel an. Wählen Sie dieselben Ereignisse.
3. Sichern Sie das einmalig angezeigte Signaturgeheimnis als Credential
   **DocuFleet Webhook** und ordnen Sie es dem Auslöser zu.
4. Aktivieren Sie den Workflow.

Der Auslöser prüft die Signatur der unveränderten Nachricht. Die Nutzlast enthält
`ereignis`, `zustellung_id` und `daten`. Verwenden Sie `zustellung_id` für die
Duplikatbehandlung in nachfolgenden Systemen. Ereignisse können mehrfach
zugestellt werden. Ein erfolgreicher Empfang bei n8n bedeutet nicht, dass alle
nachfolgenden Aktionen erfolgreich abgeschlossen wurden.

Für neue Schadenmeldungen an Microsoft Teams können Sie den vorbereiteten
Workflow in DocuFleet herunterladen. Er enthält keine Zugangsdaten. Verbinden
Sie Microsoft Teams, wählen Sie Team und Kanal und richten Sie den Auslöser ein,
bevor Sie den Workflow aktivieren.

Version 1 kann vorhandene Workflows weiterhin lesen. Stellen Sie diese auf
Version 2 mit getrennten Credentials um, entfernen Sie das alte Signaturgeheimnis
aus dem Workflow und rotieren Sie es am DocuFleet-Webhook-Ziel.

## Verbindung beenden

Deaktivieren Sie den Workflow. Entfernen Sie das Webhook-Ziel in DocuFleet und
widerrufen Sie nicht mehr benötigte API-Schlüssel. Bereits angelegte fachliche
Vorgänge werden dadurch nicht gelöscht.

## Hilfe und Entwicklung

Die Einrichtung und Erläuterungen finden Sie in der DocuFleet-Anwendung unter
Einstellungen → Integrationen sowie auf [docufleet.de](https://docufleet.de/integrationen/api).
Prüfen Sie bei Zustellproblemen sowohl das DocuFleet-Zustellprotokoll als auch
den n8n-Ausführungsverlauf. Veröffentlichen Sie dabei keine Zugangsdaten oder
vollständigen Kundenereignisse in Issues.

Quellen bauen: `bun install --frozen-lockfile --ignore-scripts`, danach
`bun run build`. Die Veröffentlichung erfolgt separat aus dem freigegebenen
GitHub-Repository über den manuellen Workflow mit npm Provenance.

Lizenz: MIT. Betreiber: DocuPuls GmbH. Marke: DocuFleet Folio N71.

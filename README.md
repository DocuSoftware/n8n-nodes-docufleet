# DocuFleet for n8n

Connect your fleet to n8n with the **DocuFleet** action node and **DocuFleet Trigger**.

## Requirements

You need DocuFleet 2.0.4 with API access enabled for your organization and an n8n instance that allows community nodes.
The organization owner creates API keys and webhook destinations in DocuFleet.
Install `n8n-nodes-docufleet` under **Settings > Community Nodes** on your own n8n instance.
npm publication does not imply verification for n8n Cloud. Cloud availability requires a separate review by n8n.

## Credentials and actions

1. Open **Settings > Integrations > Automations** in DocuFleet.
2. Prepare an n8n API key with only the scopes your workflow needs.
3. Store the key in a **DocuFleet API** credential. Keep the default base URL unless using a different DocuFleet environment.
4. Select a resource and operation in the action node.

The credential test reads one vehicle and requires `fahrzeuge:lesen`.
Writing costs, damage reports, appointments, or odometer readings also requires the respective write scope.
Resources and request field names follow the DocuFleet API. Its schema is available at `/api/v1/openapi` on your DocuFleet environment.
List operations return one page. The `Limit` parameter supports up to 200 records. Increase `Offset` by `seite.limit` while `seite.hat_mehr` is true.
Every write requires an **Idempotency Key**. Map a stable operation identifier, such as the source invoice or event ID, using 8-255 printable characters without spaces. Retry the same operation with the same key. Use a new key only for a different operation.

## Receive events

1. Add **DocuFleet Trigger**, version 2, and choose the events you need.
2. Register its production webhook URL in DocuFleet **Settings > Webhooks** with the same events.
3. Store the signing secret shown by DocuFleet in a **DocuFleet Webhook API** credential and select it on the trigger.
4. Activate the workflow.

Each delivery is authenticated using HMAC-SHA256 over the unmodified request body and timestamp.
The payload contains `ereignis` (event), `zustellung_id` (delivery ID), and `daten` (data).
Use `zustellung_id` to deduplicate downstream effects. A delivery can be repeated.
Acknowledging a webhook does not mean that all later workflow actions completed successfully.

Example: receive `schaden.gemeldet`, map the damage report from `daten`, and send a message to the appropriate Microsoft Teams channel.
The DocuFleet application provides a Teams example workflow without credentials.
Connect Microsoft Teams and select the team and channel before activating it.

Legacy trigger version 1 remains readable. Migrate existing workflows to version 2 credentials,
remove the old secret from workflow parameters, and rotate the signing secret in DocuFleet.

## Disconnect

Deactivate the workflow, remove its webhook destination in DocuFleet, and revoke unused API keys.
This does not delete business records already created by your workflow.

## Support and development

See the integration settings in DocuFleet and [API documentation](https://docufleet.de/integrationen/api).
Check both the DocuFleet delivery log and n8n execution history when troubleshooting.
Do not share credentials or customer payloads in public issues.

Build with `bun install --frozen-lockfile --ignore-scripts` and `bun run build`.
Releases are published from the approved GitHub workflow with npm provenance.

License: MIT. Publisher: DocuPuls GmbH. Product: DocuFleet. Icon: Folio N71.

The connector was exercised on n8n 2.42.5 against a real DocuFleet DEV environment using synthetic data, including reads, idempotent writes, and valid/tampered/expired signed webhook deliveries. This is not an n8n Cloud verification claim.

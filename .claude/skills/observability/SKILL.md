---
name: observability
description: Use for CAPP logging, metrics, tracing, alerting, incident diagnostics, telemetry redaction, and visibility into orders, payments, realtime, and future AI flows.
---

# Observability Skill

## When to Use
- Use when adding or changing server routes, webhooks, public ordering, order/payment/table state transitions, realtime flows, storage uploads, or background jobs.
- Use when introducing structured logging, Sentry, OpenTelemetry, Datadog, Prometheus, Grafana, CloudWatch, or equivalent tooling.
- Current state: no observability provider or structured logger was detected; `console.error` exists in the Razorpay webhook.

## Required Discovery
- Search for logging/tracing/metrics tooling: `logger`, `console.`, `sentry`, `otel`, `OpenTelemetry`, `datadog`, `prometheus`, `grafana`, `metrics`.
- Identify request, tenant, branch, order, payment, and user identifiers that are safe to record.
- Identify sensitive fields that must be redacted: secrets, tokens, full prompt content, full customer phone numbers, raw provider payloads, and private tenant data.
- Read affected route or state transition code before adding logs.

## Non-Negotiable Rules
- Prefer structured logs over free-form strings for critical paths.
- Do not log secrets, credentials, raw tokens, raw Razorpay payloads, service-role keys, or sensitive customer data.
- Include enough correlation data to debug without exposing private data.
- Preserve provider signature verification and idempotency context in webhook diagnostics.
- Do not add noisy logs in client render paths.

## Workflow
1. Define the diagnostic question: latency, errors, state drift, data consistency, customer failures, payment reconciliation, or realtime lag.
2. Add correlation fields where safe:
   - request ID, trace ID, span ID.
   - org ID, branch ID, order ID, payment ID, staff/user ID.
   - service/version/environment where available.
3. Use OpenTelemetry semantic conventions when present or practical.
4. Add metrics for critical paths:
   - Latency, traffic, errors, saturation.
   - Order/payment status transition counts.
   - Webhook success/failure/duplicate counts.
   - Realtime subscription health.
   - Queue depth/backfill progress if queues/jobs are introduced.
   - Model cost/tokens if AI workflows are introduced.
5. Place spans around external calls, route handlers, Supabase writes, storage operations, and jobs.
6. Update dashboards/alerts/runbooks when a critical path changes and tooling exists; otherwise mark UNKNOWN.

## Verification
- Confirm redaction with representative payloads.
- Run `npm run lint` after code changes.
- Run `npm run build` for server/client route changes.
- Exercise the changed path locally or with mocks to confirm logs/metrics fire once and include correlation fields.
- Check that no sensitive values appear in generated logs, test fixtures, screenshots, or final reports.

## Common Failure Modes
- Logging raw Razorpay or Supabase payloads during debugging and forgetting to remove them.
- Adding client logs for every realtime event and causing noise/performance issues.
- Metrics without labels needed to isolate branch/order/payment issues.
- Alerts without actionability or runbook links.
- Treating console output as durable incident telemetry.

# Razorpay Setup

## Env Values

Add these server-only values to `.env.local` for payment integration:

```bash
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

The public checkout key can be exposed only if needed:

```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=...
```

## Webhook

Create a Razorpay webhook pointing to:

```text
https://your-domain.com/api/v1/webhooks/razorpay
```

For local testing, use a public tunnel and update `NEXT_PUBLIC_APP_URL`.

## Event Handling

The webhook accepts `payment.captured` and `payment.failed` style events, verifies `x-razorpay-signature` when `RAZORPAY_WEBHOOK_SECRET` is configured, and updates `payments.status`, `payments.transaction_id`, and `payments.provider_data`.

When creating Razorpay orders, include one of these note fields:

- `capp_order_id`
- `capp_payment_id`

That lets the webhook map provider events back to CAPP records.

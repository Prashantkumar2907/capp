# PR Description Template

## Summary

- What changed and why.
- Which route/domain/persona is affected.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:api`
- `npm run test:ui`
- `npm run build`
- Any skipped command with the reason.

## Risk Notes

- Auth/role/tenant boundaries touched.
- Database/RLS/migration touched.
- Public QR/order/payment/subscription behavior touched.
- Performance budget or critical route touched.

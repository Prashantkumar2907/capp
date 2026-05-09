# Demo Data

The Supabase seed creates four deterministic restaurant personas for sales, QA, and product review:

| Restaurant | Type | Plan | Primary Workflow |
| --- | --- | --- | --- |
| Lotus Tea Room | Small tea shop or cafe | Starter trial | Lightweight QR ordering, simple pickup, cafe owner checks |
| Masala Works | Casual dining | Growth active | Waiter POS, QR table ordering, kitchen queue, cashier settlement |
| Harbour Spice Group | Multi-branch restaurant | Enterprise active | Branch comparison, manager override, kitchen role, refunds |
| Night Owl Bowls | Cloud kitchen | Pro active | Takeaway-first pickup, failed payment retry, cashier flow |

The seed includes realistic branches, tables, categories, dishes, placeholder dish images, availability differences, orders, order items, payments, subscriptions, feedback, and activity logs. Staff coverage spans owner, admin, manager, waiter, kitchen, cashier, and a disabled staff member for access-removal checks.

The seed also inserts `admin@example.com` as a platform admin and creates subscription grant audit rows for the demo customer portfolio. Use this account only in disposable demo environments, with a temporary password configured through Supabase Auth or the app's demo account process.

Demo emails use the `demo.capp.local` domain and are not real personal accounts. Customer names are generic role labels such as `Cafe guest` and `Pickup guest`; no real customer identifiers or payment credentials are seeded.

Dish images use stable placeholder image URLs today. Production imports should upload final sales/demo media to the public `dish-images` Supabase storage bucket and store the resulting public URL on `dishes.image_url`; the UI lazy-loads those images with dish-name alt text and falls back to an accessible dish placeholder if media fails. Public QR links are stored on seeded table rows as `/order/<branchId>/<tableNumber>`.

## Disposable Demo Auth Accounts

The SQL seed creates staff records but does not create Supabase Auth users by default. For disposable QA environments, run:

```bash
npm run demo:accounts
ALLOW_DEMO_ACCOUNT_MUTATION=1 DEMO_ACCOUNT_PASSWORD="use-a-temporary-password" npm run demo:accounts -- --create
ALLOW_DEMO_ACCOUNT_MUTATION=1 npm run demo:accounts -- --remove
```

The script only targets `demo.capp.local` addresses, links those auth users to seeded staff rows, and clears `staff.user_id` when accounts are removed. Mutations require `ALLOW_DEMO_ACCOUNT_MUTATION=1` unless the Supabase URL is local. Do not use it against real staff accounts or production projects.

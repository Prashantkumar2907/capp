# Demo Data

The Supabase seed creates four deterministic restaurant personas for sales, QA, and product review:

| Restaurant | Type | Plan | Primary Workflow |
| --- | --- | --- | --- |
| Lotus Tea Room | Small tea shop or cafe | Starter trial | Lightweight QR ordering, simple pickup, cafe owner checks |
| Masala Works | Casual dining | Growth active | Waiter POS, QR table ordering, kitchen queue, cashier settlement |
| Harbour Spice Group | Multi-branch restaurant | Enterprise active | Branch comparison, manager override, kitchen role, refunds |
| Night Owl Bowls | Cloud kitchen | Pro active | Takeaway-first pickup, failed payment retry, cashier flow |

The seed includes realistic branches, tables, categories, dishes, placeholder dish images, availability differences, orders, order items, payments, subscriptions, feedback, and activity logs. Staff coverage spans owner, admin, manager, waiter, kitchen, cashier, and a disabled staff member for access-removal checks.

Demo emails use the `demo.capp.local` domain and are not real personal accounts. Customer names are generic role labels such as `Cafe guest` and `Pickup guest`; no real customer identifiers or payment credentials are seeded.

Dish images use stable placeholder image URLs today. Production imports should upload final sales/demo media to the public `dish-images` Supabase storage bucket and store the resulting public URL on `dishes.image_url`; the UI lazy-loads those images with dish-name alt text and falls back to an accessible dish placeholder if media fails. Public QR links are stored on seeded table rows as `/order/<branchId>/<tableNumber>`.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync("supabase/01_schema.sql", "utf8");

test("schema includes composite branch/date indexes for analytics hot paths", () => {
  [
    "idx_orders_branch_created on orders(branch_id, created_at desc)",
    "idx_order_items_branch_created on order_items(branch_id, created_at desc)",
    "idx_payments_branch_created on payments(branch_id, created_at desc)",
    "idx_feedback_branch_created on feedback(branch_id, created_at desc)",
    "idx_orders_branch_table_active on orders(branch_id, table_number)",
    "idx_categories_org_sort on categories(org_id, sort_order)",
    "idx_dishes_org_name on dishes(org_id, name)",
    "idx_tables_branch_status on tables(branch_id, status)",
  ].forEach((index) => assert.equal(schema.includes(index), true));
});

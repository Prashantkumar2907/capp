import assert from "node:assert/strict";
import test from "node:test";
import type { NextRequest } from "next/server";

test("menu dish creation rejects client price and media mistakes before database work", async () => {
  const { POST } = await import("../../src/app/api/menu/dishes/route");
  const request = new Request("http://localhost/api/menu/dishes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "A",
      price: -10,
      branch_id: "not-a-uuid",
      image_url: "/relative-storage-path.jpg",
      is_veg: true,
      is_active: true,
      prep_time_mins: 0,
    }),
  }) as NextRequest;

  const response = await POST(request);
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /name|price|branch_id|image_url|prep_time_mins/);
});

test("menu dish updates reject malformed ids before auth or database work", async () => {
  const { PATCH } = await import("../../src/app/api/menu/dishes/[dishId]/route");
  const request = new Request("http://localhost/api/menu/dishes/not-a-uuid", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Updated dish" }),
  }) as NextRequest;

  const response = await PATCH(request, { params: Promise.resolve({ dishId: "not-a-uuid" }) });
  const body = (await response.json()) as { ok: boolean; code?: string; error?: string };

  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.code, "VALIDATION_ERROR");
  assert.match(body.error ?? "", /Invalid UUID/);
});

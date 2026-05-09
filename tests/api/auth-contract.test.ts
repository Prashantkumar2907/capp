import assert from "node:assert/strict";
import test from "node:test";
import type { NextRequest } from "next/server";

test("auth callback does not redirect to external origins", async () => {
  const { GET } = await import("../../src/app/(public)/auth/callback/route");
  const request = new Request("http://localhost/auth/callback?redirect=https%3A%2F%2Fevil.example%2Fphish") as NextRequest;

  const response = await GET(request);

  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "http://localhost/dashboard");
});

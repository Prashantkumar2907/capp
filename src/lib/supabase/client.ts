"use client";

import { createBrowserClient } from "@supabase/ssr";
import type {
  AuthChangeEvent,
  Session,
} from "@supabase/supabase-js";
import {
  TEST_USER,
  TEST_ORG,
  TEST_BRANCH,
  TEST_STAFF,
  TEST_CATEGORIES,
  TEST_DISHES,
  TEST_TABLES,
  TEST_ORDERS,
  TEST_PAYMENTS,
} from "./test-data";

type MockQueryResult = { data: unknown; error: null };
type MockQueryResolve = (value: MockQueryResult) => void;

interface MockQueryBuilder {
  isSingle: boolean;
  select: () => MockQueryBuilder;
  eq: () => MockQueryBuilder;
  or: () => MockQueryBuilder;
  order: () => MockQueryBuilder;
  limit: () => MockQueryBuilder;
  single: () => MockQueryBuilder;
  insert: () => MockQueryBuilder;
  update: () => MockQueryBuilder;
  delete: () => MockQueryBuilder;
  gte: () => MockQueryBuilder;
  lte: () => MockQueryBuilder;
  then: (resolve: MockQueryResolve) => void;
}

export function createClient() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (process.env.NEXT_PUBLIC_TEST_MODE === "true") {
    // Intercept Supabase methods to return static test data
    return new Proxy(supabase, {
      get(target, prop) {
        if (prop === "auth") {
          return {
            getUser: async () => ({ data: { user: TEST_USER } }),
            onAuthStateChange: (
              cb: (event: AuthChangeEvent, session: Session | null) => void
            ) => {
              // We setTimeout to avoid React state updates during render
              setTimeout(
                () =>
                  cb("SIGNED_IN", {
                    user: TEST_USER,
                  } as unknown as Session),
                0
              );
              return { data: { subscription: { unsubscribe: () => {} } } };
            },
            signInWithPassword: async () => ({ error: null }),
            signInWithOAuth: async () => ({ error: null }),
            signOut: async () => ({ error: null }),
            signUp: async () => ({ error: null }),
            refreshSession: async () => ({ error: null })
          };
        }

        if (prop === "channel") {
          // Mock realtime channels
          return () => ({
            on: () => ({ subscribe: () => {} }),
            subscribe: () => {},
            unsubscribe: () => {}
          });
        }

        if (prop === "from") {
          return (table: string) => {
            const builder: MockQueryBuilder = {
              isSingle: false,
              select: () => builder,
              eq: () => builder,
              or: () => builder,
              order: () => builder,
              limit: () => builder,
              single: () => { builder.isSingle = true; return builder; },
              insert: () => builder,
              update: () => builder,
              delete: () => builder,
              gte: () => builder,
              lte: () => builder,
              then: (resolve: MockQueryResolve) => {
                let mockData: unknown = [];
                switch(table) {
                  case "organizations": mockData = [TEST_ORG]; break;
                  case "branches": mockData = [TEST_BRANCH]; break;
                  case "staff": mockData = [TEST_STAFF]; break;
                  case "categories": mockData = TEST_CATEGORIES; break;
                  case "dishes": mockData = TEST_DISHES; break;
                  case "tables": mockData = TEST_TABLES; break;
                  case "orders": mockData = TEST_ORDERS; break;
                  case "payments": mockData = TEST_PAYMENTS; break;
                  case "order_items": mockData = TEST_ORDERS.flatMap((o) => [...o.order_items]); break;
                  case "branch_dishes": mockData = TEST_DISHES.map((d) => ({ is_available: d.is_available, custom_price: null })); break;
                }

                if (builder.isSingle) {
                  mockData = Array.isArray(mockData) ? mockData[0] : mockData;
                }
                
                // Hack for analytics dashboard custom query shape
                if (table === "orders" && !builder.isSingle && window.location.pathname.includes("analytics")) {
                   resolve({ data: TEST_ORDERS.concat(TEST_ORDERS), error: null });
                   return;
                }

                resolve({ data: mockData, error: null });
              }
            };
            return builder;
          };
        }

        return Reflect.get(target, prop);
      }
    }) as typeof supabase;
  }

  return supabase;
}

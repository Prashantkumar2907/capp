---
name: multi-agent-systems
description: Use before adding LLM orchestration, local LLMs, RAG, tool/function calling, evals, or multi-agent workflows to CAPP.
---

# Multi-Agent Systems Skill

## When to Use
- Use if the repo gains AI features such as menu assistants, analytics copilots, kitchen/order agents, RAG over restaurant data, local LLMs, provider SDKs, function/tool calling, or automated support workflows.
- Use when prompts, tools, model settings, vector stores, evals, or agent state are introduced or modified.
- Current state: no OpenAI, Anthropic, local LLM, vector, RAG, or eval surfaces were detected.

## Required Discovery
- Search for LLM and agent terms: `openai`, `anthropic`, `llm`, `model`, `prompt`, `embedding`, `vector`, `rag`, `langchain`, `agent`, `tool`, `eval`.
- Identify all data the AI feature can read or mutate, especially tenant, staff, order, payment, menu, and customer data.
- Identify runtime location: browser, server route, edge/serverless function, background job, or script.
- Read `.env.example` and deployment docs for provider configuration, but never inspect or copy secret values.
- Check for test/eval harnesses and observability support.

## Non-Negotiable Rules
- Version prompts, model settings, tool schemas, handoff contracts, and eval datasets.
- Use strict JSON schemas or typed contracts for tool calls and agent handoffs.
- Isolate private agent state by tenant/org/branch/user and never mix cross-tenant context.
- Gate side effects such as order changes, refunds, staff changes, menu changes, or database writes behind explicit human approval unless product requirements say otherwise.
- Treat user prompts, retrieved context, model output, and tool output as untrusted.
- Do not send secrets, service-role keys, private tokens, or unnecessary customer data to model providers.

## Workflow
1. Define the agent boundary: user, goal, allowed data, allowed tools, side effects, and approval gates.
2. Define prompt and schema versions in code or data, not only prose.
3. Use typed input/output contracts with validation before and after model calls.
4. Add permission checks before every tool call. Match tool permissions to existing CAPP roles: owner, admin, manager, waiter, kitchen, and cashier.
5. Add retries with backoff, fallback models where appropriate, rate limits, circuit breakers, and token/cost budgets.
6. Add privacy filters and retrieval filters before model calls.
7. Build evals with golden datasets and negative cases for prompt injection, data exfiltration, hallucinated tool use, and cross-tenant leakage.
8. Mock external LLMs in tests unless an explicit live-eval command exists.

## Verification
- Validate schemas with positive and negative fixtures.
- Run targeted tests/evals if present; otherwise document UNKNOWN test harness.
- Confirm sensitive fields are redacted from prompts, logs, traces, and model metadata.
- Verify denied tool calls cannot mutate orders, payments, staff, branches, menus, or settings.
- Measure token/cost behavior for representative flows.

## Common Failure Modes
- Adding model calls directly in browser code with provider secrets.
- Letting model output decide database writes without deterministic validation.
- Logging full prompts containing customer or tenant data.
- Relying on natural-language tool contracts instead of strict schemas.
- Missing prompt injection defenses around retrieved restaurant/menu/order data.
- No evals for the highest-risk side effects.

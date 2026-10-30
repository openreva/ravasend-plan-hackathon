# Ravasend Plan

An isolated budgeting/payment-planning hackathon prototype. Tell it “10% for tithe, 20% to mummy, 10% for rent.” An allocation agent and an independent safety agent run concurrently through **Mozaik**, then a deterministic validator calculates integer-cent amounts. The user reviews and confirms before **PayPal sandbox** checkout becomes available.

This is new hackathon work, started 30 October 2026. It is not the production Ravasend app, an investment adviser, a licensed financial service or a multi-beneficiary payout system. No production code or customer records are included.

## Run

Requirements: Node.js 22+ and npm.

```sh
npm ci --ignore-scripts
cp .env.example .env
npm run check
npm test
npm run dev
```

Open http://127.0.0.1:3080. The default offline test mode works without external credentials. Enter percentages in the demonstrated format. This mode uses a deterministic fixture runner and **must not be represented as AI inference**.

For actual AI, set `OPENAI_API_KEY` locally in `.env`, optionally set `AI_MODEL` to a model supported by the installed Mozaik version, restart, and choose “Mozaik + AI agents.” Both agents use the provider through Mozaik's inference runner. Only synthetic instructions should be sent during evaluation. Provider usage may incur costs; do not enable a paid service without account-owner authorization.

For PayPal, create/use a sandbox REST application at https://developer.paypal.com/. Set its sandbox `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` locally. The secret stays server-side. The adapter is hardcoded to `api-m.sandbox.paypal.com`; no live endpoint exists in this application. Approve checkout using a sandbox buyer account, not a real account. The full income amount funds one sandbox merchant order. Budget allocations do not represent PayPal transfers to family, landlord or charities.

Never commit `.env`, API keys, sandbox passwords or customer information. Judges should supply their own sandbox credentials or arrange a private test session. No secrets are embedded in this repository.

## Architecture and real concurrency

`src/agents.ts` creates a request-scoped Mozaik RuntimeState, joins the allocation agent, safety agent and coordinator observer, then starts two fire-and-forget `runLoop` calls. Neither agent awaits the other. Both see the same input; they return independent JSON answers. The observer records `inference.started`, `inference.completed` and `model.answer` events in shared state. It releases the final plan only after both answers are present. Safety concerns or schema failures stop the flow. The deterministic validator is authoritative for amounts and totals, regardless of model output.

`test/agents.test.ts` checks that both inference start timestamps precede the earliest completion timestamp. It uses fixture inference to test orchestration without an API key. This proves concurrent runtime behavior, not real model quality. The UI exposes the per-request trace. AI mode requires a separate provider-backed run before a final competition claim.

`src/budget.ts` validates finite positive percentages, precision, duplicate labels and total <=100%. It floors each allocation to whole cents and assigns all leftover cents to reserve, preserving the input total exactly.

`src/paypal.ts` authenticates server-side, creates Orders v2 sandbox orders and captures only the order associated with the confirmed plan. Request IDs and pending-promise locks reduce duplicate order/capture requests. The in-memory plan store expires after 30 minutes and is not a production ledger. Server restart discards plans. No autonomous payment tool is exposed to either agent.

## Verification status

- TypeScript checks: passed locally.
- 14 automated tests: passed, including 100 generated rounding/reconciliation cases, a concurrent Mozaik integration test and mocked PayPal adapter checks. Mocked checks are not evidence of a real sandbox payment.
- Actual provider-backed AI run: pending local credentials.
- Actual PayPal sandbox create/approve/capture: pending sandbox credentials and buyer approval.
- Public repository and final demo video: not yet published.

Do not submit the offline fixture as proof of a working PayPal + AI integration. Final entries need the real integration checks and a recorded demonstration.

## Demo sequence

1. Explain the problem: income arrives as one amount, while family, rent and other obligations compete for it.
2. Generate a plan in AI mode and expand the concurrent agent trace.
3. Show the reserve and exact totals. Try an over-100% request and show rejection.
4. Review and explicitly confirm a valid plan.
5. Complete PayPal sandbox checkout and show the sandbox order receipt.
6. State boundaries: no live money, no autonomous transfers, no multi-beneficiary payout integration.

For JigJoy: Freestyle track. For PayPal: meaningful sandbox + AI integration must be verified before entry. One concept can be adapted to each event; check each event's current rules before submission.

## References

- Mozaik: https://docs.jigjoy.ai/docs/quickstart and https://docs.jigjoy.ai/docs/concurrent-agents
- PayPal Orders v2: https://developer.paypal.com/api/orders/v2
- JigJoy rules: https://build.jigjoy.ai/rules
- PayPal rules: https://paypalaihackathon.devpost.com/rules

## License

MIT. Dependencies retain their own licenses. UI uses Google Fonts (DM Sans and Manrope) via their hosted stylesheet, with system-font fallbacks.

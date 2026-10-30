# Final entry checklist

## JigJoy Freestyle

- Project name: Ravasend Plan
- Contact: emmanuel@ravasend.com
- Track: Freestyle
- Repository: pending publication of this isolated folder only
- Working concurrent Mozaik model demo: pending provider credentials and verification
- Optional screenshot: capture the verified AI-mode plan and expanded activity log
- Final rules acceptance: action-time confirmation required

## PayPal AI Hackathon

- Project name: Ravasend Plan
- Tagline: Turn income into a reviewed budget, then fund it with PayPal sandbox.
- Built with: TypeScript, Mozaik, Node.js, Express, PayPal Orders v2, configured AI provider
- Functional PayPal sandbox and AI demonstration: pending credentials and verification
- Public repository with MIT license: pending
- Public YouTube video under 3 minutes: pending real integration recording
- Devpost project creation: blocked by CAPTCHA awaiting permission
- Final rules acceptance: action-time confirmation required

## Demo narration (adapt after real verification)

People often receive one income payment but have several obligations: rent, family support and savings. Ravasend Plan makes those intentions explicit before anything moves.

Here I enter one thousand dollars and ask for ten percent for tithe, twenty percent for family and ten percent for rent. The allocation agent and safety agent run concurrently on Mozaik. This timeline shows both started before either finished.

The application validates percentages and calculates amounts in whole cents. We have one hundred dollars, two hundred dollars and one hundred dollars allocated, with six hundred dollars in reserve. An instruction totalling more than one hundred percent is rejected.

I review the result and explicitly confirm. Only then can the server create a PayPal sandbox order. After sandbox buyer approval, the matching order is captured and the receipt is displayed.

This is a prototype using synthetic data and sandbox funds. Checkout is one merchant order, not separate payments to these labels. Neither AI agent can call the payment API. Our next step is testing the assistant with users and improving clarification before any production rollout.

Do not narrate or publish the PayPal approval/capture section until an actual sandbox run is verified. Do not label an offline fixture as AI.

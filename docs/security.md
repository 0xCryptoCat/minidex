# Security & Abuse Guardrails

- All upstream calls routed through Netlify Functions; no secrets in client bundle.
- Validate and sanitize `address`, `chain`, and other inputs.
- Upstream timeouts limited to 3s; handle partial failures gracefully.
- Rate limit repeated abusive requests; consider temporary denylist.
- Strip or cap large responses to avoid cache poisoning.

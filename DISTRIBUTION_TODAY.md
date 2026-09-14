# Distribution Sprint: First Organic Customer

Goal: get one real UPSC aspirant to start a test today without paid ads.

## Positioning

Lead with the wedge, not the whole platform:

> Free UPSC Prelims PYQ and mock-test practice. No signup. Timed tests with negative marking and instant review.

Best links to share:

- Full-length mock: https://upscprelimstest.com/flt
- PYQ hub: https://upscprelimstest.com/pyq
- 2025 PYQ test: https://upscprelimstest.com/test/pyq-2025
- Polity 50Q drill: https://upscprelimstest.com/test/pyq-polity-50
- Mini warm-up: https://upscprelimstest.com/test/gs-mini-mock-01

## Today’s 90-Minute Plan

1. Submit the sitemap in Google Search Console:
   `https://upscprelimstest.com/sitemap.xml`

2. Post the same useful asset in 5 places where UPSC aspirants already gather:
   - Reddit UPSC communities
   - Telegram UPSC preparation groups
   - WhatsApp study circles
   - Quora answers about UPSC mock tests/PYQs
   - X/LinkedIn with UPSC hashtags

3. Ask for one action only:
   “Take the 10Q warm-up or the 2025 PYQ test and tell me where the review flow feels confusing.”

4. Manually DM 20 aspirants or study-page admins with a specific link:
   use `https://upscprelimstest.com/test/gs-mini-mock-01` first because it is low-friction.

## Post Template

I built a free UPSC Prelims practice site for PYQs and mocks.

No signup, no paywall. You can start a timed test directly:

- 10Q warm-up: https://upscprelimstest.com/test/gs-mini-mock-01
- 2025 PYQ test: https://upscprelimstest.com/test/pyq-2025
- Polity 50Q drill: https://upscprelimstest.com/test/pyq-polity-50

It has negative marking and instant review after submission. I’m looking for brutally honest feedback from aspirants: what feels useful, what feels missing, and where the review flow is confusing.

## SEO Backlog

- Add Google Search Console verification in `src/app/layout.tsx`.
- Add a public `/tools` or `/free-upsc-prelims-mock-test` page only if search data shows people are not landing on `/flt`.
- Create 7 subject landing pages if `/subject-wise` starts getting impressions.
- Replace UUID question URLs with keyword slugs later if you want stronger programmatic SEO.
- Add analytics event tracking for `start_test`, `submit_test`, and `signup_after_result`.

# Sales Luck System Release Checklist

## 1) Environment and data readiness
- [ ] MySQL is running and reachable from backend host.
- [ ] `backend/.env` is configured (`PORT`, DB settings, `JWT_SECRET`, `LIVE_QA_URL`).
- [ ] DB has been initialized with `backend/sql/schema.sql`.
- [ ] Seed data has been applied with `backend/sql/seed.sql`.
- [ ] If upgrading from old DB, migration `backend/sql/migrations/20260508_add_community_posts.sql` is applied.

## 2) Backend verification
- [ ] Install deps: `cd backend && npm install`.
- [ ] Unit tests pass: `npm test`.
- [ ] Smoke flow passes: `python3 scripts/e2e_smoke.py`.
- [ ] API spot-check: `GET /health` returns `{ "status": "ok" }`.
- [ ] API spot-check: `GET /api/public/config` returns `{ success: true, data.liveQaUrl }`.

## 3) Frontend verification
- [ ] Install deps: `cd frontend && npm install`.
- [ ] Build passes: `npm run build`.
- [ ] App opens without runtime errors.
- [ ] Login/register/spin/recharge/community post/growth trajectory all work end-to-end.
- [ ] "在线答疑" jumps to URL returned by backend public config.

## 4) Manual acceptance checks
- [ ] Four corner cards are above the wheel and remain clickable.
- [ ] Left panels are left-aligned and right panels are right-aligned.
- [ ] "成长轨迹" modal shows energy, test, and recharge tables.
- [ ] Recharge modal opens from both required entry points.
- [ ] No blocking console errors during main flow.

## 5) Release notes and handoff
- [ ] Update `CHANGELOG.md` for current release date/version.
- [ ] Record deployment URL/port and verification account.
- [ ] Share rollback plan (DB backup and previous backend build).
- [ ] Confirm final acceptance with stakeholder.

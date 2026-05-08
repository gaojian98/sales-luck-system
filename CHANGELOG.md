# Changelog

All notable changes to this project will be documented in this file.

## v0.2.0 - 2026-05-08

### Added
- Backend community module with `GET /api/community/posts` and `POST /api/community/posts`.
- Backend growth module with `GET /api/growth/trajectory` for aggregated energy, test, and recharge records.
- Backend public config module with `GET /api/public/config` to expose configurable `liveQaUrl`.
- Database initialization assets: `backend/sql/schema.sql`, `backend/sql/seed.sql`, and migration `backend/sql/migrations/20260508_add_community_posts.sql`.
- Backend smoke test script: `backend/scripts/e2e_smoke.py`.
- Backend route and service tests for auth, lottery, community, growth, and public config modules.
- Manual acceptance checklist: `E2E_CHECKLIST.md`.

### Changed
- Frontend login, register, spin, recharge, growth, and community sharing flows now call real backend APIs.
- Frontend "成长轨迹" modal now displays three data tables: energy curve, test records, recharge records.
- Frontend "飞轮学院" module now supports secondary course catalog, learning sharing panel, and online Q&A jump entry.
- Frontend "在线答疑" link is now backend-configurable instead of hardcoded.
- Backend dev script now narrows nodemon watch scope to avoid `EMFILE` watch overflow.
- Backend README expanded with environment, DB init, migration, test, and E2E flow instructions.

### Fixed
- Fixed frontend style build break caused by invalid RTF content in `frontend/src/styles/cosmic-v42.css`.
- Fixed quick recharge entry behavior to ensure recharge modal opens from both required entry points.
- Fixed "飞轮学院" buttons becoming unclickable by correcting layer order, `z-index`, and pointer event behavior.
- Fixed E2E smoke script JSON parse failure by adding tolerant non-JSON payload parsing.

### Notes
- Existing old data can be replaced by recreating DB and running `schema.sql` + `seed.sql`.

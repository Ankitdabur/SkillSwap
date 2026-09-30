# SkillSwap Agent Guide

## Sources of Truth

- Use `docs/architecture.md` as the authority for SkillSwap requirements, architecture, data models, workflows, phase boundaries, and finalized decisions.
- Use `/Users/ankityadav/Desktop/Backend/Project` only as the reference for the previous backend's coding style and project conventions.
- When the reference backend conflicts with `docs/architecture.md`, follow `docs/architecture.md`.
- Do not add collections, fields, relationships, features, or architectural decisions that have not been approved.

## Reference Backend Conventions

The previous backend uses these patterns:

- JavaScript with ESM through `"type": "module"` and `.js` extensions in import paths.
- `src/index.js` as the process entry point and `src/app.js` for Express setup and route mounting.
- Separate `src/db`, `src/models`, `src/controllers`, `src/routes`, `src/middlewares`, and `src/utils` directories.
- A database connection helper in `src/db/index.js` and a separately defined database name in `src/constants.js`.
- `.env` loaded with `dotenv`, followed by direct `process.env` access.
- Express middleware for CORS, JSON and URL-encoded request bodies, static files, and cookies.
- Mongoose schemas with timestamps, schema methods, and password hashing in pre-save middleware.
- Thin routes, async controllers wrapped with `asyncHandler`, manual request validation, and errors raised with `ApiError`.
- Successful responses constructed with `ApiResponse`.
- Prettier configured for double quotes, two-space indentation, semicolons, bracket spacing, and ES5 trailing commas.

Follow these conventions where they are compatible with SkillSwap. Do not copy legacy product fields, routes, secrets, typographical errors, commented experiments, or implementation bugs.

## Required SkillSwap Differences

The reference backend's legacy authentication behavior must not be copied:

- Do not store the raw refresh token in MongoDB; store only its hash.
- Do not return the refresh token in an API response body.
- Keep the raw refresh token only in an HttpOnly cookie and rotate it after every successful refresh.
- Invalidate the old refresh token after successful rotation.
- Return the access token to the client and accept it as `Authorization: Bearer <accessToken>`.
- Do not store the access token as a server-managed authentication cookie.
- Extend the project-style `ApiError` response with the centrally defined stable `code` required by `docs/architecture.md`.
- Never expose stack traces, password hashes, token values, or other private secrets in API responses.

## Current Scope: Phase 1

The target `backend/` directory in this repository is currently empty. Implement only the Phase 1 backend foundation, authentication, and account permissions:

- Initialize Node.js, Express.js, MongoDB, and Mongoose using the compatible reference conventions above.
- Use `.env`, `dotenv`, direct `process.env` access, and the project's constants approach for the database name.
- Add the User model with the finalized roles, account types, teaching-style enum array, and language enum array.
- Add password hashing, registration, login, refresh, logout, and current-user APIs.
- Add authentication, role, account-type, manual request-validation, and error middleware.
- Use the finalized `ApiResponse` and `ApiError` shapes.
- Add foundational unit and integration tests.
- Use the same database for development and testing for now; do not add `.env.test` or separate test-database architecture.

Frontend framework selection remains deferred. Do not begin booking, credits, cron jobs, Socket.IO, AI, or other later-phase modules before their prerequisite phases.

## Change Discipline

- Inspect existing target-project code before editing and preserve established patterns as the project grows.
- Keep changes limited to the active phase and requested task.
- Keep API-boundary request validation separate from service-level business-rule validation.
- Add or update tests for valid behavior, invalid input, authorization failures, and prohibited account actions.
- Review the final diff and remove unrelated changes before handing work back.

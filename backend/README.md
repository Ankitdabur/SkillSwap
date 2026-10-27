# SkillSwap Backend

## Requirements

- Node.js 20 or newer
- MongoDB

## Local setup

1. Copy `.env.example` to `.env`.
2. Replace placeholder secrets before implementing authentication.
3. Install dependencies with `npm install`.
4. Start the development server with `npm run dev`.

The initial health endpoint is available at:

```text
GET /api/v1/health
```

## Scripts

- `npm run dev` starts the API with nodemon.
- `npm start` starts the API with Node.js.
- `npm test` runs the Node.js test suite.
- `npm run check` performs a syntax check of the entry point and its imports.

# DocSeek

Minimal monorepo for the DocSeek frontend and API.

The detailed setup and run instructions live in the subfolder READMEs:

- `api/README.md`
- `client/README.md`

## Docker Compose

From the repo root you can start Postgres, the API, and the client together with:

```bash
docker compose up
```

The Postgres container uses the `pgvector` image. Fresh Docker database initialization and the data script schema bootstrap both enable the `vector` extension automatically.

Create a root `.env` from `.env.example` for shared local settings such as `DATABASE_URL`, `OPENAI_API_KEY`, and `OPENAI_EMBEDDING_MODEL`.

Service endpoints:

- `client`: `http://localhost:5173`
- `api`: `http://localhost:3000`
- `postgres`: `localhost:55432`

The scraping script is still intended to be run from the host machine because the UPMC site blocked headless/containerized requests during implementation. Once Compose is up, load scraped data into the Dockerized Postgres with:

```bash
cd data-scripts
uv run python scrape_doctors.py --mode scrape-load
```

Generate specialty embeddings separately with:

```bash
cd data-scripts
uv run python generate_specialty_embeddings.py
```

## Tech stack

- Frontend: React, Vite, TanStack Router
- Backend: Hono on Bun

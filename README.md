# Atlas

An interactive atlas of countries, regions, and Bangladesh's 64 districts. Mark places visited; progress stays in this browser. No account or server-side user database is required.

**Live site:** https://mdrabbiahsankhanrajin.github.io/z-map-site/

## Run and verify

Requires Node.js 22 and pnpm 11.19.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
```

Open `http://127.0.0.1:3000/` for the world map or `/bd` for Bangladesh. To reproduce the Pages export, set `GITHUB_PAGES=true` and `NEXT_PUBLIC_BASE_PATH=/z-map-site`, then run `pnpm build`. The result is in `out/`. Pushes to `main` verify and deploy that export through `.github/workflows/pages.yml`.

The Atlas map uses local boundaries, illustrated physical terrain, textures, and map worker files. After a successful first visit, the world and Bangladesh views cache their essential assets for offline return visits; other country pages are cached when opened. Source links and external credits are ordinary links, not required for the Atlas map to render.

Original site material is all rights reserved; this repository is not offered under an open-source license. See [RIGHTS.md](RIGHTS.md) and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for the scope of that notice and the separate terms for geographic data, imagery, and bundled software.

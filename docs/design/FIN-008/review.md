# Design review: FIN-008

FIN-008: Auditor role has read-only access to entries and approval history

- Signed by: Quy Nguyen
- Signed at: 2026-11-26T06:18:27.754Z

## Decision

Chosen option: **Dedicated finance backend service with append-only history table**

A real Node REST service owns the finance domain: session roles, segregation-of-duties policy, entry state machine and an insert-only history table in a relational database, with the React SPA reduced to screens calling JSON endpoints over HTTP.

## Rationale

test

## Classification

- Layer: fullstack
- Magnitude: XL
- Areas: package.json, server, server/migrations, src/financeClient.ts, src/FinanceRoutes.tsx, vite.config.ts, vitest.config.ts, src/finance.spec.ts

## Options

### 1. In-app finance API module over browser storage

No feedback.

### 2. Service worker mock HTTP API with IndexedDB ledger

No feedback.

### 3. Dedicated finance backend service with append-only history table (chosen)

No feedback.

## Artefacts signed

| Kind | Path | Content sha256 | Commit |
| --- | --- | --- | --- |
| adr | `docs/design/epic-finance/adr.md` | `1c2f292a3119a71ec95abb7386c74cb9fb027d15578ab976955492bde2a4cab8` | `9a311517c810af0cbca5333234236be73d6778a0` |
| api-contract | `docs/design/FIN-008/story-api-contract.md` | `bf492230e4e03875851367929ab193506908f41039bd5bdbd61b747b588d9986` | `1927b4f5cfedc66ddb254ff73b34c18ce30d4565` |
| c4-component-view | `docs/design/epic-finance/option-1-component.mmd` | `01f9d27fd9bdd59be3982bc964101a7f8bdc1dd1edf3a927dfe10ef50150b9ff` | `701a8c86470a4affdc77f693f2bbf336b9f55c0f` |
| c4-component-view | `docs/design/epic-finance/option-2-component.mmd` | `b3e5a89e636428fc3e6d7d0c1fabbdb4215a8880b546758429553531815f7798` | `64c2cebe4b8fc881ef669dcd1c89ab3edde59336` |
| c4-component-view | `docs/design/epic-finance/option-3-component.mmd` | `34a7e426a5abb509af644c621e6a70f4f2ff6927a7b3efb17e3362b6d561db2f` | `e9340d11f4eb56fb0ee379ddd8a7180dbc6f85cf` |
| c4-container-view | `docs/design/epic-finance/option-1.mmd` | `a266ca702f3d2c68e5019b1a951eec4a2d6ffc519262cb59076e41d90b9dc9e3` | `7eec645cd3da5f1fb706b33f4f3ddc75f2b85989` |
| c4-container-view | `docs/design/epic-finance/option-2.mmd` | `6eea42f9df02d3d3a56a639d01c04f4335c44b52dc216abb6f2520edcd91c643` | `e18f4275f3b8ae8f924705df7b22d97e0b2abf63` |
| c4-container-view | `docs/design/epic-finance/option-3.mmd` | `f9a0d5759c128aab315b171f7607e8caa526bdfab789ac2a6f7d59d1a5fda23d` | `a998906c8ab4f2e32215666190caf64566f02234` |
| c4-context-view | `docs/design/epic-finance/context.mmd` | `69ec466cc4befdb8f4fdb1e9dcbf74ec650170e3b1ecd10cc535c47daec1a0e1` | `b39abf62c54a23e6b06a71ff05808829697e42b1` |
| data-flow-view | `docs/design/epic-finance/option-1-data-flow.mmd` | `59386c6187178bd2c4f88744748a8f4ea7cdba54082cca78651f83fafd1a1fa4` | `cd2b94d9aaae3b9488c9bba0002f9020e8e5480d` |
| data-flow-view | `docs/design/epic-finance/option-2-data-flow.mmd` | `c960010f630e33a750cd28d6aafa300af82f960be83a3f6d65f10ed43fdcc7fe` | `60885f026c6d07e8eb1955ccb51785f20f5a8e7e` |
| data-flow-view | `docs/design/epic-finance/option-3-data-flow.mmd` | `84e586d7673407215c1a2cfd0da538e71154998010ad934ff1e1866ceb9d0458` | `7f2f978c8f52f258ace7afa38d28700aefd1021c` |
| data-model-view | `docs/design/FIN-008/story-data-model.mmd` | `743dd9289bf7739dd46cf633c8872577f22a58c00e3d80ec983fc332a8753948` | `540005076f7721136df0d2f15ef49d7481c88a5a` |
| sequence-view | `docs/design/FIN-008/story-sequence.mmd` | `a8b9f98aff448ceaab842efbdc9b9e12cd0c8990c3ff27eef2fafd1a29d4d5e9` | `468a43a2e01d618da24294f0805422e13b882a31` |
| threat-model | `docs/design/epic-finance/threat-model.md` | `d3e3200398804de761038ef220b64e487319cbf42d1fa9a47379dddc0575cb77` | `594b0367c11d7ca6fd76563140d184ceef6af76c` |

## Lineage

- Requirement: 5120d7dd-a28d-4c50-870e-fffa430eed37
- Edge: g2-sign
- Version signed: 9

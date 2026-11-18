# Design review: PAY-001

PAY-001: Show "Save this card for next time" checkbox at checkout

- Signed by: Quy Nguyen
- Signed at: 2026-11-18T04:05:42.959Z

## Decision

Chosen option: **Saved cards module inside the portal application**

A saved-card module added to the existing portal application and database: the checkout page mounts the Contoso Pay hosted field, and one server-side manager owns listing, cap, ownership and token deletion for both checkout and /account/cards.

## Rationale

test

## Classification

- Layer: fullstack
- Magnitude: L
- Areas: not recorded

## Options

### 1. Saved cards module inside the portal application (chosen)

No feedback.

### 2. Dedicated saved cards service behind an internal API

No feedback.

### 3. Event-driven token persistence via payment webhook and worker

No feedback.

## Artefacts signed

| Kind | Path | Content sha256 | Commit |
| --- | --- | --- | --- |
| adr | `docs/design/epic-payments/adr.md` | `72704a58ecbf8117b9ceb79cb6bc01f7263fee875475b20831c30418bf3a2d5f` | `d8fe37e139ebc2c07c465a1579ba5efd1959a442` |
| c4-component-view | `docs/design/epic-payments/option-1-component.mmd` | `c992860f28ee17739bfef27a96b3b758ea101c3c592635c860184894dccadcc2` | `aa804a542a88ea4b8ac946d2af14a34e29dffd55` |
| c4-component-view | `docs/design/epic-payments/option-2-component.mmd` | `69a55c491c42e05d6b9ab7a0329656d452b1b7bf383b691b33b7e781fc3b5976` | `b3f817282fccea0ecd285b02f4b2624b1b5e7ca2` |
| c4-component-view | `docs/design/epic-payments/option-3-component.mmd` | `d085ff1af25ad655adfcfb193d06a61fac46f3984b6b2d17be172f07d4ad153f` | `9d77e20b0f11c3875ec6529a8e607a448b1ce848` |
| c4-container-view | `docs/design/epic-payments/option-1.mmd` | `b95e055a9188111a2258c721f2988da35fa7deeb39746ac61333a77ae7a44084` | `62a71f8ced4f7672d6e75278f5e275243b16c088` |
| c4-container-view | `docs/design/epic-payments/option-2.mmd` | `cd5c18daf4566bf407602976877e4d222f2ff4511fd6c6aebc877245d09f569c` | `f73ff491a5fce13421a21ead59dd1b2b03755c04` |
| c4-container-view | `docs/design/epic-payments/option-3.mmd` | `2a8ce0955ab0a4db1c270df706071c602817c8f8d12d484c6933e584bc1895f7` | `de872784043fe49fa5ff77186e6789cebdc881fc` |
| c4-context-view | `docs/design/epic-payments/context.mmd` | `2fbb906044f7adda03fa21ee65180cb842579bd7b3e14ef790f50243f0f7ccca` | `3974c6ad5533ff9ed7fd8833eb2052de1682f282` |
| data-flow-view | `docs/design/epic-payments/option-1-data-flow.mmd` | `ae9c43f03c261ac776537353c75e7066fd07e6fc3149489c73fb273a7b9adb72` | `1b9b5ba96f8d9445a54b1e2d1a06d375f3e2bf79` |
| data-flow-view | `docs/design/epic-payments/option-2-data-flow.mmd` | `2a74d7622a952259d39449a8d37c3ec3a4617816151cd6da7da96973533018fd` | `b07ab2b86361af7e1a5338c51f8d1f7566248188` |
| data-flow-view | `docs/design/epic-payments/option-3-data-flow.mmd` | `7194cd81f32861cb8fb0844cc0e837dbb3e72ea23451ac6cf20173cdc856a7bf` | `7cc6a510ee8b8355d3cb8f5bd77f6b353df8297b` |
| threat-model | `docs/design/epic-payments/threat-model.md` | `f6a84d1f66849a8a9394d0dab3b9402ceba1ce9160e9da723e15335e9610758e` | `186ebeeddccaa50030f4fdf19f66441df11fb2b2` |

## Lineage

- Requirement: 2b91c314-71a5-4718-82de-83260faf4f31
- Edge: g2-sign
- Version signed: 7

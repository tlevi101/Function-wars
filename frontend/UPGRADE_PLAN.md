# Frontend Angular Upgrade Plan

This document is the "plan it later" half of the frontend vulnerability work.
The **overrides** applied in `package.json` already neutralise the build-time
criticals/highs and the runtime `firebase` / `ws` / `socket.io` issues **without**
changing the framework. What remains can only be cleared by moving the framework
forward, because the project is currently pinned to **Angular 15** (current
Angular is 19/20).

## What the overrides did NOT (and cannot) fix

These stay until the framework is upgraded — they require a newer Angular/devkit:

| Package | Severity | Why it needs the upgrade |
|---|---|---|
| `@angular/core` / `common` / `compiler` | high | The framework itself — only fixed in Angular 19.2.16+ |
| `esbuild`, `webpack-dev-server` | moderate | Pinned by `@angular-devkit/build-angular@15`; bumping in place breaks the dev server |
| `minimatch`, `path-to-regexp`, `ajv`, `js-yaml`, `yaml`, `picomatch` | mixed | Multiple major versions coexist in the tree; a single override would break one consumer. New devkit collapses these to one patched major |
| `ip` | high | **No patched version exists** (latest 2.0.1 is still vulnerable); only resolved by dropping the dependency that pulls it (old webpack-dev-server) |
| `@tootallnate/once`, `tmp`, `lodash`, `uuid` | low/moderate | Transitive dev-tooling; new devkit/eslint replaces them |

> After the upgrade, **most of the `overrides` block in `package.json` can be
> deleted** — the patched versions arrive naturally through the new
> `@angular-devkit/build-angular`. Remove them and re-run `npm audit` to confirm.

## Pre-flight

- [ ] Commit/stash all current work — `ng update` rewrites many files.
- [ ] Node version: Angular 16 needs Node 16/18; 17 needs 18.13+; 18/19 need 18.19+/20.11+. You're on Node 20 — fine for all steps.
- [ ] Make sure the app builds and runs **before** starting (`npx ng build`, `npx ng serve`).
- [ ] Do it on a dedicated branch, one major per commit, so each step is revertable.

## Stepwise upgrade (one major at a time — never skip)

Angular only supports upgrading **one major at a time**. Use the official guide at
https://angular.dev/update-guide (set "from 15.0" / "to 16.0", etc.) for the exact
breaking changes each step.

### 15 → 16
```bash
npx ng update @angular/core@16 @angular/cli@16
npx ng update @angular/fire@16        # if a matching line exists; otherwise bump firebase deps manually
npx ng update @angular-eslint/schematics@16
```
Watch for: `@angular/material`-style guards (n/a here), RxJS 7 already satisfied,
`zone.js` bump (0.13). ng-bootstrap → `^15`.

### 16 → 17
```bash
npx ng update @angular/core@17 @angular/cli@17
npx ng update @angular-eslint/schematics@17
```
Angular 17 switches the build to **esbuild/Vite** by default (`application` builder)
— this is what clears the `webpack-dev-server`/`esbuild`/`webpack` advisories.
New control-flow syntax (`@if`/`@for`) is opt-in; the old `*ngIf`/`*ngFor` still work.
ng-bootstrap → `^16`.

### 17 → 18
```bash
npx ng update @angular/core@18 @angular/cli@18
npx ng update @angular-eslint/schematics@18
```
ng-bootstrap → `^17`.

### 18 → 19
```bash
npx ng update @angular/core@19 @angular/cli@19
npx ng update @angular-eslint/schematics@19
```
ng-bootstrap → `^18`. This is the version that satisfies the `@angular/*` advisories.

### Firebase / @angular/fire
`@angular/fire@7` (current) is the modular AngularFire. Bump it in lockstep with each
Angular major (`@angular/fire@16/17/18`). The underlying `firebase` SDK is already on a
patched `^10.14` from this round; `@angular/fire` ≥ 17 pairs with `firebase@10/11`.
The API is already modular (`provideFirebaseApp`, `getAuth`, etc.) so changes should be small.

### ngx-socket-io
`ngx-socket-io@4.10` requires Angular 21 peers, but the older 4.4–4.8 line works through
Angular 19. After reaching Angular 19, set `ngx-socket-io` to the highest version whose
peer range includes 19 (check `npm view ngx-socket-io peerDependencies`). The runtime
`ws`/`engine.io`/`socket.io-parser` advisories are already handled by overrides and by the
newer `socket.io-client` that ships with it.

## After each step
```bash
npx ng build            # must succeed
npx ng serve            # smoke-test the app in the browser
npm audit               # watch the count drop each major
```

## Expected end state
After 15→19 + `@angular/fire`@18/19 + `@ng-bootstrap`@18 + `@angular-eslint`@19, and after
deleting the now-redundant `overrides`, `npm audit` should be at or near **0**, with the
toolchain on currently-supported, patched releases.

## Code-level breaking changes to budget for
- **Standalone-by-default** (17+): app still works with NgModules; no forced migration.
- **`provideHttpClient` / `provideRouter`** patterns (optional).
- **Typed forms** (already from 14) — no action.
- **`ng test` / karma**: Angular 16+ still supports karma; 17+ nudges toward web-test-runner
  but karma keeps working. Your `karma`/`jasmine` devDeps may need a bump (`ng update` handles it).
- Re-run `npm run lint` after the `@angular-eslint` bumps — a few rule renames are likely.

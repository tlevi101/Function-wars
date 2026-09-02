# Function Wars OpenAPI contract

OpenAPI 3.0.3 description of the Function Wars backend's HTTP API, intended as the contract for
a C# reimplementation of the backend (or a C# client of the existing Node backend).

## Layout

The spec is split into many small files instead of one large document:

```
openapi.yaml                  entry point: info, servers, tags, security, paths index, components index
paths/<resource>/<file>.yaml  one Path Item Object per URL (all its HTTP methods together)
components/schemas/*.yaml     request/response models, grouped by domain
components/responses/*.yaml   reusable error responses (401/403/404/etc.)
components/parameters/*.yaml  reusable path parameters
```

`openapi.yaml` references every path and schema file by relative `$ref`, so the whole tree is a
single valid OpenAPI document — no bundling is required to read or validate it. Bundling is only
useful for feeding the spec to a tool that expects one file (see below).

## Validating / bundling

```bash
npx @redocly/cli lint documentation/openapi/openapi.yaml
npx @redocly/cli bundle documentation/openapi/openapi.yaml -o openapi.bundled.yaml
```

Both were used to sanity-check this spec while writing it. `lint` reports the document valid
with three cosmetic warnings: missing `license`, a `localhost` server entry, and the health
check having no 4xx response — all expected.

## Generating a C# client (sanity check / starting point)

```bash
npx @openapitools/openapi-generator-cli generate \
  -i openapi.bundled.yaml -g csharp -o ./csharp-client
```

This was run against the bundled spec while authoring it and produced one API class per tag
(`AuthApi`, `FieldsApi`, `GamesApi`, ...) and one model class per schema, including clean C#
types for the two `oneOf`/`discriminator` unions in the spec (`SessionUser` →
`RegisteredSessionUser` / `GuestSessionUser`, and `ParticipantId`). If you're implementing the
backend in C# rather than generating a client, treat the generated model shapes (property names,
nullability, enums) as the DTO contract to match, and the per-tag Api classes as the controller
surface to match.

## Design notes for the C# implementer

- **IDs**: every database-backed resource (`User`, `Field`, `Friendship`, `Report`, `Chat`) has
  an `int32` primary key. The only place a union type shows up is `ParticipantId`
  (`components/schemas/game.yaml`), used for game/waiting-room/group-chat participants, because
  guest sessions are identified by a UUID string instead of a database id. Model it as a
  discriminated union, or collapse it to `string` if that's simpler for your stack.
- **Auth**: bearer JWT (`Authorization: Bearer <jwt>`), see the `bearerAuth` security scheme.
  The decoded token shape is `SessionUser` (`components/schemas/user.yaml`) — a discriminated
  union of `RegisteredSessionUser` and `GuestSessionUser` on the `type` field. The two
  discriminator values are `"user"` and `"guest"`; **registered users are `"user"`, not
  `"registeredUser"`**, despite the stale TypeScript declaration in
  `backend/types/controllers/Interfaces.ts` (nothing reads it at runtime — `toJSONForJWT()` in
  `backend/models/user.js` and the Angular client both use `"user"`). Both members also carry
  `JWT_createdAt` and `iat`, and guests additionally carry a redundant `guest: true`; these are
  modeled because the decoded token is echoed verbatim into waiting-room rosters and the
  `receive invite` socket event, so they show up in real response bodies. Most endpoints reject
  guests with a 403; this is called out per-operation rather than modeled as a separate security
  scheme, since the server-side check is a runtime `if`, not a route-level policy.
- **Error envelope**: which envelope you get depends on *where* the error is produced, not on
  the status code.
  - Controller-produced errors — every 400/403/404 here — are `{ "message": string }`
    (`ErrorResponse`/`MessageResponse`: same shape, different semantic intent). Field-validation
    failures on field create/update extend this to `{ "message": string, "detail": [...] }`
    (`ValidationErrorResponse`).
  - Errors raised before a controller runs never get a `message`. They fall through to the
    generic Express handler in `backend/app.js`, which emits `{ "error": string }`. **Every 401
    is in this group** (`AuthErrorResponse`), because the JWT check is `express-jwt`
    middleware — e.g. `{"error":"No authorization token was found"}` or
    `{"error":"jwt malformed"}`. Sequelize `DatabaseError` 500s take the same route
    (`DatabaseErrorResponse`); those aren't attached to individual operations, but a C#
    implementation should expect a raw 500 in that alternate shape from the Node version.

    A client that reads `message` unconditionally will render an empty error for every expired
    or missing token, so handle both envelopes.
- **Soft deletes**: `Field` and `Report` both use an app-managed `deletedAt` column (not
  Sequelize `paranoid` mode) that is nullable and queryable. `DELETE` on either is a two-step
  toggle: first call sets `deletedAt`, second call on an already-deleted row destroys it for
  real.

## What's intentionally out of scope

This document covers the REST API only. Function Wars also runs a Socket.IO connection
(authenticated the same way, via a `token` query parameter on the socket handshake) that carries:

- real-time game turns (trajectory points, obstacle damage, turn changes)
- waiting room / custom game matchmaking (create, join, leave, kick, start, invite)
- friend chat and group chat message delivery
- presence (`route change`, connect/disconnect)

OpenAPI has no vocabulary for Socket.IO events, so these are not described here. That contract
now lives separately at `documentation/asyncapi` (AsyncAPI 3.0), covering all 28 events with the
same multi-file layout and design notes as this document — see its README for details.

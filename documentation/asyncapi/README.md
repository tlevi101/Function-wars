# Function Wars AsyncAPI contract

AsyncAPI 3.0.0 description of the Function Wars backend's realtime layer: the Socket.IO events
that run alongside the REST API described in `documentation/openapi`. Same purpose as that
document — a contract for a C# reimplementation (or client) of the backend — extended to cover
the half of the API that OpenAPI can't express.

Built from both sides of the wire: the backend's socket handlers (`backend/app.js`,
`backend/types/controllers/*.ts`, `backend/types/utils/*.ts`) and the Angular frontend's socket
usage (`frontend/src/app/services/*.ts`), so it also captures a couple of things the backend
alone wouldn't show — e.g. the frontend emits a legacy `token` field on some chat messages that
the server silently ignores, and a `join group chat` event the frontend emits that the backend
never listens for at all (see notes below).

## Layout

Same philosophy as `documentation/openapi`: many small files, split by concern.

```
asyncapi.yaml                    entry point: info, servers, security, channels index, operations index, components index
channels/<domain>/<event>.yaml   one Channel Object per Socket.IO event (its address + message)
operations/<domain>/<event>.yaml one Operation Object per event (action: send/receive + a $ref to its channel)
components/schemas/*.yaml        payload schemas, grouped by domain
```

`asyncapi.yaml` references every channel/operation/schema file by relative `$ref`; the whole
tree is one valid document with no bundling required to read it.

**Shared schemas**: geometry, `GamePlayer`, `GameField`, `ChatMessage`, `GroupChatMessage`, and
`MessageResponse` are not redefined here — they `$ref` straight into
`documentation/openapi/components/schemas/*.yaml`, the same files the OpenAPI document uses, so
there's one definition of each shared domain type instead of two that could drift apart.
`SessionUser` is the one exception: `components/schemas/session-user.yaml` restates it locally
because AsyncAPI's schema dialect requires `discriminator` to be the bare property name
(`discriminator: type`), while OpenAPI 3.0 requires the `{propertyName, mapping}` object form —
same two member schemas (`RegisteredSessionUser` / `GuestSessionUser`, still `$ref`'d from the
OpenAPI files), just a different wrapper per spec's rules. Note the discriminator values are
`"user"` and `"guest"` — registered users are `"user"`, not `"registeredUser"`; see the OpenAPI
README's design notes.

**Caveat on the shared schemas**: the files under `documentation/openapi` are written in the
OpenAPI 3.0 schema dialect, while AsyncAPI 3.0 defaults to JSON Schema draft-07. The keywords
overlap almost entirely, but `nullable: true` is an OpenAPI-only spelling that draft-07 ignores.
So a *structural* reader (the AsyncAPI parser, a human, an LLM) resolves these correctly, while
a strict draft-07 *payload* validator would reject the legitimately-null values: `deletedAt` on
`joined game`'s `field`, and `banned_reason` on `receive invite`'s `inviter`. Treat the shared
schemas as the payload contract to read, not as a validator to run unmodified.

## Validating / bundling

```bash
npx @asyncapi/cli validate documentation/asyncapi/asyncapi.yaml
npx @asyncapi/cli bundle documentation/asyncapi/asyncapi.yaml -o asyncapi.bundled.yaml
```

Both were run while authoring this document (`validate` passes clean).

## How to read this document

Every operation is written from **the server's** point of view, matching how the OpenAPI doc
describes the server's HTTP endpoints:

- `action: receive` — the server receives this message. The client sends it. (10 events, e.g.
  `join custom game`, `send chat message`.)
- `action: send` — the server sends this message. The client receives it. (18 events, e.g.
  `receive function`, `banned`.)

That is 28 channels/operations in total, matching every `socket.on()` handler registered in
`backend/app.js` and every `emit()` site in the backend. Socket.IO's built-in `disconnect`
handler is deliberately not counted or modeled — see below.

There is exactly one Socket.IO connection per client, on the default namespace — every event
below is multiplexed over that one connection, not separate URLs. `address` on each channel is
the literal Socket.IO event name (yes, including the ones with spaces in them, like
`'create custom game'` — that's copied verbatim from the existing code, not a typo).

### Connecting
The client passes its JWT as a `token` query parameter on the Socket.IO handshake (`servers.*
.security` / `components.securitySchemes.handshakeToken`) — not an `Authorization` header, since
the handshake happens before per-message headers exist. It's the same JWT as the REST API's
`bearerAuth`, including guest JWTs from `POST /register-guest`. There is no anonymous access.

### What's not modeled as a channel
- Socket.IO's built-in `connect`/`disconnect` lifecycle isn't a custom application message, so
  it isn't a channel here — but `disconnect` does have app-specific behavior worth knowing: it
  triggers the same cleanup as navigating away, but only after a 10 second grace period
  (`SocketConnectionService.TIME_TO_RECONNECT` in the current backend), to tolerate a client's
  brief network drop or page refresh without instantly forfeiting their game/room. A C#
  implementation should replicate this grace period, not just react to the disconnect directly.
- `route change` (documented as a normal channel here) is the mechanism that grace period and
  reconnect-detection actually key off of — the server infers "user left the game screen" /
  "user came back to the game screen" from the URLs a client reports, not from any dedicated
  join/leave-game event.

### Known frontend/backend mismatches worth knowing before reimplementing
- `GroupChatService.joinGroupChat()` in the frontend emits `'join group chat'` — there is no
  server-side listener for that event name at all (grep confirms it). It's dead code left over
  from before group-chat joining was folded into `join custom game`'s server-side flow. Not
  included as a channel here since the server does nothing with it; a clean C# implementation
  can ignore it.
- `send chat message` and `send group chat message` both carry a `token` field from the current
  frontend that the server payload destructuring never reads (auth is already established at
  connection time). Modeled here as an optional, documented-as-ignored property rather than
  omitted, so a strict payload validator on the new backend doesn't reject real frontend
  traffic.
- `owner left` and `wait room owner left` are two distinct events fired back-to-back from the
  same room-teardown code path, and they reach the *same* recipients: the departing owner is
  already out of the room's socket list by the time either fires, so neither reaches them. The
  redundancy is historical, not a routing distinction. A client only needs one of them to detect
  closure — the current frontend listens only for `wait room owner left` — but both are
  genuinely on the wire.

## C# implementation notes

AsyncAPI's code generation ecosystem doesn't have a mature C#/SignalR target the way OpenAPI's
generators cover C# REST clients — this document is meant to be read (by a person or an LLM) as
the authoritative payload contract, not fed through a generator. Suggested mapping if
implementing this in ASP.NET Core: one SignalR hub, one hub method per `action: receive`
operation (`CreateCustomGame(CreateCustomGamePayload)`, ...), and one strongly-typed client
interface method per `action: send` operation (`ReceiveFunction(ReceiveFunctionPayload)`, ...) —
each payload schema here maps directly to a C# record/DTO the same way the OpenAPI schemas do.

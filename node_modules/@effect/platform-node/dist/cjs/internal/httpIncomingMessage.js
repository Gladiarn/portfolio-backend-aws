"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HttpIncomingMessageImpl = void 0;
var Headers = _interopRequireWildcard(require("@effect/platform/Headers"));
var IncomingMessage = _interopRequireWildcard(require("@effect/platform/HttpIncomingMessage"));
var UrlParams = _interopRequireWildcard(require("@effect/platform/UrlParams"));
var Effect = _interopRequireWildcard(require("effect/Effect"));
var FiberRef = _interopRequireWildcard(require("effect/FiberRef"));
var Inspectable = _interopRequireWildcard(require("effect/Inspectable"));
var Option = _interopRequireWildcard(require("effect/Option"));
var NodeStream = _interopRequireWildcard(require("../NodeStream.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/** @internal */
class HttpIncomingMessageImpl extends Inspectable.Class {
  source;
  onError;
  remoteAddressOverride;
  [IncomingMessage.TypeId];
  constructor(source, onError, remoteAddressOverride) {
    super();
    this.source = source;
    this.onError = onError;
    this.remoteAddressOverride = remoteAddressOverride;
    this[IncomingMessage.TypeId] = IncomingMessage.TypeId;
  }
  get headers() {
    return Headers.fromInput(this.source.headers);
  }
  get remoteAddress() {
    return Option.fromNullable(this.remoteAddressOverride ?? this.source.socket.remoteAddress);
  }
  textEffect;
  get text() {
    if (this.textEffect) {
      return this.textEffect;
    }
    this.textEffect = Effect.runSync(Effect.cached(Effect.flatMap(FiberRef.get(IncomingMessage.maxBodySize), maxBodySize => NodeStream.toString(() => this.source, {
      onFailure: this.onError,
      maxBytes: Option.getOrUndefined(maxBodySize)
    }))));
    return this.textEffect;
  }
  get unsafeText() {
    return Effect.runSync(this.text);
  }
  get json() {
    return Effect.tryMap(this.text, {
      try: _ => _ === "" ? null : JSON.parse(_),
      catch: this.onError
    });
  }
  get unsafeJson() {
    return Effect.runSync(this.json);
  }
  get urlParamsBody() {
    return Effect.flatMap(this.text, _ => Effect.try({
      try: () => UrlParams.fromInput(new URLSearchParams(_)),
      catch: this.onError
    }));
  }
  get stream() {
    return NodeStream.fromReadable(() => this.source, this.onError);
  }
  get arrayBuffer() {
    return Effect.flatMap(FiberRef.get(IncomingMessage.maxBodySize), maxBodySize => NodeStream.toUint8Array(() => this.source, {
      onFailure: this.onError,
      maxBytes: Option.getOrUndefined(maxBodySize)
    }));
  }
}
exports.HttpIncomingMessageImpl = HttpIncomingMessageImpl;
//# sourceMappingURL=httpIncomingMessage.js.map
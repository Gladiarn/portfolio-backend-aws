"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeHandler = exports.make = exports.layerTest = exports.layerServer = exports.layerConfig = exports.layer = void 0;
var internal = _interopRequireWildcard(require("./internal/httpServer.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * @since 1.0.0
 * @category constructors
 */
const make = exports.make = internal.make;
/**
 * @since 1.0.0
 * @category constructors
 */
const makeHandler = exports.makeHandler = internal.makeHandler;
/**
 * @since 1.0.0
 * @category layers
 */
const layerServer = exports.layerServer = internal.layerServer;
/**
 * @since 1.0.0
 * @category layers
 */
const layer = exports.layer = internal.layer;
/**
 * @since 1.0.0
 * @category layers
 */
const layerConfig = exports.layerConfig = internal.layerConfig;
/**
 * Layer starting a server on a random port and producing an `HttpClient`
 * with prepended url of the running http server.
 *
 * @example
 * import { HttpClientRequest, HttpRouter, HttpServer } from "@effect/platform"
 * import { NodeHttpServer } from "@effect/platform-node"
 * import { Effect } from "effect"
 *
 * Effect.gen(function*() {
 *   yield* HttpServer.serveEffect(HttpRouter.empty)
 *   const response = yield* HttpClientRequest.get("/")
 *   assert.strictEqual(response.status, 404)
 * }).pipe(Effect.provide(NodeHttpServer.layerTest))
 *
 * @since 1.0.0
 * @category layers
 */
const layerTest = exports.layerTest = internal.layerTest;
//# sourceMappingURL=NodeHttpServer.js.map
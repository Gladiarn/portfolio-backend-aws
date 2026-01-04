import * as internal from "./internal/httpServer.js";
/**
 * @since 1.0.0
 * @category constructors
 */
export const make = internal.make;
/**
 * @since 1.0.0
 * @category constructors
 */
export const makeHandler = internal.makeHandler;
/**
 * @since 1.0.0
 * @category layers
 */
export const layerServer = internal.layerServer;
/**
 * @since 1.0.0
 * @category layers
 */
export const layer = internal.layer;
/**
 * @since 1.0.0
 * @category layers
 */
export const layerConfig = internal.layerConfig;
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
export const layerTest = internal.layerTest;
//# sourceMappingURL=NodeHttpServer.js.map
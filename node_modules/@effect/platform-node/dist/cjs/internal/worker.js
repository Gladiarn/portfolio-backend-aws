"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.layerWorker = exports.layerManager = exports.layer = void 0;
var Worker = _interopRequireWildcard(require("@effect/platform/Worker"));
var _WorkerError = require("@effect/platform/WorkerError");
var Deferred = _interopRequireWildcard(require("effect/Deferred"));
var Effect = _interopRequireWildcard(require("effect/Effect"));
var Exit = _interopRequireWildcard(require("effect/Exit"));
var Layer = _interopRequireWildcard(require("effect/Layer"));
var Scope = _interopRequireWildcard(require("effect/Scope"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const platformWorkerImpl = /*#__PURE__*/Worker.makePlatform()({
  setup({
    scope,
    worker
  }) {
    return Effect.flatMap(Deferred.make(), exitDeferred => {
      worker.on("exit", () => {
        Deferred.unsafeDone(exitDeferred, Exit.void);
      });
      return Effect.as(Scope.addFinalizer(scope, Effect.suspend(() => {
        worker.postMessage([1]);
        return Deferred.await(exitDeferred);
      }).pipe(Effect.timeout(5000), Effect.catchAllCause(() => Effect.sync(() => worker.terminate())))), worker);
    });
  },
  listen({
    deferred,
    emit,
    port
  }) {
    port.on("message", message => {
      emit(message);
    });
    port.on("messageerror", cause => {
      Deferred.unsafeDone(deferred, new _WorkerError.WorkerError({
        reason: "decode",
        cause
      }));
    });
    port.on("error", cause => {
      Deferred.unsafeDone(deferred, new _WorkerError.WorkerError({
        reason: "unknown",
        cause
      }));
    });
    port.on("exit", code => {
      Deferred.unsafeDone(deferred, new _WorkerError.WorkerError({
        reason: "unknown",
        cause: new Error(`exited with code ${code}`)
      }));
    });
    return Effect.void;
  }
});
/** @internal */
const layerWorker = exports.layerWorker = /*#__PURE__*/Layer.succeed(Worker.PlatformWorker, platformWorkerImpl);
/** @internal */
const layerManager = exports.layerManager = /*#__PURE__*/Layer.provide(Worker.layerManager, layerWorker);
/** @internal */
const layer = spawn => Layer.merge(layerManager, Worker.layerSpawner(spawn));
exports.layer = layer;
//# sourceMappingURL=worker.js.map
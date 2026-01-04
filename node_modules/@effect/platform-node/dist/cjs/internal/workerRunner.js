"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.layer = void 0;
var _WorkerError = require("@effect/platform/WorkerError");
var Runner = _interopRequireWildcard(require("@effect/platform/WorkerRunner"));
var Deferred = _interopRequireWildcard(require("effect/Deferred"));
var Effect = _interopRequireWildcard(require("effect/Effect"));
var Exit = _interopRequireWildcard(require("effect/Exit"));
var FiberId = _interopRequireWildcard(require("effect/FiberId"));
var FiberSet = _interopRequireWildcard(require("effect/FiberSet"));
var Layer = _interopRequireWildcard(require("effect/Layer"));
var Scope = _interopRequireWildcard(require("effect/Scope"));
var WorkerThreads = _interopRequireWildcard(require("node:worker_threads"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const platformRunnerImpl = /*#__PURE__*/Runner.PlatformRunner.of({
  [Runner.PlatformRunnerTypeId]: Runner.PlatformRunnerTypeId,
  start() {
    return Effect.gen(function* () {
      if (!WorkerThreads.parentPort) {
        return yield* new _WorkerError.WorkerError({
          reason: "spawn",
          cause: new Error("not in a worker thread")
        });
      }
      const port = WorkerThreads.parentPort;
      const send = (_portId, message, transfers) => Effect.sync(() => port.postMessage([1, message], transfers));
      const run = handler => Effect.uninterruptibleMask(restore => Scope.make().pipe(Effect.bindTo("scope"), Effect.bind("fiberSet", ({
        scope
      }) => FiberSet.make().pipe(Scope.extend(scope))), Effect.bind("runFork", ({
        fiberSet
      }) => FiberSet.runtime(fiberSet)()), Effect.tap(({
        fiberSet,
        runFork
      }) => {
        port.on("message", message => {
          if (message[0] === 0) {
            runFork(restore(handler(0, message[1])));
          } else {
            Deferred.unsafeDone(fiberSet.deferred, Exit.interrupt(FiberId.none));
          }
        });
        port.on("messageerror", cause => {
          Deferred.unsafeDone(fiberSet.deferred, new _WorkerError.WorkerError({
            reason: "decode",
            cause
          }));
        });
        port.on("error", cause => {
          Deferred.unsafeDone(fiberSet.deferred, new _WorkerError.WorkerError({
            reason: "unknown",
            cause
          }));
        });
        port.postMessage([0]);
      }), Effect.flatMap(({
        fiberSet,
        scope
      }) => restore(FiberSet.join(fiberSet)).pipe(Effect.ensuring(Scope.close(scope, Exit.void))))));
      return {
        run,
        send
      };
    });
  }
});
/** @internal */
const layer = exports.layer = /*#__PURE__*/Layer.succeed(Runner.PlatformRunner, platformRunnerImpl);
//# sourceMappingURL=workerRunner.js.map
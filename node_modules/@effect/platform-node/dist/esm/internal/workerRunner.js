import { WorkerError } from "@effect/platform/WorkerError";
import * as Runner from "@effect/platform/WorkerRunner";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as FiberId from "effect/FiberId";
import * as FiberSet from "effect/FiberSet";
import * as Layer from "effect/Layer";
import * as Scope from "effect/Scope";
import * as WorkerThreads from "node:worker_threads";
const platformRunnerImpl = /*#__PURE__*/Runner.PlatformRunner.of({
  [Runner.PlatformRunnerTypeId]: Runner.PlatformRunnerTypeId,
  start() {
    return Effect.gen(function* () {
      if (!WorkerThreads.parentPort) {
        return yield* new WorkerError({
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
          Deferred.unsafeDone(fiberSet.deferred, new WorkerError({
            reason: "decode",
            cause
          }));
        });
        port.on("error", cause => {
          Deferred.unsafeDone(fiberSet.deferred, new WorkerError({
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
export const layer = /*#__PURE__*/Layer.succeed(Runner.PlatformRunner, platformRunnerImpl);
//# sourceMappingURL=workerRunner.js.map
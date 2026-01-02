/**
 * @since 1.0.0
 */
import * as Socket from "@effect/platform/Socket";
import * as Channel from "effect/Channel";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as FiberRef from "effect/FiberRef";
import * as FiberSet from "effect/FiberSet";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Queue from "effect/Queue";
import * as Scope from "effect/Scope";
import * as Net from "node:net";
/**
 * @since 1.0.0
 * @category tags
 */
export const NetSocket = /*#__PURE__*/Context.GenericTag("@effect/platform-node/NodeSocket/NetSocket");
const EOF = /*#__PURE__*/Symbol.for("@effect/experimental/Socket/Node/EOF");
/**
 * @since 1.0.0
 * @category constructors
 */
export const makeNet = options => fromDuplex(Effect.acquireRelease(Effect.async(resume => {
  const conn = Net.createConnection(options);
  conn.on("connect", () => {
    conn.removeAllListeners();
    resume(Effect.succeed(conn));
  });
  conn.on("error", cause => {
    resume(Effect.fail(new Socket.SocketGenericError({
      reason: "Open",
      cause
    })));
  });
  return Effect.sync(() => {
    conn.destroy();
  });
}), conn => Effect.sync(() => {
  if (conn.closed === false) {
    if ("destroySoon" in conn) {
      conn.destroySoon();
    } else {
      ;
      conn.destroy();
    }
  }
  conn.removeAllListeners();
})));
/**
 * @since 1.0.0
 * @category constructors
 */
export const fromDuplex = open => FiberRef.get(Socket.currentSendQueueCapacity).pipe(Effect.flatMap(sendQueueCapacity => Queue.dropping(sendQueueCapacity)), Effect.bindTo("sendQueue"), Effect.bind("openContext", () => Effect.context()), Effect.map(({
  openContext,
  sendQueue
}) => {
  const run = handler => Effect.scope.pipe(Effect.bindTo("scope"), Effect.bind("conn", ({
    scope
  }) => open.pipe(Effect.provide(Context.add(openContext, Scope.Scope, scope)))), Effect.bind("fiberSet", _ => FiberSet.make()), Effect.bind("run", ({
    conn,
    fiberSet
  }) => FiberSet.runtime(fiberSet)().pipe(Effect.provideService(NetSocket, conn))), Effect.tap(({
    conn,
    fiberSet
  }) => Queue.take(sendQueue).pipe(Effect.tap(chunk => Effect.async(resume => {
    if (Socket.isCloseEvent(chunk)) {
      conn.destroy(chunk.code > 1000 ? new Error(`closed with code ${chunk.code}`) : undefined);
    } else if (chunk === EOF) {
      conn.end(() => resume(Effect.void));
    } else {
      conn.write(chunk, cause => {
        resume(cause ? Effect.fail(new Socket.SocketGenericError({
          reason: "Write",
          cause
        })) : Effect.void);
      });
    }
    return Effect.void;
  })), Effect.forever, Effect.withUnhandledErrorLogLevel(Option.none()), FiberSet.run(fiberSet))), Effect.tap(({
    conn,
    fiberSet,
    run
  }) => {
    conn.on("data", chunk => {
      const result = handler(chunk);
      if (Effect.isEffect(result)) {
        run(result);
      }
    });
    return Effect.async(resume => {
      function onEnd() {
        resume(Effect.void);
      }
      function onError(cause) {
        resume(Effect.fail(new Socket.SocketGenericError({
          reason: "Read",
          cause
        })));
      }
      function onClose(hadError) {
        resume(Effect.fail(new Socket.SocketCloseError({
          reason: "Close",
          code: hadError ? 1006 : 1000
        })));
      }
      conn.on("end", onEnd);
      conn.on("error", onError);
      conn.on("close", onClose);
      return Effect.sync(() => {
        conn.off("end", onEnd);
        conn.off("error", onError);
        conn.off("close", onClose);
      });
    }).pipe(Effect.raceFirst(FiberSet.join(fiberSet)));
  }), Effect.scoped, Effect.interruptible);
  const write = chunk => Queue.offer(sendQueue, chunk);
  const writer = Effect.acquireRelease(Effect.succeed(write), () => Queue.offer(sendQueue, EOF));
  return Socket.Socket.of({
    [Socket.TypeId]: Socket.TypeId,
    run,
    runRaw: run,
    writer
  });
}));
/**
 * @since 1.0.0
 * @category constructors
 */
export const makeNetChannel = options => Channel.unwrapScoped(Effect.map(makeNet(options), Socket.toChannelWith()));
/**
 * @since 1.0.0
 * @category layers
 */
export const layerNet = options => Layer.effect(Socket.Socket, makeNet(options));
//# sourceMappingURL=NodeSocket.js.map
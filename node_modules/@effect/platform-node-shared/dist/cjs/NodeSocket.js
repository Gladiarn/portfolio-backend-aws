"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeNetChannel = exports.makeNet = exports.layerNet = exports.fromDuplex = exports.NetSocket = void 0;
var Socket = _interopRequireWildcard(require("@effect/platform/Socket"));
var Channel = _interopRequireWildcard(require("effect/Channel"));
var Context = _interopRequireWildcard(require("effect/Context"));
var Effect = _interopRequireWildcard(require("effect/Effect"));
var FiberRef = _interopRequireWildcard(require("effect/FiberRef"));
var FiberSet = _interopRequireWildcard(require("effect/FiberSet"));
var Layer = _interopRequireWildcard(require("effect/Layer"));
var Option = _interopRequireWildcard(require("effect/Option"));
var Queue = _interopRequireWildcard(require("effect/Queue"));
var Scope = _interopRequireWildcard(require("effect/Scope"));
var Net = _interopRequireWildcard(require("node:net"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * @since 1.0.0
 */

/**
 * @since 1.0.0
 * @category tags
 */
const NetSocket = exports.NetSocket = /*#__PURE__*/Context.GenericTag("@effect/platform-node/NodeSocket/NetSocket");
const EOF = /*#__PURE__*/Symbol.for("@effect/experimental/Socket/Node/EOF");
/**
 * @since 1.0.0
 * @category constructors
 */
const makeNet = options => fromDuplex(Effect.acquireRelease(Effect.async(resume => {
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
exports.makeNet = makeNet;
const fromDuplex = open => FiberRef.get(Socket.currentSendQueueCapacity).pipe(Effect.flatMap(sendQueueCapacity => Queue.dropping(sendQueueCapacity)), Effect.bindTo("sendQueue"), Effect.bind("openContext", () => Effect.context()), Effect.map(({
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
exports.fromDuplex = fromDuplex;
const makeNetChannel = options => Channel.unwrapScoped(Effect.map(makeNet(options), Socket.toChannelWith()));
/**
 * @since 1.0.0
 * @category layers
 */
exports.makeNetChannel = makeNetChannel;
const layerNet = options => Layer.effect(Socket.Socket, makeNet(options));
exports.layerNet = layerNet;
//# sourceMappingURL=NodeSocket.js.map
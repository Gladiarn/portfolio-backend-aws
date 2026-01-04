"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeAgentLayer = exports.makeAgent = exports.make = exports.layerWithoutAgent = exports.layer = exports.agentLayer = exports.HttpAgentTypeId = exports.HttpAgent = void 0;
var Cookies = _interopRequireWildcard(require("@effect/platform/Cookies"));
var Client = _interopRequireWildcard(require("@effect/platform/HttpClient"));
var Error = _interopRequireWildcard(require("@effect/platform/HttpClientError"));
var ClientResponse = _interopRequireWildcard(require("@effect/platform/HttpClientResponse"));
var IncomingMessage = _interopRequireWildcard(require("@effect/platform/HttpIncomingMessage"));
var Context = _interopRequireWildcard(require("effect/Context"));
var Effect = _interopRequireWildcard(require("effect/Effect"));
var _Function = require("effect/Function");
var Layer = _interopRequireWildcard(require("effect/Layer"));
var Stream = _interopRequireWildcard(require("effect/Stream"));
var Http = _interopRequireWildcard(require("node:http"));
var Https = _interopRequireWildcard(require("node:https"));
var _nodeStream = require("node:stream");
var _promises = require("node:stream/promises");
var NodeSink = _interopRequireWildcard(require("../NodeSink.js"));
var _httpIncomingMessage = require("./httpIncomingMessage.js");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/** @internal */
const HttpAgentTypeId = exports.HttpAgentTypeId = /*#__PURE__*/Symbol.for("@effect/platform-node/Http/NodeClient/HttpAgent");
/** @internal */
const HttpAgent = exports.HttpAgent = /*#__PURE__*/Context.GenericTag("@effect/platform-node/Http/NodeClient/HttpAgent");
/** @internal */
const makeAgent = options => Effect.map(Effect.all([Effect.acquireRelease(Effect.sync(() => new Http.Agent(options)), agent => Effect.sync(() => agent.destroy())), Effect.acquireRelease(Effect.sync(() => new Https.Agent(options)), agent => Effect.sync(() => agent.destroy()))]), ([http, https]) => ({
  [HttpAgentTypeId]: HttpAgentTypeId,
  http,
  https
}));
/** @internal */
exports.makeAgent = makeAgent;
const makeAgentLayer = options => Layer.scoped(HttpAgent, makeAgent(options));
/** @internal */
exports.makeAgentLayer = makeAgentLayer;
const agentLayer = exports.agentLayer = /*#__PURE__*/makeAgentLayer();
const fromAgent = agent => Client.makeService((request, url, signal) => {
  const nodeRequest = url.protocol === "https:" ? Https.request(url, {
    agent: agent.https,
    method: request.method,
    headers: request.headers,
    signal
  }) : Http.request(url, {
    agent: agent.http,
    method: request.method,
    headers: request.headers,
    signal
  });
  return (0, _Function.pipe)(Effect.zipRight(sendBody(nodeRequest, request, request.body), waitForResponse(nodeRequest, request), {
    concurrent: true
  }), Effect.map(_ => new ClientResponseImpl(request, _)));
});
const sendBody = (nodeRequest, request, body) => Effect.suspend(() => {
  switch (body._tag) {
    case "Empty":
      {
        nodeRequest.end();
        return waitForFinish(nodeRequest, request);
      }
    case "Uint8Array":
    case "Raw":
      {
        nodeRequest.end(body.body);
        return waitForFinish(nodeRequest, request);
      }
    case "FormData":
      {
        const response = new Response(body.formData);
        response.headers.forEach((value, key) => {
          nodeRequest.setHeader(key, value);
        });
        return Effect.tryPromise({
          try: () => (0, _promises.pipeline)(_nodeStream.Readable.fromWeb(response.body), nodeRequest),
          catch: cause => new Error.RequestError({
            request,
            reason: "Transport",
            cause
          })
        });
      }
    case "Stream":
      {
        return Stream.run(Stream.mapError(body.stream, cause => new Error.RequestError({
          request,
          reason: "Encode",
          cause
        })), NodeSink.fromWritable(() => nodeRequest, cause => new Error.RequestError({
          request,
          reason: "Transport",
          cause
        })));
      }
  }
});
const waitForResponse = (nodeRequest, request) => Effect.async(resume => {
  function onError(cause) {
    resume(Effect.fail(new Error.RequestError({
      request,
      reason: "Transport",
      cause
    })));
  }
  nodeRequest.on("error", onError);
  function onResponse(response) {
    nodeRequest.off("error", onError);
    resume(Effect.succeed(response));
  }
  nodeRequest.on("upgrade", onResponse);
  nodeRequest.on("response", onResponse);
  return Effect.sync(() => {
    nodeRequest.off("error", onError);
    nodeRequest.off("upgrade", onResponse);
    nodeRequest.off("response", onResponse);
  });
});
const waitForFinish = (nodeRequest, request) => Effect.async(resume => {
  function onError(cause) {
    resume(Effect.fail(new Error.RequestError({
      request,
      reason: "Transport",
      cause
    })));
  }
  nodeRequest.once("error", onError);
  function onFinish() {
    nodeRequest.off("error", onError);
    resume(Effect.void);
  }
  nodeRequest.once("finish", onFinish);
  return Effect.sync(() => {
    nodeRequest.off("error", onError);
    nodeRequest.off("finish", onFinish);
  });
});
class ClientResponseImpl extends _httpIncomingMessage.HttpIncomingMessageImpl {
  request;
  [ClientResponse.TypeId];
  constructor(request, source) {
    super(source, cause => new Error.ResponseError({
      request,
      response: this,
      reason: "Decode",
      cause
    }));
    this.request = request;
    this[ClientResponse.TypeId] = ClientResponse.TypeId;
  }
  get status() {
    return this.source.statusCode;
  }
  cachedCookies;
  get cookies() {
    if (this.cachedCookies !== undefined) {
      return this.cachedCookies;
    }
    const header = this.source.headers["set-cookie"];
    if (Array.isArray(header)) {
      return this.cachedCookies = Cookies.fromSetCookie(header);
    }
    return this.cachedCookies = Cookies.empty;
  }
  get formData() {
    return Effect.tryPromise({
      try: () => {
        const init = {
          headers: new globalThis.Headers(this.source.headers)
        };
        if (this.source.statusCode) {
          init.status = this.source.statusCode;
        }
        if (this.source.statusMessage) {
          init.statusText = this.source.statusMessage;
        }
        return new Response(_nodeStream.Readable.toWeb(this.source), init).formData();
      },
      catch: this.onError
    });
  }
  toJSON() {
    return IncomingMessage.inspect(this, {
      _id: "@effect/platform/HttpClientResponse",
      request: this.request.toJSON(),
      status: this.status
    });
  }
}
/** @internal */
const make = exports.make = /*#__PURE__*/Effect.map(HttpAgent, fromAgent);
/** @internal */
const layerWithoutAgent = exports.layerWithoutAgent = /*#__PURE__*/Client.layerMergedContext(make);
/** @internal */
const layer = exports.layer = /*#__PURE__*/Layer.provide(layerWithoutAgent, agentLayer);
//# sourceMappingURL=httpClient.js.map
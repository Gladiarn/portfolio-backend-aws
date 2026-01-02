"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeUndici = exports.makeDispatcher = exports.makeAgentLayer = exports.makeAgent = exports.make = exports.layerWithoutAgent = exports.layerUndiciWithoutDispatcher = exports.layerUndici = exports.layer = exports.dispatcherLayerGlobal = exports.dispatcherLayer = exports.agentLayer = exports.UndiciRequestOptions = exports.HttpAgentTypeId = exports.HttpAgent = exports.Dispatcher = void 0;
var Context = _interopRequireWildcard(require("effect/Context"));
var internal = _interopRequireWildcard(require("./internal/httpClient.js"));
var internalUndici = _interopRequireWildcard(require("./internal/httpClientUndici.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * @since 1.0.0
 * @category agent
 */
const HttpAgentTypeId = exports.HttpAgentTypeId = internal.HttpAgentTypeId;
/**
 * @since 1.0.0
 * @category agent
 */
const HttpAgent = exports.HttpAgent = internal.HttpAgent;
/**
 * @since 1.0.0
 * @category agent
 */
const makeAgent = exports.makeAgent = internal.makeAgent;
/**
 * @since 1.0.0
 * @category agent
 */
const agentLayer = exports.agentLayer = internal.agentLayer;
/**
 * @since 1.0.0
 * @category agent
 */
const makeAgentLayer = exports.makeAgentLayer = internal.makeAgentLayer;
/**
 * @since 1.0.0
 * @category constructors
 */
const make = exports.make = internal.make;
/**
 * @since 1.0.0
 * @category layers
 */
const layer = exports.layer = internal.layer;
/**
 * @since 1.0.0
 * @category layers
 */
const layerWithoutAgent = exports.layerWithoutAgent = internal.layerWithoutAgent;
/**
 * @since 1.0.0
 * @category undici
 */
const Dispatcher = exports.Dispatcher = internalUndici.Dispatcher;
/**
 * @since 1.0.0
 * @category undici
 */
const makeDispatcher = exports.makeDispatcher = internalUndici.makeDispatcher;
/**
 * @since 1.0.0
 * @category undici
 */
const dispatcherLayer = exports.dispatcherLayer = internalUndici.dispatcherLayer;
/**
 * @since 1.0.0
 * @category undici
 */
const dispatcherLayerGlobal = exports.dispatcherLayerGlobal = internalUndici.dispatcherLayerGlobal;
/**
 * @since 1.0.0
 * @category undici
 */
class UndiciRequestOptions extends /*#__PURE__*/Context.Tag(internalUndici.undiciOptionsTagKey)() {}
/**
 * @since 1.0.0
 * @category constructors
 */
exports.UndiciRequestOptions = UndiciRequestOptions;
const makeUndici = exports.makeUndici = internalUndici.make;
/**
 * @since 1.0.0
 * @category layers
 */
const layerUndici = exports.layerUndici = internalUndici.layer;
/**
 * @since 1.0.0
 * @category layers
 */
const layerUndiciWithoutDispatcher = exports.layerUndiciWithoutDispatcher = internalUndici.layerWithoutDispatcher;
//# sourceMappingURL=NodeHttpClient.js.map
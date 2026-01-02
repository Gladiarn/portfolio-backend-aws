"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.symbolResult = exports.symbol = exports.successSchema = exports.serializeSuccess = exports.serializeFailure = exports.serializeExit = exports.serialize = exports.selfSchema = exports.failureSchema = exports.exitSchema = exports.deserializeSuccess = exports.deserializeFailure = exports.deserializeExit = exports.deserialize = exports.asWithResult = exports.asSerializableWithResult = exports.asSerializable = void 0;
var _Function = require("effect/Function");
var _GlobalValue = require("effect/GlobalValue");
var serializable_ = _interopRequireWildcard(require("./internal/serializable.js"));
var Schema = _interopRequireWildcard(require("./Schema.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// ---------------------------------------------
// Serializable
// ---------------------------------------------
/**
 * @since 0.67.0
 * @category symbol
 */
const symbol = exports.symbol = serializable_.symbol;
/**
 * @since 0.69.0
 */
const asSerializable = serializable => serializable;
/**
 * @since 0.67.0
 * @category accessor
 */
exports.asSerializable = asSerializable;
const selfSchema = self => self[symbol];
/**
 * @since 0.67.0
 * @category encoding
 */
exports.selfSchema = selfSchema;
const serialize = self => Schema.encodeUnknown(self[symbol])(self);
/**
 * @since 0.67.0
 * @category decoding
 */
exports.serialize = serialize;
const deserialize = exports.deserialize = /*#__PURE__*/(0, _Function.dual)(2, (self, value) => Schema.decodeUnknown(self[symbol])(value));
// ---------------------------------------------
// WithResult
// ---------------------------------------------
/**
 * @since 0.67.0
 * @category symbol
 */
const symbolResult = exports.symbolResult = serializable_.symbolResult;
/**
 * @since 0.69.0
 */
const asWithResult = withExit => withExit;
/**
 * @since 0.67.0
 * @category accessor
 */
exports.asWithResult = asWithResult;
const failureSchema = self => self[symbolResult].failure;
/**
 * @since 0.67.0
 * @category accessor
 */
exports.failureSchema = failureSchema;
const successSchema = self => self[symbolResult].success;
exports.successSchema = successSchema;
const exitSchemaCache = /*#__PURE__*/(0, _GlobalValue.globalValue)("@effect/schema/Serializable/exitSchemaCache", () => new WeakMap());
/**
 * @since 0.67.0
 * @category accessor
 */
const exitSchema = self => {
  const proto = Object.getPrototypeOf(self);
  if (!(symbolResult in proto)) {
    return Schema.Exit({
      failure: failureSchema(self),
      success: successSchema(self),
      defect: Schema.Defect
    });
  }
  let schema = exitSchemaCache.get(proto);
  if (schema === undefined) {
    schema = Schema.Exit({
      failure: failureSchema(self),
      success: successSchema(self),
      defect: Schema.Defect
    });
    exitSchemaCache.set(proto, schema);
  }
  return schema;
};
/**
 * @since 0.67.0
 * @category encoding
 */
exports.exitSchema = exitSchema;
const serializeFailure = exports.serializeFailure = /*#__PURE__*/(0, _Function.dual)(2, (self, value) => Schema.encode(self[symbolResult].failure)(value));
/**
 * @since 0.67.0
 * @category decoding
 */
const deserializeFailure = exports.deserializeFailure = /*#__PURE__*/(0, _Function.dual)(2, (self, value) => Schema.decodeUnknown(self[symbolResult].failure)(value));
/**
 * @since 0.67.0
 * @category encoding
 */
const serializeSuccess = exports.serializeSuccess = /*#__PURE__*/(0, _Function.dual)(2, (self, value) => Schema.encode(self[symbolResult].success)(value));
/**
 * @since 0.67.0
 * @category decoding
 */
const deserializeSuccess = exports.deserializeSuccess = /*#__PURE__*/(0, _Function.dual)(2, (self, value) => Schema.decodeUnknown(self[symbolResult].success)(value));
/**
 * @since 0.67.0
 * @category encoding
 */
const serializeExit = exports.serializeExit = /*#__PURE__*/(0, _Function.dual)(2, (self, value) => Schema.encode(exitSchema(self))(value));
/**
 * @since 0.67.0
 * @category decoding
 */
const deserializeExit = exports.deserializeExit = /*#__PURE__*/(0, _Function.dual)(2, (self, value) => Schema.decodeUnknown(exitSchema(self))(value));
/**
 * @since 0.69.0
 */
const asSerializableWithResult = procedure => procedure;
exports.asSerializableWithResult = asSerializableWithResult;
//# sourceMappingURL=Serializable.js.map
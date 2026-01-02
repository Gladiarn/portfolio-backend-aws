import { dual } from "effect/Function";
import { globalValue } from "effect/GlobalValue";
import * as serializable_ from "./internal/serializable.js";
import * as Schema from "./Schema.js";
// ---------------------------------------------
// Serializable
// ---------------------------------------------
/**
 * @since 0.67.0
 * @category symbol
 */
export const symbol = serializable_.symbol;
/**
 * @since 0.69.0
 */
export const asSerializable = serializable => serializable;
/**
 * @since 0.67.0
 * @category accessor
 */
export const selfSchema = self => self[symbol];
/**
 * @since 0.67.0
 * @category encoding
 */
export const serialize = self => Schema.encodeUnknown(self[symbol])(self);
/**
 * @since 0.67.0
 * @category decoding
 */
export const deserialize = /*#__PURE__*/dual(2, (self, value) => Schema.decodeUnknown(self[symbol])(value));
// ---------------------------------------------
// WithResult
// ---------------------------------------------
/**
 * @since 0.67.0
 * @category symbol
 */
export const symbolResult = serializable_.symbolResult;
/**
 * @since 0.69.0
 */
export const asWithResult = withExit => withExit;
/**
 * @since 0.67.0
 * @category accessor
 */
export const failureSchema = self => self[symbolResult].failure;
/**
 * @since 0.67.0
 * @category accessor
 */
export const successSchema = self => self[symbolResult].success;
const exitSchemaCache = /*#__PURE__*/globalValue("@effect/schema/Serializable/exitSchemaCache", () => new WeakMap());
/**
 * @since 0.67.0
 * @category accessor
 */
export const exitSchema = self => {
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
export const serializeFailure = /*#__PURE__*/dual(2, (self, value) => Schema.encode(self[symbolResult].failure)(value));
/**
 * @since 0.67.0
 * @category decoding
 */
export const deserializeFailure = /*#__PURE__*/dual(2, (self, value) => Schema.decodeUnknown(self[symbolResult].failure)(value));
/**
 * @since 0.67.0
 * @category encoding
 */
export const serializeSuccess = /*#__PURE__*/dual(2, (self, value) => Schema.encode(self[symbolResult].success)(value));
/**
 * @since 0.67.0
 * @category decoding
 */
export const deserializeSuccess = /*#__PURE__*/dual(2, (self, value) => Schema.decodeUnknown(self[symbolResult].success)(value));
/**
 * @since 0.67.0
 * @category encoding
 */
export const serializeExit = /*#__PURE__*/dual(2, (self, value) => Schema.encode(exitSchema(self))(value));
/**
 * @since 0.67.0
 * @category decoding
 */
export const deserializeExit = /*#__PURE__*/dual(2, (self, value) => Schema.decodeUnknown(exitSchema(self))(value));
/**
 * @since 0.69.0
 */
export const asSerializableWithResult = procedure => procedure;
//# sourceMappingURL=Serializable.js.map
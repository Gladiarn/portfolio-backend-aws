"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.runMain = void 0;
var _Runtime = require("@effect/platform/Runtime");
/** @internal */
const runMain = exports.runMain = /*#__PURE__*/(0, _Runtime.makeRunMain)(({
  fiber,
  teardown
}) => {
  const keepAlive = setInterval(() => {}, 2 ** 31 - 1);
  fiber.addObserver(exit => {
    clearInterval(keepAlive);
    teardown(exit, code => {
      process.exit(code);
    });
  });
  function onSigint() {
    process.removeListener("SIGINT", onSigint);
    process.removeListener("SIGTERM", onSigint);
    fiber.unsafeInterruptAsFork(fiber.id());
  }
  process.once("SIGINT", onSigint);
  process.once("SIGTERM", onSigint);
});
//# sourceMappingURL=runtime.js.map
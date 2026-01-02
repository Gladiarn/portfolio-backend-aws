"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preLocal = preLocal;
const helper_1 = require("./helper");
function preLocal() {
    (0, helper_1.assertIsString)(this.buildDirPath);
    this.serviceDirPath = this.buildDirPath;
    this.serverless.config.servicePath = this.buildDirPath;
    // If this is a node function set the service path as CWD to allow accessing bundled files correctly
    if (this.options.function && this.functions[this.options.function]) {
        process.chdir(this.serviceDirPath);
    }
}
//# sourceMappingURL=pre-local.js.map
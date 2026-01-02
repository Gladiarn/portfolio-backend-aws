"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preOffline = preOffline;
const path_1 = require("path");
const ramda_1 = require("ramda");
const helper_1 = require("./helper");
function preOffline() {
    (0, helper_1.assertIsString)(this.buildDirPath);
    // Set offline location automatically if not set manually
    if (!this.serverless?.service?.custom?.['serverless-offline']?.location) {
        const newServerless = (0, ramda_1.assocPath)(['service', 'custom', 'serverless-offline', 'location'], (0, path_1.relative)(this.serviceDirPath, this.buildDirPath), this.serverless);
        this.serverless.service.custom = newServerless.service.custom;
    }
}
//# sourceMappingURL=pre-offline.js.map
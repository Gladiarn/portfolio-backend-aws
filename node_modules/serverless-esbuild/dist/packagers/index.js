"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackager = void 0;
/**
 * Factory for supported packagers.
 *
 * All packagers must extend the Packager class.
 *
 * @see Packager
 */
const ramda_1 = require("ramda");
const type_predicate_1 = require("../type-predicate");
const packagerFactories = {
    async npm(packagerOptions) {
        const { NPM } = await Promise.resolve().then(() => __importStar(require('./npm')));
        return new NPM(packagerOptions);
    },
    async pnpm() {
        const { Pnpm } = await Promise.resolve().then(() => __importStar(require('./pnpm')));
        return new Pnpm();
    },
    async yarn(packagerOptions) {
        const { Yarn } = await Promise.resolve().then(() => __importStar(require('./yarn')));
        return new Yarn(packagerOptions);
    },
};
/**
 * Asynchronously create a Packager instance and memoize it.
 *
 * @this EsbuildServerlessPlugin - Active plugin instance
 * @param {string} packagerId - Well known packager id
 * @returns {Promise<Packager>} - The selected Packager
 */
exports.getPackager = (0, ramda_1.memoizeWith)((packagerId) => packagerId, async function (packagerId, packagerOptions) {
    this.log.debug(`Trying to create packager: ${packagerId}`);
    if (!(0, type_predicate_1.isPackagerId)(packagerId)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Serverless typings (as of v3.0.2) are incorrect
        throw new this.serverless.classes.Error(`Could not find packager '${packagerId}'`);
    }
    const packager = await packagerFactories[packagerId](packagerOptions);
    this.log.debug(`Packager created: ${packagerId}`);
    return packager;
});
//# sourceMappingURL=index.js.map
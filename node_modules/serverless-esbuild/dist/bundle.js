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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundle = bundle;
const assert_1 = __importDefault(require("assert"));
const effect_1 = require("effect");
const pkg = __importStar(require("esbuild"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const p_map_1 = __importDefault(require("p-map"));
const path_1 = __importDefault(require("path"));
const ramda_1 = require("ramda");
const helper_1 = require("./helper");
const utils_1 = require("./utils");
const getStringArray = (input) => (0, helper_1.asArray)(input).filter(effect_1.Predicate.isString);
async function bundle() {
    (0, assert_1.default)(this.buildOptions, 'buildOptions is not defined');
    this.prepare();
    this.log.verbose(`Compiling to ${this.buildOptions?.target} bundle with esbuild...`);
    const exclude = getStringArray(this.buildOptions?.exclude);
    // esbuild v0.7.0 introduced config options validation, so I have to delete plugin specific options from esbuild config.
    const esbuildOptions = [
        'concurrency',
        'zipConcurrency',
        'exclude',
        'nativeZip',
        'packager',
        'packagePath',
        'watch',
        'keepOutputDirectory',
        'packagerOptions',
        'installExtraArgs',
        'outputFileExtension',
        'outputBuildFolder',
        'outputWorkFolder',
        'nodeExternals',
        'skipBuild',
        'skipRebuild',
        'skipBuildExcludeFns',
        'stripEntryResolveExtensions',
        'disposeContext',
    ].reduce((options, optionName) => {
        const { [optionName]: _, ...rest } = options;
        return rest;
    }, this.buildOptions);
    const config = {
        ...esbuildOptions,
        external: [...getStringArray(this.buildOptions?.external), ...(exclude.includes('*') ? [] : exclude)],
        plugins: this.plugins,
    };
    const { buildOptions, buildDirPath } = this;
    (0, assert_1.default)(buildOptions, 'buildOptions is not defined');
    (0, helper_1.assertIsString)(buildDirPath, 'buildDirPath is not a string');
    if ((0, helper_1.isESM)(buildOptions) && buildOptions.outputFileExtension === '.cjs') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Serverless typings (as of v3.0.2) are incorrect
        throw new this.serverless.classes.Error('ERROR: format "esm" or platform "neutral" should not output a file with extension ".cjs".');
    }
    if (!(0, helper_1.isESM)(buildOptions) && buildOptions.outputFileExtension === '.mjs') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Serverless typings (as of v3.0.2) are incorrect
        throw new this.serverless.classes.Error('ERROR: Non esm builds should not output a file with extension ".mjs".');
    }
    if (buildOptions.outputFileExtension !== '.js') {
        config.outExtension = { '.js': buildOptions.outputFileExtension };
    }
    /** Build the files */
    const bundleMapper = async (entry) => {
        const bundlePath = entry.slice(0, entry.lastIndexOf('.')) + buildOptions.outputFileExtension;
        // check cache
        if (this.buildCache) {
            const { result, context } = this.buildCache[entry] ?? {};
            if (result?.rebuild) {
                await result.rebuild();
                return { bundlePath, entry, result };
            }
            if (context?.rebuild) {
                const rebuild = await context.rebuild();
                return { bundlePath, entry, context, result: rebuild };
            }
        }
        const options = {
            ...config,
            entryPoints: [entry],
            outdir: path_1.default.join(buildDirPath, path_1.default.dirname(entry)),
        };
        const context = buildOptions.skipRebuild ? undefined : await pkg.context?.(options);
        let result;
        if (!buildOptions.skipRebuild) {
            result = await context?.rebuild();
            if (!result) {
                result = await pkg.build(options);
            }
        }
        else {
            result = await pkg.build(options);
        }
        if (config.metafile) {
            fs_extra_1.default.writeFileSync(path_1.default.join(buildDirPath, `${(0, utils_1.trimExtension)(entry)}-meta.json`), JSON.stringify(result.metafile, null, 2));
        }
        return { bundlePath, entry, result, context };
    };
    // Files can contain multiple handlers for multiple functions, we want to get only the unique ones
    const uniqueFiles = (0, ramda_1.uniq)(this.functionEntries.map(({ entry }) => entry));
    this.log.verbose(`Compiling with concurrency: ${buildOptions.concurrency}`);
    const fileBuildResults = await (0, p_map_1.default)(uniqueFiles, bundleMapper, {
        concurrency: buildOptions.concurrency,
    });
    // Create a cache with entry as key
    this.buildCache = fileBuildResults.reduce((acc, fileBuildResult) => {
        acc[fileBuildResult.entry] = fileBuildResult;
        return acc;
    }, {});
    // Map function entries back to bundles
    this.buildResults = this.functionEntries
        .map(({ entry, func, functionAlias }) => {
        const { bundlePath } = this.buildCache[entry] ?? {};
        if (typeof bundlePath !== 'string' || func === null) {
            return;
        }
        return { bundlePath, func, functionAlias };
    })
        .filter((result) => typeof result === 'object');
    this.log.verbose('Compiling completed.');
}
//# sourceMappingURL=bundle.js.map
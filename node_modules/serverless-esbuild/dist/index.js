"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const node_assert_1 = __importDefault(require("node:assert"));
const node_path_1 = __importDefault(require("node:path"));
const effect_1 = require("effect");
const fs_extra_1 = __importDefault(require("fs-extra"));
const globby_1 = __importDefault(require("globby"));
const ramda_1 = require("ramda");
const chokidar_1 = __importDefault(require("chokidar"));
const anymatch_1 = __importDefault(require("anymatch"));
const helper_1 = require("./helper");
const pack_externals_1 = require("./pack-externals");
const pack_1 = require("./pack");
const pre_offline_1 = require("./pre-offline");
const pre_local_1 = require("./pre-local");
const bundle_1 = require("./bundle");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
function updateFile(op, src, dest) {
    if (['add', 'change', 'addDir'].includes(op)) {
        fs_extra_1.default.copySync(src, dest, {
            dereference: true,
            errorOnExist: false,
            preserveTimestamps: true,
            recursive: true,
        });
        return;
    }
    if (['unlink', 'unlinkDir'].includes(op)) {
        fs_extra_1.default.removeSync(dest);
    }
}
class EsbuildServerlessPlugin {
    constructor(serverless, options, logging) {
        this.packageOutputPath = constants_1.SERVERLESS_FOLDER;
        /** Used for storing previous esbuild build results so we can rebuild more efficiently */
        this.buildCache = {};
        this.serverless = serverless;
        this.options = options;
        this.log = logging?.log || (0, helper_1.buildServerlessV3LoggerFromLegacyLogger)(this.serverless.cli, this.options.verbose);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore old versions use servicePath, new versions serviceDir. Types will use only one of them
        this.serviceDirPath = this.serverless.config.serviceDir || this.serverless.config.servicePath;
        this.packExternalModules = pack_externals_1.packExternalModules.bind(this);
        this.pack = pack_1.pack.bind(this);
        this.copyPreBuiltResources = pack_1.copyPreBuiltResources.bind(this);
        this.preOffline = pre_offline_1.preOffline.bind(this);
        this.preLocal = pre_local_1.preLocal.bind(this);
        this.bundle = bundle_1.bundle.bind(this);
        // This tells serverless that this skipEsbuild property can exist in a function definition, but isn't required.
        // That way a user could skip a function if they have defined their own artifact, for example.
        this.serverless.configSchemaHandler.defineFunctionProperties(this.serverless.service.provider.name, {
            properties: {
                skipEsbuild: { type: 'boolean' },
            },
        });
        this.hooks = {
            initialize: async () => {
                this.init();
                if (this.buildOptions?.skipBuild) {
                    this.prepare();
                    await this.copyPreBuiltResources();
                }
            },
            'before:run:run': async () => {
                this.log.verbose('before:run:run');
                await this.bundle();
                await this.packExternalModules();
                await this.copyExtras();
            },
            'before:offline:start': async () => {
                this.log.verbose('before:offline:start');
                await this.bundle();
                await this.packExternalModules();
                await this.copyExtras();
                await this.preOffline();
                this.watch();
            },
            'before:offline:start:init': async () => {
                this.log.verbose('before:offline:start:init');
                await this.bundle();
                await this.packExternalModules();
                await this.copyExtras();
                await this.preOffline();
                this.watch();
            },
            'before:package:createDeploymentArtifacts': async () => {
                this.log.verbose('before:package:createDeploymentArtifacts');
                if (this.functionEntries?.length > 0) {
                    await this.bundle();
                    await this.packExternalModules();
                    await this.copyExtras();
                    await this.pack();
                }
            },
            'after:package:createDeploymentArtifacts': async () => {
                this.log.verbose('after:package:createDeploymentArtifacts');
                await this.disposeContexts();
                await this.cleanup();
            },
            'before:deploy:function:packageFunction': async () => {
                this.log.verbose('after:deploy:function:packageFunction');
                await this.bundle();
                await this.packExternalModules();
                await this.copyExtras();
                await this.pack();
            },
            'after:deploy:function:packageFunction': async () => {
                this.log.verbose('after:deploy:function:packageFunction');
                await this.disposeContexts();
                await this.cleanup();
            },
            'before:invoke:local:invoke': async () => {
                this.log.verbose('before:invoke:local:invoke');
                await this.bundle();
                await this.packExternalModules();
                await this.copyExtras();
                await this.preLocal();
            },
            'after:invoke:local:invoke': async () => {
                await this.disposeContexts();
            },
        };
    }
    init() {
        this.buildOptions = this.getBuildOptions();
        this.outputWorkFolder = this.buildOptions.outputWorkFolder || constants_1.WORK_FOLDER;
        this.outputBuildFolder = this.buildOptions.outputBuildFolder || constants_1.BUILD_FOLDER;
        this.packageOutputPath = this.options.package || constants_1.SERVERLESS_FOLDER;
        this.workDirPath = node_path_1.default.join(this.serviceDirPath, this.outputWorkFolder);
        this.buildDirPath = node_path_1.default.join(this.workDirPath, this.outputBuildFolder);
    }
    /**
     * Checks if the runtime for the given function is nodejs.
     * If the runtime is not set , checks the global runtime.
     * @param {Serverless.FunctionDefinitionHandler} func the function to be checked
     * @returns {boolean} true if the function/global runtime is nodejs; false, otherwise
     */
    isNodeFunction(func) {
        const runtime = func.runtime || this.serverless.service.provider.runtime;
        const runtimeMatcher = helper_1.providerRuntimeMatcher[this.serverless.service.provider.name];
        return (0, helper_1.isNodeMatcherKey)(runtime) && typeof runtimeMatcher?.[runtime] === 'string';
    }
    /**
     * Checks if the function has a handler
     * @param {Serverless.FunctionDefinitionHandler | Serverless.FunctionDefinitionImage} func the function to be checked
     * @returns {boolean} true if the function has a handler
     */
    isFunctionDefinitionHandler(func) {
        return Boolean(func?.handler);
    }
    get functions() {
        const functions = this.options.function
            ? {
                [this.options.function]: this.serverless.service.getFunction(this.options.function),
            }
            : this.serverless.service.functions;
        const buildOptions = this.getBuildOptions();
        // ignore all functions with a different runtime than nodejs:
        const nodeFunctions = {};
        for (const [functionAlias, fn] of Object.entries(functions)) {
            const currFn = fn;
            if (this.isFunctionDefinitionHandler(currFn) && this.isNodeFunction(currFn)) {
                buildOptions.disposeContext = currFn.disposeContext ? currFn.disposeContext : buildOptions.disposeContext; // disposeContext configuration can be overridden per function
                if (buildOptions.skipBuild && !buildOptions.skipBuildExcludeFns?.includes(functionAlias)) {
                    currFn.skipEsbuild = true;
                }
                nodeFunctions[functionAlias] = currFn;
            }
        }
        return nodeFunctions;
    }
    get plugins() {
        if (!this.buildOptions?.plugins) {
            return [];
        }
        if (Array.isArray(this.buildOptions.plugins)) {
            return this.buildOptions.plugins;
        }
        let plugins = require(node_path_1.default.join(this.serviceDirPath, this.buildOptions.plugins));
        if ((0, utils_1.isESMModule)(plugins)) {
            plugins = plugins.default;
        }
        if (typeof plugins === 'function') {
            return plugins(this.serverless);
        }
        return plugins;
    }
    get packagePatterns() {
        const { service } = this.serverless;
        const patterns = [];
        const ignored = [];
        for (const pattern of service.package.patterns) {
            if (pattern.startsWith('!')) {
                ignored.push(pattern.slice(1));
            }
            else {
                patterns.push(pattern);
            }
        }
        for (const fn of Object.values(this.functions)) {
            const fnPatterns = (0, helper_1.asArray)(fn.package?.patterns).filter(effect_1.Predicate.isString);
            for (const pattern of fnPatterns) {
                if (pattern.startsWith('!')) {
                    ignored.push(pattern.slice(1));
                }
                else {
                    patterns.push(pattern);
                }
            }
        }
        return { patterns, ignored };
    }
    getBuildOptions() {
        if (this.buildOptions)
            return this.buildOptions;
        const DEFAULT_BUILD_OPTIONS = {
            concurrency: Infinity,
            zipConcurrency: Infinity,
            bundle: true,
            target: 'node18',
            external: [],
            exclude: ['aws-sdk'],
            nativeZip: false,
            packager: 'npm',
            packagerOptions: {
                noInstall: false,
                ignoreLockfile: false,
            },
            installExtraArgs: [],
            watch: {
                pattern: './**/*.(js|ts)',
                ignore: [constants_1.WORK_FOLDER, 'dist', 'node_modules', constants_1.BUILD_FOLDER],
                chokidar: {
                    ignoreInitial: true,
                },
            },
            keepOutputDirectory: false,
            platform: 'node',
            outputFileExtension: '.js',
            skipBuild: false,
            skipBuildExcludeFns: [],
            stripEntryResolveExtensions: false,
            disposeContext: true, // default true
        };
        const providerRuntime = this.serverless.service.provider.runtime;
        (0, helper_1.assertIsSupportedRuntime)(providerRuntime);
        const runtimeMatcher = helper_1.providerRuntimeMatcher[this.serverless.service.provider.name];
        const target = (0, helper_1.isNodeMatcherKey)(providerRuntime) ? runtimeMatcher?.[providerRuntime] : undefined;
        const resolvedOptions = {
            ...(target ? { target } : {}),
        };
        const withDefaultOptions = (0, ramda_1.mergeDeepRight)(DEFAULT_BUILD_OPTIONS);
        const withResolvedOptions = (0, ramda_1.mergeDeepRight)(withDefaultOptions(resolvedOptions));
        const configPath = this.serverless.service.custom?.esbuild?.config;
        const config = configPath ? require(node_path_1.default.join(this.serviceDirPath, configPath)) : undefined;
        return withResolvedOptions(config ? config(this.serverless) : this.serverless.service.custom?.esbuild ?? {});
    }
    get functionEntries() {
        return (0, helper_1.extractFunctionEntries)(this.serviceDirPath, this.serverless.service.provider.name, this.functions, this.buildOptions?.resolveExtensions);
    }
    watch() {
        (0, node_assert_1.default)(this.buildOptions, 'buildOptions is not defined');
        const defaultPatterns = (0, helper_1.asArray)(this.buildOptions.watch.pattern).filter(effect_1.Predicate.isString);
        const defaultIgnored = (0, helper_1.asArray)(this.buildOptions.watch.ignore).filter(effect_1.Predicate.isString);
        const { patterns, ignored } = this.packagePatterns;
        const allPatterns = [...defaultPatterns, ...patterns];
        const allIgnored = [...defaultIgnored, ...ignored];
        const options = {
            ignored: allIgnored,
            ...this.buildOptions.watch.chokidar,
        };
        chokidar_1.default.watch(allPatterns, options).on('all', (eventName, srcPath) => this.bundle()
            .then(() => this.updateFile(eventName, srcPath))
            .then(() => this.notifyServerlessOffline())
            .then(() => this.log.verbose('Watching files for changes...'))
            .catch(() => this.log.error('Bundle error, waiting for a file change to reload...')));
    }
    prepare() {
        (0, helper_1.assertIsString)(this.buildDirPath, 'buildDirPath is not a string');
        (0, helper_1.assertIsString)(this.workDirPath, 'workDirPath is not a string');
        fs_extra_1.default.mkdirpSync(this.buildDirPath);
        fs_extra_1.default.mkdirpSync(node_path_1.default.join(this.workDirPath, constants_1.SERVERLESS_FOLDER));
        // exclude serverless-esbuild
        this.serverless.service.package = {
            ...(this.serverless.service.package || {}),
            patterns: [
                ...new Set([
                    ...(this.serverless.service.package?.include || []),
                    ...(this.serverless.service.package?.exclude || []).map((0, ramda_1.concat)('!')),
                    ...(this.serverless.service.package?.patterns || []),
                    '!node_modules/serverless-esbuild',
                ]),
            ],
        };
        for (const fn of Object.values(this.functions)) {
            const patterns = [
                ...new Set([
                    ...(fn.package?.include || []),
                    ...(fn.package?.exclude || []).map((0, ramda_1.concat)('!')),
                    ...(fn.package?.patterns || []),
                ]),
            ];
            fn.package = {
                ...(fn.package || {}),
                ...(patterns.length && { patterns }),
            };
        }
    }
    notifyServerlessOffline() {
        this.serverless.pluginManager.spawn('offline:functionsUpdated');
    }
    async updateFile(op, filename) {
        (0, helper_1.assertIsString)(this.buildDirPath, 'buildDirPath is not a string');
        const { service } = this.serverless;
        const patterns = (0, helper_1.asArray)(service.package.patterns).filter(effect_1.Predicate.isString);
        if (patterns.length > 0 &&
            (0, anymatch_1.default)(patterns.filter((pattern) => !pattern.startsWith('!')), filename)) {
            const destFileName = node_path_1.default.resolve(node_path_1.default.join(this.buildDirPath, filename));
            updateFile(op, node_path_1.default.resolve(filename), destFileName);
            return;
        }
        for (const [functionAlias, fn] of Object.entries(this.functions)) {
            if (fn.package?.patterns?.length === 0) {
                continue;
            }
            if ((0, anymatch_1.default)((0, helper_1.asArray)(fn.package?.patterns)
                .filter(effect_1.Predicate.isString)
                .filter((pattern) => !pattern.startsWith('!')), filename)) {
                const destFileName = node_path_1.default.resolve(node_path_1.default.join(this.buildDirPath, `${constants_1.ONLY_PREFIX}${functionAlias}`, filename));
                updateFile(op, node_path_1.default.resolve(filename), destFileName);
                return;
            }
        }
    }
    /** Link or copy extras such as node_modules or package.patterns definitions */
    async copyExtras() {
        (0, helper_1.assertIsString)(this.buildDirPath, 'buildDirPath is not a string');
        const { service } = this.serverless;
        const packagePatterns = (0, helper_1.asArray)(service.package.patterns).filter(effect_1.Predicate.isString);
        // include any "extras" from the "patterns" section
        if (packagePatterns.length) {
            const files = await (0, globby_1.default)(packagePatterns);
            for (const filename of files) {
                const destFileName = node_path_1.default.resolve(node_path_1.default.join(this.buildDirPath, filename));
                updateFile('add', node_path_1.default.resolve(filename), destFileName);
            }
        }
        // include any "extras" from the individual function "patterns" section
        for (const [functionAlias, fn] of Object.entries(this.functions)) {
            const patterns = (0, helper_1.asArray)(fn.package?.patterns).filter(effect_1.Predicate.isString);
            if (!patterns.length) {
                continue;
            }
            const files = await (0, globby_1.default)(patterns);
            for (const filename of files) {
                const destFileName = node_path_1.default.resolve(node_path_1.default.join(this.buildDirPath, `${constants_1.ONLY_PREFIX}${functionAlias}`, filename));
                updateFile('add', node_path_1.default.resolve(filename), destFileName);
            }
        }
    }
    /**
     * Move built code to the serverless folder, taking into account individual
     * packaging preferences.
     */
    async moveArtifacts() {
        (0, helper_1.assertIsString)(this.workDirPath, 'workDirPath is not a string');
        const { service } = this.serverless;
        await fs_extra_1.default.copy(node_path_1.default.join(this.workDirPath, constants_1.SERVERLESS_FOLDER), node_path_1.default.join(this.serviceDirPath, constants_1.SERVERLESS_FOLDER));
        if (service.package.individually === true || this.options.function) {
            Object.values(this.functions).forEach((func) => {
                if (func.package?.artifact) {
                    // eslint-disable-next-line no-param-reassign
                    func.package.artifact = node_path_1.default.join(constants_1.SERVERLESS_FOLDER, node_path_1.default.basename(func.package.artifact));
                }
            });
            return;
        }
        service.package.artifact = node_path_1.default.join(constants_1.SERVERLESS_FOLDER, node_path_1.default.basename(service.package.artifact));
    }
    async disposeContexts() {
        for (const { context } of Object.values(this.buildCache)) {
            if (context) {
                this.buildOptions?.disposeContext && (await context.dispose());
            }
        }
    }
    async cleanup() {
        await this.moveArtifacts();
        // Remove temp build folder
        if (!this.buildOptions?.keepOutputDirectory) {
            (0, helper_1.assertIsString)(this.workDirPath, 'workDirPath is not a string');
            fs_extra_1.default.removeSync(node_path_1.default.join(this.workDirPath));
        }
    }
}
module.exports = EsbuildServerlessPlugin;
//# sourceMappingURL=index.js.map
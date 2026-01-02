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
exports.nodeExternalsPluginUtilsPath = nodeExternalsPluginUtilsPath;
exports.packExternalModules = packExternalModules;
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const R = __importStar(require("ramda"));
const packagers_1 = require("./packagers");
const utils_1 = require("./utils");
const helper_1 = require("./helper");
function rebaseFileReferences(pathToPackageRoot, moduleVersion) {
    if (/^(?:file:[^/]{2}|\.\/|\.\.\/)/.test(moduleVersion)) {
        const filePath = R.replace(/^file:/, '', moduleVersion);
        return R.replace(/\\/g, '/', `${R.startsWith('file:', moduleVersion) ? 'file:' : ''}${pathToPackageRoot}/${filePath}`);
    }
    return moduleVersion;
}
/**
 * Add the given modules to a package json's dependencies.
 */
function addModulesToPackageJson(externalModules, packageJson, pathToPackageRoot) {
    R.forEach((externalModule) => {
        const splitModule = R.split('@', externalModule);
        // If we have a scoped module we have to re-add the @
        if (R.startsWith('@', externalModule)) {
            splitModule.splice(0, 1);
            splitModule[0] = `@${splitModule[0]}`;
        }
        const dependencyName = R.head(splitModule);
        if (!dependencyName) {
            return;
        }
        // We have to rebase file references to the target package.json
        const moduleVersion = rebaseFileReferences(pathToPackageRoot, R.join('@', R.tail(splitModule)));
        // eslint-disable-next-line no-param-reassign
        packageJson.dependencies = packageJson.dependencies || {};
        // eslint-disable-next-line no-param-reassign
        packageJson.dependencies[dependencyName] = moduleVersion;
    }, externalModules);
}
/**
 * Resolve the needed versions of production dependencies for external modules.
 * @this - The active plugin instance
 */
function getProdModules(externalModules, packageJsonPath, rootPackageJsonPath) {
    const packageJson = this.serverless.utils.readFileSync(packageJsonPath);
    // only process the module stated in dependencies section
    if (!packageJson.dependencies) {
        return [];
    }
    const prodModules = [];
    // Get versions of all transient modules
    // eslint-disable-next-line max-statements
    R.forEach((externalModule) => {
        // (1) If not present in Dev Dependencies or Dependencies
        if (!packageJson.dependencies?.[externalModule.external] &&
            !packageJson.devDependencies?.[externalModule.external]) {
            this.log.debug(`INFO: Runtime dependency '${externalModule.external}' not found in dependencies or devDependencies. It has been excluded automatically.`);
            return;
        }
        // (2) If present in Dev Dependencies
        if (!packageJson.dependencies?.[externalModule.external] &&
            packageJson.devDependencies?.[externalModule.external]) {
            // To minimize the chance of breaking setups we whitelist packages available on AWS here. These are due to the previously missing check
            // most likely set in devDependencies and should not lead to an error now.
            const ignoredDevDependencies = ['aws-sdk'];
            if (!R.includes(externalModule.external, ignoredDevDependencies)) {
                // Runtime dependency found in devDependencies but not forcefully excluded
                this.log.error(`ERROR: Runtime dependency '${externalModule.external}' found in devDependencies.`);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore Serverless typings (as of v3.0.2) are incorrect
                throw new this.serverless.classes.Error(`Serverless-webpack dependency error: ${externalModule.external}.`);
            }
            this.log.debug(`INFO: Runtime dependency '${externalModule.external}' found in devDependencies. It has been excluded automatically.`);
            return;
        }
        // (3) otherwise let's get the version
        // get module package - either from root or local node_modules - will be used for version and peer deps
        const rootModulePackagePath = path_1.default.join(path_1.default.dirname(rootPackageJsonPath), 'node_modules', externalModule.external, 'package.json');
        const localModulePackagePath = path_1.default.join(process.cwd(), path_1.default.dirname(packageJsonPath), 'node_modules', externalModule.external, 'package.json');
        // eslint-disable-next-line no-nested-ternary
        const modulePackagePath = fs_extra_1.default.pathExistsSync(localModulePackagePath)
            ? localModulePackagePath
            : fs_extra_1.default.pathExistsSync(rootModulePackagePath)
                ? rootModulePackagePath
                : null;
        const modulePackage = modulePackagePath ? require(modulePackagePath) : {};
        // Get version
        const moduleVersion = packageJson.dependencies?.[externalModule.external] || modulePackage.version;
        // add dep with version if we have it - versionless otherwise
        prodModules.push(moduleVersion ? `${externalModule.external}@${moduleVersion}` : externalModule.external);
        // Check if the module has any peer dependencies and include them too
        try {
            // find peer dependencies but remove optional ones and excluded ones
            const peerDependencies = modulePackage.peerDependencies;
            const optionalPeerDependencies = Object.keys(R.pickBy((val) => val.optional, modulePackage.peerDependenciesMeta || {}));
            (0, assert_1.default)(this.buildOptions, 'buildOptions not defined');
            const peerDependenciesWithoutOptionals = R.omit([...optionalPeerDependencies, ...this.buildOptions.exclude], peerDependencies);
            if (!R.isEmpty(peerDependenciesWithoutOptionals)) {
                this.log.debug(`Adding explicit non-optionals peers for dependency ${externalModule.external}`);
                const peerModules = getProdModules.call(this, R.compose(R.map(([external]) => ({ external })), R.toPairs)(peerDependenciesWithoutOptionals), packageJsonPath, rootPackageJsonPath);
                Array.prototype.push.apply(prodModules, peerModules);
            }
        }
        catch (error) {
            this.log.warning(`WARNING: Could not check for peer dependencies of ${externalModule.external}`);
        }
    }, externalModules);
    return prodModules;
}
function nodeExternalsPluginUtilsPath() {
    try {
        const resolvedPackage = require.resolve('esbuild-node-externals/dist/utils', {
            paths: [process.cwd()],
        });
        return resolvedPackage;
    }
    catch {
        // No-op
    }
}
/**
 * We need a performant algorithm to install the packages for each single
 * function (in case we package individually).
 * (1) We fetch ALL packages needed by ALL functions in a first step
 * and use this as a base npm checkout. The checkout will be done to a
 * separate temporary directory with a package.json that contains everything.
 * (2) For each single compile we copy the whole node_modules to the compile
 * directory and create a (function) compile specific package.json and store
 * it in the compile directory. Now we start npm again there, and npm will just
 * remove the superfluous packages and optimize the remaining dependencies.
 * This will utilize the npm cache at its best and give us the needed results
 * and performance.
 */
// eslint-disable-next-line max-statements
async function packExternalModules() {
    (0, assert_1.default)(this.buildOptions, 'buildOptions not defined');
    const upperPackageJson = (0, utils_1.findUp)('package.json');
    const { plugins } = this;
    if (plugins && plugins.map((plugin) => plugin.name).includes('node-externals')) {
        const utilsPath = nodeExternalsPluginUtilsPath();
        if (utilsPath) {
            const { findDependencies, findPackagePaths, createAllowPredicate, } = require(utilsPath);
            this.buildOptions.external = findDependencies({
                packagePaths: findPackagePaths(),
                dependencies: true,
                devDependencies: false,
                peerDependencies: false,
                optionalDependencies: false,
                allowWorkspaces: false,
                allowPredicate: createAllowPredicate(this.buildOptions.nodeExternals?.allowList ?? []),
            });
        }
    }
    const externals = Array.isArray(this.buildOptions.external) &&
        this.buildOptions.exclude !== '*' &&
        !this.buildOptions.exclude.includes('*')
        ? R.without(this.buildOptions.exclude, this.buildOptions.external)
        : [];
    if (!externals.length) {
        return;
    }
    // Read plugin configuration
    // get the root package.json by looking up until we hit a lockfile
    // if this is a yarn workspace, it will be the monorepo package.json
    const rootPackageJsonPath = path_1.default.join((0, utils_1.findProjectRoot)() || '', './package.json');
    // get the local package.json by looking up until we hit a package.json file
    // if this is *not* a yarn workspace, it will be the same as rootPackageJsonPath
    const packageJsonPath = this.buildOptions.packagePath ||
        (upperPackageJson && path_1.default.relative(process.cwd(), path_1.default.join(upperPackageJson, './package.json')));
    (0, assert_1.default)(packageJsonPath, 'packageJsonPath is not defined');
    // Determine and create packager
    const packager = await packagers_1.getPackager.call(this, this.buildOptions.packager, this.buildOptions.packagerOptions);
    // Fetch needed original package.json sections
    const sectionNames = packager.copyPackageSectionNames;
    // Get scripts from packager options
    const packagerScripts = typeof this.buildOptions.packagerOptions?.scripts !== 'undefined'
        ? (Array.isArray(this.buildOptions.packagerOptions.scripts)
            ? this.buildOptions.packagerOptions.scripts
            : [this.buildOptions.packagerOptions.scripts]).reduce((scripts, script, index) => {
            // eslint-disable-next-line no-param-reassign
            scripts[`script${index}`] = script;
            return scripts;
        }, {})
        : {};
    const rootPackageJson = this.serverless.utils.readFileSync(rootPackageJsonPath);
    const isWorkspace = !!rootPackageJson.workspaces;
    const packageJson = isWorkspace
        ? (packageJsonPath && this.serverless.utils.readFileSync(packageJsonPath)) || {}
        : rootPackageJson;
    const packageSections = R.pick(sectionNames, packageJson);
    if (!R.isEmpty(packageSections)) {
        this.log.debug(`Using package.json sections ${R.join(', ', R.keys(packageSections))}`);
    }
    // Get first level dependency graph
    this.log.debug(`Fetch dependency graph from ${packageJson}`);
    // (1) Generate dependency composition
    const externalModules = R.map((external) => ({ external }), externals);
    const compositeModules = R.uniq(getProdModules.call(this, externalModules, packageJsonPath, rootPackageJsonPath));
    if (R.isEmpty(compositeModules)) {
        // The compiled code does not reference any external modules at all
        this.log.warning('No external modules needed');
        return;
    }
    // (1.a) Install all needed modules
    const compositeModulePath = this.buildDirPath;
    (0, helper_1.assertIsString)(compositeModulePath, 'compositeModulePath is not a string');
    const compositePackageJson = path_1.default.join(compositeModulePath, 'package.json');
    // (1.a.1) Create a package.json
    const compositePackage = R.mergeRight({
        name: this.serverless.service.service,
        version: '1.0.0',
        description: `Packaged externals for ${this.serverless.service.service}`,
        private: true,
        scripts: packagerScripts,
    }, packageSections);
    const relativePath = path_1.default.relative(compositeModulePath, path_1.default.dirname(packageJsonPath));
    addModulesToPackageJson(compositeModules, compositePackage, relativePath);
    this.serverless.utils.writeFileSync(compositePackageJson, JSON.stringify(compositePackage, null, 2));
    // (1.a.2) Copy package-lock.json if it exists, to prevent unwanted upgrades
    const packageLockPath = path_1.default.join(process.cwd(), path_1.default.dirname(packageJsonPath), packager.lockfileName);
    const exists = await fs_extra_1.default.pathExists(packageLockPath);
    if (exists) {
        this.log.verbose('Package lock found - Using locked versions');
        try {
            let packageLockFile = this.serverless.utils.readFileSync(packageLockPath);
            packageLockFile = packager.rebaseLockfile(relativePath, packageLockFile);
            if (R.is(Object)(packageLockFile)) {
                packageLockFile = JSON.stringify(packageLockFile, null, 2);
            }
            this.serverless.utils.writeFileSync(path_1.default.join(compositeModulePath, packager.lockfileName), packageLockFile);
        }
        catch (error) {
            this.log.warning(`Warning: Could not read lock file${error instanceof Error ? `: ${error.message}` : ''}`);
        }
    }
    // GOOGLE: Copy modules only if not google-cloud-functions
    // GCF Auto installs the package json
    if (R.path(['service', 'provider', 'name'], this.serverless) === 'google') {
        return;
    }
    const start = Date.now();
    this.log.verbose(`Packing external modules: ${compositeModules.join(', ')}`);
    const { installExtraArgs } = this.buildOptions;
    await packager.install(compositeModulePath, installExtraArgs, exists);
    this.log.debug(`Package took [${Date.now() - start} ms]`);
    // Prune extraneous packages - removes not needed ones
    const startPrune = Date.now();
    await packager.prune(compositeModulePath);
    this.log.debug(`Prune: ${compositeModulePath} [${Date.now() - startPrune} ms]`);
    (0, helper_1.assertIsString)(this.buildDirPath, 'buildDirPath is not a string');
    // Run packager scripts
    if (Object.keys(packagerScripts).length > 0) {
        const startScripts = Date.now();
        await packager.runScripts(this.buildDirPath, Object.keys(packagerScripts));
        this.log.debug(`Packager scripts took [${Date.now() - startScripts} ms].\nExecuted scripts: ${Object.values(packagerScripts).map((script) => `\n  ${script}`)}`);
    }
}
//# sourceMappingURL=pack-externals.js.map
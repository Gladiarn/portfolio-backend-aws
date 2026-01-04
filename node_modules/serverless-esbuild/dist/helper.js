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
exports.stripEntryResolveExtensions = exports.buildServerlessV3LoggerFromLegacyLogger = exports.isNodeMatcherKey = exports.providerRuntimeMatcher = exports.doSharePath = exports.getDepsFromBundle = exports.isESM = exports.flatDep = void 0;
exports.asArray = asArray;
exports.assertIsString = assertIsString;
exports.extractFunctionEntries = extractFunctionEntries;
exports.assertIsSupportedRuntime = assertIsSupportedRuntime;
const assert_1 = __importStar(require("assert"));
const effect_1 = require("effect");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const acorn_1 = require("acorn");
const acorn_walk_1 = require("acorn-walk");
const fs_extra_1 = __importDefault(require("fs-extra"));
const ramda_1 = require("ramda");
const constants_1 = require("./constants");
function asArray(data) {
    return Array.isArray(data) ? data : [data];
}
function assertIsString(input, message = 'input is not a string') {
    if (!effect_1.Predicate.isString(input)) {
        throw new assert_1.AssertionError({ message, actual: input });
    }
}
function extractFunctionEntries(cwd, provider, functions, resolveExtensions) {
    // The Google provider will use the entrypoint not from the definition of the
    // handler function, but instead from the package.json:main field, or via a
    // index.js file. This check reads the current package.json in the same way
    // that we already read the tsconfig.json file, by inspecting the current
    // working directory. If the packageFile does not contain a valid main, then
    // it instead selects the index.js file.
    if (provider === 'google') {
        const packageFilePath = path_1.default.join(cwd, 'package.json');
        if (fs_extra_1.default.existsSync(packageFilePath)) {
            // Load in the package.json file.
            const packageFile = JSON.parse(fs_extra_1.default.readFileSync(packageFilePath).toString());
            // Either grab the package.json:main field, or use the index.ts file.
            // (This will be transpiled to index.js).
            const entry = packageFile.main ? packageFile.main.replace(/\.js$/, '.ts') : 'index.ts';
            // Check that the file indeed exists.
            if (!fs_extra_1.default.existsSync(path_1.default.join(cwd, entry))) {
                throw new Error(`Compilation failed. Cannot locate entrypoint, ${entry} not found`);
            }
            return [{ entry, func: null }];
        }
    }
    return Object.keys(functions)
        .filter((functionAlias) => {
        return !functions[functionAlias].skipEsbuild;
    })
        .map((functionAlias) => {
        const func = functions[functionAlias];
        (0, assert_1.default)(func, `${functionAlias} not found in functions`);
        const { handler, esbuildEntrypoint } = func;
        const entrypoint = esbuildEntrypoint || handler;
        const fnName = path_1.default.extname(entrypoint);
        const fnNameLastAppearanceIndex = entrypoint.lastIndexOf(fnName);
        // replace only last instance to allow the same name for file and handler
        const fileName = entrypoint.substring(0, fnNameLastAppearanceIndex);
        const extensions = resolveExtensions ?? constants_1.DEFAULT_EXTENSIONS;
        for (const extension of extensions) {
            // Check if the .{extension} files exists. If so return that to watch
            if (fs_extra_1.default.existsSync(path_1.default.join(cwd, fileName + extension))) {
                const entry = path_1.default.relative(cwd, fileName + extension);
                return {
                    func,
                    functionAlias,
                    entry: os_1.default.platform() === 'win32' ? entry.replace(/\\/g, '/') : entry,
                };
            }
            if (fs_extra_1.default.existsSync(path_1.default.join(cwd, path_1.default.join(fileName, 'index') + extension))) {
                const entry = path_1.default.relative(cwd, path_1.default.join(fileName, 'index') + extension);
                return {
                    func,
                    functionAlias,
                    entry: os_1.default.platform() === 'win32' ? entry.replace(/\\/g, '/') : entry,
                };
            }
        }
        // Can't find the files. Watch will have an exception anyway. So throw one with error.
        throw new Error(`Compilation failed for function alias ${functionAlias}. Please ensure you have an index file with ext .ts or .js, or have a path listed as main key in package.json`);
    });
}
/**
 * Takes a dependency graph and returns a flat list of required production dependencies for all or the filtered deps
 * @param root the root of the dependency tree
 * @param rootDeps array of top level root dependencies to whitelist
 */
const flatDep = (root, rootDepsFilter) => {
    const flattenedDependencies = new Set();
    /**
     *
     * @param deps the current tree
     * @param filter the dependencies to get from this tree
     */
    const recursiveFind = (deps, filter) => {
        if (!deps)
            return;
        Object.entries(deps).forEach(([depName, details]) => {
            // only for root level dependencies
            if (filter && !filter.includes(depName)) {
                return;
            }
            if (details.isRootDep || filter) {
                // We already have this root dep and it's dependencies - skip this iteration
                if (flattenedDependencies.has(depName)) {
                    return;
                }
                flattenedDependencies.add(depName);
                const dep = root[depName];
                dep && recursiveFind(dep.dependencies);
                return;
            }
            // This is a nested dependency and will be included by default when we include it's parent
            // We just need to check if we fulfil all it's dependencies
            recursiveFind(details.dependencies);
        });
    };
    recursiveFind(root, rootDepsFilter);
    return Array.from(flattenedDependencies);
};
exports.flatDep = flatDep;
/**
 * Extracts the base package from a package string taking scope into consideration
 * @example getBaseDep('@scope/package/register') returns '@scope/package'
 * @example getBaseDep('package/register') returns 'package'
 * @example getBaseDep('package') returns 'package'
 * @param input
 */
const getBaseDep = (input) => {
    const result = /^@[^/]+\/[^/\n]+|^[^/\n]+/.exec(input);
    if (Array.isArray(result) && result[0]) {
        return result[0];
    }
};
const isESM = (buildOptions) => {
    return buildOptions.format === 'esm' || (buildOptions.platform === 'neutral' && !buildOptions.format);
};
exports.isESM = isESM;
/**
 * Extracts the list of dependencies that appear in a bundle as `import 'XXX'`, `import('XXX')`, or `require('XXX')`.
 * @param bundlePath Absolute path to a bundled JS file
 * @param useESM Should the bundle be treated as ESM
 */
const getDepsFromBundle = (bundlePath, useESM) => {
    const bundleContent = fs_extra_1.default.readFileSync(bundlePath, 'utf8');
    const deps = [];
    const ast = (0, acorn_1.parse)(bundleContent, {
        ecmaVersion: 'latest',
        sourceType: useESM ? 'module' : 'script',
    });
    // I'm using `node: any` since the type definition is not accurate.
    // There are properties at runtime that do not exist in the `acorn.Node` type.
    (0, acorn_walk_1.simple)(ast, {
        CallExpression(node) {
            if (node.callee.name === 'require') {
                deps.push(node.arguments[0].value);
            }
        },
        ImportExpression(node) {
            deps.push(node.source.value);
        },
        ImportDeclaration(node) {
            deps.push(node.source.value);
        },
    });
    const baseDeps = deps.map(getBaseDep).filter(effect_1.Predicate.isString);
    return (0, ramda_1.uniq)(baseDeps);
};
exports.getDepsFromBundle = getDepsFromBundle;
const doSharePath = (child, parent) => {
    if (child === parent) {
        return true;
    }
    const parentTokens = parent.split('/');
    const childToken = child.split('/');
    return parentTokens.every((token, index) => childToken[index] === token);
};
exports.doSharePath = doSharePath;
const awsNodeMatcher = {
    'nodejs24.x': 'node24',
    'nodejs22.x': 'node22',
    'nodejs20.x': 'node20',
    'nodejs18.x': 'node18',
    'nodejs16.x': 'node16',
    'nodejs14.x': 'node14',
    'nodejs12.x': 'node12',
};
const azureNodeMatcher = {
    nodejs18: 'node18',
    nodejs16: 'node16',
    nodejs14: 'node14',
    nodejs12: 'node12',
};
const googleNodeMatcher = {
    nodejs24: 'node24',
    nodejs22: 'node22',
    nodejs20: 'node20',
    nodejs18: 'node18',
    nodejs16: 'node16',
    nodejs14: 'node14',
    nodejs12: 'node12',
};
const scalewayNodeMatcher = {
    node22: 'node22',
    node20: 'node20',
    node18: 'node18',
    node16: 'node16',
    node14: 'node14',
    node12: 'node12',
};
const nodeMatcher = {
    ...googleNodeMatcher,
    ...awsNodeMatcher,
    ...azureNodeMatcher,
    ...scalewayNodeMatcher,
};
exports.providerRuntimeMatcher = Object.freeze({
    aws: awsNodeMatcher,
    azure: azureNodeMatcher,
    google: googleNodeMatcher,
    scaleway: scalewayNodeMatcher,
});
const isNodeMatcherKey = (input) => typeof input === 'string' && Object.keys(nodeMatcher).includes(input);
exports.isNodeMatcherKey = isNodeMatcherKey;
function assertIsSupportedRuntime(input) {
    if (!(0, exports.isNodeMatcherKey)(input)) {
        throw new assert_1.AssertionError({ actual: input, message: 'not a supported runtime' });
    }
}
const buildServerlessV3LoggerFromLegacyLogger = (legacyLogger, verbose) => ({
    error: legacyLogger.log.bind(legacyLogger),
    warning: legacyLogger.log.bind(legacyLogger),
    notice: legacyLogger.log.bind(legacyLogger),
    info: legacyLogger.log.bind(legacyLogger),
    debug: verbose ? legacyLogger.log.bind(legacyLogger) : () => null,
    verbose: legacyLogger.log.bind(legacyLogger),
    success: legacyLogger.log.bind(legacyLogger),
});
exports.buildServerlessV3LoggerFromLegacyLogger = buildServerlessV3LoggerFromLegacyLogger;
const stripEntryResolveExtensions = (file, extensions) => {
    const resolveExtensionMatch = file.localPath.match(extensions.map((ext) => ext).join('|'));
    if (resolveExtensionMatch?.length && !constants_1.DEFAULT_EXTENSIONS.includes(resolveExtensionMatch[0])) {
        const extensionParts = resolveExtensionMatch[0].split('.');
        return {
            ...file,
            localPath: file.localPath.replace(resolveExtensionMatch[0], `.${extensionParts[extensionParts.length - 1]}`),
        };
    }
    return file;
};
exports.stripEntryResolveExtensions = stripEntryResolveExtensions;
//# sourceMappingURL=helper.js.map
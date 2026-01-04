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
exports.isESMModule = exports.isEmpty = exports.zip = exports.humanSize = exports.findProjectRoot = exports.findUp = exports.SpawnError = void 0;
exports.spawnProcess = spawnProcess;
exports.trimExtension = trimExtension;
const platform_node_1 = require("@effect/platform-node");
const archiver_1 = __importDefault(require("archiver"));
const bestzip_1 = require("bestzip");
const effect_1 = require("effect");
const execa_1 = __importDefault(require("execa"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const effect_fs_1 = __importStar(require("./utils/effect-fs"));
class SpawnError extends Error {
    constructor(message, stdout, stderr) {
        super(message);
        this.stdout = stdout;
        this.stderr = stderr;
    }
    toString() {
        return `${this.message}\n${this.stderr}`;
    }
}
exports.SpawnError = SpawnError;
/**
 * Executes a child process without limitations on stdout and stderr.
 * On error (exit code is not 0), it rejects with a SpawnProcessError that contains the stdout and stderr streams,
 * on success it returns the streams in an object.
 * @param {string} command - Command
 * @param {string[]} [args] - Arguments
 * @param {Object} [options] - Options for child_process.spawn
 */
function spawnProcess(command, args, options) {
    return (0, execa_1.default)(command, args, options);
}
const rootOf = (p) => path_1.default.parse(path_1.default.resolve(p)).root;
const isPathRoot = (p) => rootOf(p) === path_1.default.resolve(p);
const findUpEffect = (names, directory = process.cwd()) => {
    const dir = path_1.default.resolve(directory);
    return effect_1.Effect.all(names.map((name) => (0, effect_fs_1.safeFileExists)(path_1.default.join(dir, name)))).pipe(effect_1.Effect.flatMap((exist) => {
        if (exist.some(Boolean))
            return effect_1.Option.some(dir);
        if (isPathRoot(dir))
            return effect_1.Option.none();
        return findUpEffect(names, path_1.default.dirname(dir));
    }));
};
/**
 * Find a file by walking up parent directories
 */
const findUp = (name) => findUpEffect([name]).pipe(effect_1.Effect.orElseSucceed(() => undefined), effect_1.Effect.provide(effect_fs_1.FSyncLayer), effect_1.Effect.runSync);
exports.findUp = findUp;
/**
 * Forwards `rootDir` or finds project root folder.
 */
const findProjectRoot = (rootDir) => effect_1.Effect.fromNullable(rootDir).pipe(effect_1.Effect.orElse(() => findUpEffect(['yarn.lock', 'pnpm-lock.yaml', 'package-lock.json'])), effect_1.Effect.orElseSucceed(() => undefined), effect_1.Effect.provide(effect_fs_1.FSyncLayer), effect_1.Effect.runSync);
exports.findProjectRoot = findProjectRoot;
const humanSize = (size) => {
    const exponent = Math.floor(Math.log(size) / Math.log(1024));
    const sanitized = (size / 1024 ** exponent).toFixed(2);
    return `${sanitized} ${['B', 'KB', 'MB', 'GB', 'TB'][exponent]}`;
};
exports.humanSize = humanSize;
const zip = async (zipPath, filesPathList, useNativeZip = false) => {
    // create a temporary directory to hold the final zip structure
    const tempDirName = `${path_1.default.basename(zipPath, path_1.default.extname(zipPath))}-${Date.now().toString()}`;
    const copyFileEffect = (temp) => (file) => effect_fs_1.default.copy(file.rootPath, path_1.default.join(temp, file.localPath));
    const bestZipEffect = (temp) => effect_1.Effect.tryPromise(() => (0, bestzip_1.bestzip)({ source: '*', destination: zipPath, cwd: temp }));
    const nodeZipEffect = effect_1.Effect.tryPromise(() => nodeZip(zipPath, filesPathList));
    const archiveEffect = (0, effect_fs_1.makeTempPathScoped)(tempDirName).pipe(
    // copy all required files from origin path to (sometimes modified) target path
    effect_1.Effect.tap((temp) => effect_1.Effect.all(filesPathList.map(copyFileEffect(temp)), { discard: true })), 
    // prepare zip folder
    effect_1.Effect.tap(() => (0, effect_fs_1.makePath)(path_1.default.dirname(zipPath))), 
    // zip the temporary directory
    effect_1.Effect.andThen((temp) => (useNativeZip ? bestZipEffect(temp) : nodeZipEffect)), effect_1.Effect.scoped);
    await archiveEffect.pipe(effect_1.Effect.provide(platform_node_1.NodeFileSystem.layer), effect_1.Effect.runPromise);
};
exports.zip = zip;
function nodeZip(zipPath, filesPathList) {
    const zipArchive = archiver_1.default.create('zip');
    const output = fs_extra_1.default.createWriteStream(zipPath);
    // write zip
    output.on('open', () => {
        zipArchive.pipe(output);
        filesPathList.forEach((file) => {
            const stats = fs_extra_1.default.statSync(file.rootPath);
            if (stats.isDirectory())
                return;
            zipArchive.append(fs_extra_1.default.readFileSync(file.rootPath), {
                name: file.localPath,
                mode: stats.mode,
                date: new Date(0), // necessary to get the same hash when zipping the same content
            });
        });
        zipArchive.finalize();
    });
    return new Promise((resolve, reject) => {
        output.on('close', resolve);
        zipArchive.on('error', (err) => reject(err));
    });
}
function trimExtension(entry) {
    return entry.slice(0, -path_1.default.extname(entry).length);
}
const isEmpty = (obj) => {
    // eslint-disable-next-line no-unreachable-loop
    for (const _i in obj)
        return false;
    return true;
};
exports.isEmpty = isEmpty;
const isESMModule = (obj) => {
    return typeof obj === 'object' && obj !== null && 'default' in obj;
};
exports.isESMModule = isESMModule;
//# sourceMappingURL=utils.js.map
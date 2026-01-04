"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FSyncLayer = exports.makeTempPathScoped = exports.safeFileRemove = exports.safeFileExists = exports.makePath = void 0;
const platform_1 = require("@effect/platform");
const effect_1 = require("effect");
const fs_extra_1 = __importDefault(require("fs-extra"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const FS = effect_1.Effect.serviceFunctions(platform_1.FileSystem.FileSystem);
const makePath = (p) => FS.makeDirectory(p, { recursive: true });
exports.makePath = makePath;
const safeFileExists = (p) => FS.exists(p).pipe(effect_1.Effect.orElseSucceed(() => false));
exports.safeFileExists = safeFileExists;
const safeFileRemove = (p) => FS.remove(p).pipe(effect_1.Effect.orElse(() => effect_1.Effect.void));
exports.safeFileRemove = safeFileRemove;
const makeTempPathScoped = (dirName) => effect_1.Effect.acquireRelease(effect_1.Effect.succeed(node_path_1.default.join(node_os_1.default.tmpdir(), dirName)).pipe(effect_1.Effect.tap(exports.makePath)), exports.safeFileRemove);
exports.makeTempPathScoped = makeTempPathScoped;
exports.FSyncLayer = platform_1.FileSystem.layerNoop({
    exists: (p) => effect_1.Effect.try({
        try: () => fs_extra_1.default.existsSync(p),
        catch: (error) => platform_1.Error.SystemError({
            module: 'FileSystem',
            reason: 'Unknown',
            method: 'exists',
            pathOrDescriptor: p,
            message: error.message,
        }),
    }),
});
exports.default = FS;
//# sourceMappingURL=effect-fs.js.map
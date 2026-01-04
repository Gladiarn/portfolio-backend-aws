"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Yarn = void 0;
const effect_1 = require("effect");
const ramda_1 = require("ramda");
const semver_1 = require("semver");
const utils_1 = require("../utils");
const getNameAndVersion = (name) => {
    const atIndex = name.lastIndexOf('@');
    return {
        name: name.slice(0, atIndex),
        version: name.slice(atIndex + 1),
    };
};
/**
 * Yarn packager.
 *
 * Yarn specific packagerOptions (default):
 *   flat (false) - Use --flat with install
 *   ignoreScripts (false) - Do not execute scripts during install
 */
class Yarn {
    constructor(packagerOptions) {
        this.packagerOptions = packagerOptions;
    }
    get lockfileName() {
        return 'yarn.lock';
    }
    get copyPackageSectionNames() {
        return ['resolutions'];
    }
    get mustCopyModules() {
        return false;
    }
    async getVersion(cwd) {
        const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
        const args = ['-v'];
        const output = await (0, utils_1.spawnProcess)(command, args, { cwd });
        return {
            version: output.stdout,
            isBerry: parseInt(output.stdout.charAt(0), 10) > 1,
        };
    }
    async getProdDependencies(cwd, depth) {
        const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
        const args = ['list', depth ? `--depth=${depth}` : null, '--json', '--production'].filter(effect_1.Predicate.isString);
        // If we need to ignore some errors add them here
        const ignoredYarnErrors = [];
        let parsedDeps;
        try {
            const processOutput = await (0, utils_1.spawnProcess)(command, args, { cwd });
            parsedDeps = JSON.parse(processOutput.stdout);
        }
        catch (err) {
            if (err instanceof utils_1.SpawnError) {
                // Only exit with an error if we have critical npm errors for 2nd level inside
                const errors = (0, ramda_1.split)('\n', err.stderr);
                const failed = (0, ramda_1.reduce)((acc, error) => {
                    if (acc) {
                        return true;
                    }
                    return (!(0, ramda_1.isEmpty)(error) &&
                        !(0, ramda_1.any)((ignoredError) => (0, ramda_1.startsWith)(`npm ERR! ${ignoredError.npmError}`, error), ignoredYarnErrors));
                }, false, errors);
                if (!failed && !(0, ramda_1.isEmpty)(err.stdout)) {
                    return { stdout: err.stdout };
                }
            }
            throw err;
        }
        const rootTree = parsedDeps.data.trees;
        // Produces a version map for the modules present in our root node_modules folder
        const rootDependencies = rootTree.reduce((deps, tree) => {
            const { name, version } = getNameAndVersion(tree.name);
            // eslint-disable-next-line no-param-reassign
            deps[name] ?? (deps[name] = {
                version,
            });
            return deps;
        }, {});
        const convertTrees = (trees) => {
            return trees.reduce((deps, tree) => {
                const { name, version } = getNameAndVersion(tree.name);
                const dependency = rootDependencies[name];
                if (tree.shadow) {
                    // Package is resolved somewhere else
                    if (dependency && (0, semver_1.satisfies)(dependency.version, version)) {
                        // Package is at root level
                        // {
                        //   "name": "samchungy-dep-a@1.0.0", <- MATCH
                        //   "children": [],
                        //   "hint": null,
                        //   "color": null,
                        //   "depth": 0
                        // },
                        // {
                        //   "name": "samchungy-a@2.0.0",
                        //   "children": [
                        //     {
                        //       "name": "samchungy-dep-a@1.0.0", <- THIS
                        //       "color": "dim",
                        //       "shadow": true
                        //     }
                        //   ],
                        //   "hint": null,
                        //   "color": "bold",
                        //   "depth": 0
                        // }
                        // eslint-disable-next-line no-param-reassign
                        deps[name] ?? (deps[name] = {
                            version,
                            isRootDep: true,
                        });
                    }
                    else {
                        // Package info is in anther child so we can just ignore
                        // samchungy-dep-a@1.0.0 is in the root (see above example)
                        // {
                        //   "name": "samchungy-b@2.0.0",
                        //   "children": [
                        //     {
                        //       "name": "samchungy-dep-a@2.0.0", <- THIS
                        //       "color": "dim",
                        //       "shadow": true
                        //     },
                        //     {
                        //       "name": "samchungy-dep-a@2.0.0",
                        //       "children": [],
                        //       "hint": null,
                        //       "color": "bold",
                        //       "depth": 0
                        //     }
                        //   ],
                        //   "hint": null,
                        //   "color": "bold",
                        //   "depth": 0
                        // }
                    }
                    return deps;
                }
                // Package is not defined, store it and get the children
                //     {
                //       "name": "samchungy-dep-a@2.0.0",
                //       "children": [],
                //       "hint": null,
                //       "color": "bold",
                //       "depth": 0
                //     }
                // eslint-disable-next-line no-param-reassign
                deps[name] ?? (deps[name] = {
                    version,
                    ...(tree?.children?.length && { dependencies: convertTrees(tree.children) }),
                });
                return deps;
            }, {});
        };
        return {
            dependencies: convertTrees(rootTree),
        };
    }
    rebaseLockfile(pathToPackageRoot, lockfile) {
        const fileVersionMatcher = /[^"/]@(?:file:)?((?:\.\/|\.\.\/).*?)[":,]/gm;
        const replacements = [];
        let match;
        // Detect all references and create replacement line strings
        // eslint-disable-next-line no-cond-assign
        while ((match = fileVersionMatcher.exec(lockfile)) !== null) {
            replacements.push({
                oldRef: typeof match[1] === 'string' ? match[1] : '',
                newRef: (0, ramda_1.replace)(/\\/g, '/', `${pathToPackageRoot}/${match[1]}`),
            });
        }
        // Replace all lines in lockfile
        return (0, ramda_1.reduce)((__, replacement) => (0, ramda_1.replace)(replacement.oldRef, replacement.newRef, __), lockfile, replacements.filter((item) => item.oldRef !== ''));
    }
    async install(cwd, extraArgs, hasLockfile = true) {
        if (this.packagerOptions.noInstall) {
            return;
        }
        const version = await this.getVersion(cwd);
        const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
        const args = !this.packagerOptions.ignoreLockfile && hasLockfile
            ? ['install', ...(version.isBerry ? ['--immutable'] : ['--frozen-lockfile', '--non-interactive']), ...extraArgs]
            : ['install', ...(version.isBerry ? [] : ['--non-interactive']), ...extraArgs];
        await (0, utils_1.spawnProcess)(command, args, { cwd });
    }
    // "Yarn install" prunes automatically
    prune(cwd) {
        return this.install(cwd, []);
    }
    async runScripts(cwd, scriptNames) {
        const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
        await Promise.all(scriptNames.map((scriptName) => (0, utils_1.spawnProcess)(command, ['run', scriptName], { cwd })));
    }
}
exports.Yarn = Yarn;
//# sourceMappingURL=yarn.js.map
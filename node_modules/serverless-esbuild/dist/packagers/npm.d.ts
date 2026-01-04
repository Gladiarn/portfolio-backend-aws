import type { DependenciesResult, JSONObject, PackagerOptions } from '../types';
import type { Packager } from './packager';
type NpmV7Map = Record<string, NpmV7Tree>;
export interface NpmV7Tree {
    version: string;
    resolved: string;
    name: string;
    integrity: string;
    _id: string;
    extraneous: boolean;
    path: string;
    _dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    peerDependencies: Record<string, string>;
    dependencies?: NpmV7Map;
}
export interface NpmV7Deps {
    version: string;
    name: string;
    description: string;
    private: boolean;
    scripts: Record<string, string>;
    _id: string;
    extraneous: boolean;
    path: string;
    _dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    peerDependencies: Record<string, string>;
    dependencies: NpmV7Map;
}
export type NpmV6Map = Record<string, NpmV6Tree>;
export interface NpmV6Tree {
    _args: string[][] | string;
    _from: string;
    _id: string;
    _integrity: string;
    _location: string;
    _phantomChildren: Record<string, string> | string;
    _requested: Record<string, unknown>;
    _requiredBy: string[] | string;
    _resolved: string;
    _spec: string;
    _where: string;
    author: string;
    license: string;
    main: string;
    name: string;
    scripts: Record<string, string> | string;
    version: string;
    readme: string;
    dependencies: NpmV6Map;
    devDependencies: Record<string, string> | string;
    optionalDependencies: Record<string, string> | string;
    _dependencies: Record<string, string> | string;
    path: string;
    error: string | Error;
    extraneous: boolean;
    _deduped?: string;
}
export interface NpmV6Deps {
    name: string;
    version: string;
    description: string;
    private: boolean;
    scripts: Record<string, string>;
    dependencies?: NpmV6Map;
    readme?: string;
    _id: string;
    _shrinkwrap: Record<string, unknown>;
    devDependencies: Record<string, string>;
    optionalDependencies: Record<string, string>;
    _dependencies: Record<string, string>;
    path: string;
    error: string | Error;
    extraneous: boolean;
}
/**
 * NPM packager.
 */
export declare class NPM implements Packager {
    private packagerOptions;
    constructor(packagerOptions: PackagerOptions);
    get lockfileName(): string;
    get copyPackageSectionNames(): never[];
    get mustCopyModules(): boolean;
    private getNpmMajorVersion;
    getProdDependencies(cwd: string, depth?: number): Promise<DependenciesResult>;
    /**
     * We should not be modifying 'package-lock.json'
     * because this file should be treated as internal to npm.
     *
     * Rebase package-lock is a temporary workaround and must be
     * removed as soon as https://github.com/npm/npm/issues/19183 gets fixed.
     */
    rebaseLockfile(pathToPackageRoot: string, lockfile: JSONObject): any;
    install(cwd: string, extraArgs: Array<string>, useLockfile: boolean): Promise<void>;
    prune(cwd: string): Promise<void>;
    runScripts(cwd: string, scriptNames: string[]): Promise<void>;
    private _rebaseFileReferences;
}
export {};
//# sourceMappingURL=npm.d.ts.map
import type { DependenciesResult, PackagerOptions } from '../types';
import type { Packager } from './packager';
interface YarnTree {
    name: string;
    color: 'bold' | 'dim' | null;
    children?: YarnTree[];
    hint?: null;
    depth?: number;
    shadow?: boolean;
}
export interface YarnDeps {
    type: 'tree';
    data: {
        type: 'list';
        trees: YarnTree[];
    };
}
/**
 * Yarn packager.
 *
 * Yarn specific packagerOptions (default):
 *   flat (false) - Use --flat with install
 *   ignoreScripts (false) - Do not execute scripts during install
 */
export declare class Yarn implements Packager {
    private packagerOptions;
    constructor(packagerOptions: PackagerOptions);
    get lockfileName(): string;
    get copyPackageSectionNames(): string[];
    get mustCopyModules(): boolean;
    getVersion(cwd: string): Promise<{
        version: string;
        isBerry: boolean;
    }>;
    getProdDependencies(cwd: string, depth?: number): Promise<DependenciesResult>;
    rebaseLockfile(pathToPackageRoot: string, lockfile: string): string;
    install(cwd: string, extraArgs: Array<string>, hasLockfile?: boolean): Promise<void>;
    prune(cwd: string): Promise<void>;
    runScripts(cwd: string, scriptNames: string[]): Promise<void>;
}
export {};
//# sourceMappingURL=yarn.d.ts.map
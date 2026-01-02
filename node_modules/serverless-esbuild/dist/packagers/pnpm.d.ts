import type { JSONObject } from '../types';
import type { Packager } from './packager';
/**
 * pnpm packager.
 */
export declare class Pnpm implements Packager {
    get lockfileName(): string;
    get copyPackageSectionNames(): never[];
    get mustCopyModules(): boolean;
    getProdDependencies(cwd: string, depth?: number): Promise<any>;
    /**
     * We should not be modifying 'pnpm-lock.yaml'
     * because this file should be treated as internal to pnpm.
     */
    rebaseLockfile(pathToPackageRoot: string, lockfile: JSONObject): any;
    install(cwd: string, extraArgs: Array<string>): Promise<void>;
    prune(cwd: string): Promise<void>;
    runScripts(cwd: string, scriptNames: string[]): Promise<void>;
    private _rebaseFileReferences;
}
//# sourceMappingURL=pnpm.d.ts.map
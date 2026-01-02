import type Serverless from 'serverless';
import type ServerlessPlugin from 'serverless/classes/Plugin';
import { packExternalModules } from './pack-externals';
import { pack, copyPreBuiltResources } from './pack';
import { preOffline } from './pre-offline';
import { preLocal } from './pre-local';
import { bundle } from './bundle';
import type { Configuration, FileBuildResult, FunctionBuildResult, ImprovedServerlessOptions, Plugins } from './types';
declare class EsbuildServerlessPlugin implements ServerlessPlugin {
    serviceDirPath: string;
    outputWorkFolder: string | undefined;
    workDirPath: string | undefined;
    outputBuildFolder: string | undefined;
    buildDirPath: string | undefined;
    packageOutputPath: string;
    log: ServerlessPlugin.Logging['log'];
    serverless: Serverless;
    options: ImprovedServerlessOptions;
    hooks: ServerlessPlugin.Hooks;
    buildOptions: Configuration | undefined;
    buildResults: FunctionBuildResult[] | undefined;
    /** Used for storing previous esbuild build results so we can rebuild more efficiently */
    buildCache: Record<string, FileBuildResult>;
    packExternalModules: typeof packExternalModules;
    pack: typeof pack;
    copyPreBuiltResources: typeof copyPreBuiltResources;
    preOffline: typeof preOffline;
    preLocal: typeof preLocal;
    bundle: typeof bundle;
    constructor(serverless: Serverless, options: ImprovedServerlessOptions, logging?: ServerlessPlugin.Logging);
    private init;
    /**
     * Checks if the runtime for the given function is nodejs.
     * If the runtime is not set , checks the global runtime.
     * @param {Serverless.FunctionDefinitionHandler} func the function to be checked
     * @returns {boolean} true if the function/global runtime is nodejs; false, otherwise
     */
    private isNodeFunction;
    /**
     * Checks if the function has a handler
     * @param {Serverless.FunctionDefinitionHandler | Serverless.FunctionDefinitionImage} func the function to be checked
     * @returns {boolean} true if the function has a handler
     */
    private isFunctionDefinitionHandler;
    get functions(): Record<string, Serverless.FunctionDefinitionHandler>;
    get plugins(): Plugins;
    get packagePatterns(): {
        patterns: string[];
        ignored: string[];
    };
    private getBuildOptions;
    get functionEntries(): import("./types").FunctionEntry[];
    watch(): void;
    prepare(): void;
    notifyServerlessOffline(): void;
    updateFile(op: string, filename: string): Promise<void>;
    /** Link or copy extras such as node_modules or package.patterns definitions */
    copyExtras(): Promise<void>;
    /**
     * Move built code to the serverless folder, taking into account individual
     * packaging preferences.
     */
    moveArtifacts(): Promise<void>;
    disposeContexts(): Promise<void>;
    cleanup(): Promise<void>;
}
export = EsbuildServerlessPlugin;
//# sourceMappingURL=index.d.ts.map
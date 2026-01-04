import type EsbuildServerlessPlugin from './index';
export declare function nodeExternalsPluginUtilsPath(): string | undefined;
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
export declare function packExternalModules(this: EsbuildServerlessPlugin): Promise<void>;
//# sourceMappingURL=pack-externals.d.ts.map
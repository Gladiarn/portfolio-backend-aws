import type EsbuildServerlessPlugin from './index';
import type { IFiles } from './types';
export declare const filterFilesForZipPackage: ({ files, functionAlias, includedFiles, excludedFiles, hasExternals, isGoogleProvider, depWhiteList, }: {
    files: IFiles;
    functionAlias: string;
    includedFiles: string[];
    excludedFiles: string[];
    hasExternals: boolean;
    isGoogleProvider: boolean;
    depWhiteList: string[];
}) => import("./types").IFile[];
export declare function pack(this: EsbuildServerlessPlugin): Promise<void>;
export declare function copyPreBuiltResources(this: EsbuildServerlessPlugin): Promise<void>;
//# sourceMappingURL=pack.d.ts.map
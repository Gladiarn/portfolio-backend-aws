import execa from 'execa';
import type { ESMPluginsModule, IFiles } from './types';
export declare class SpawnError extends Error {
    stdout: string;
    stderr: string;
    constructor(message: string, stdout: string, stderr: string);
    toString(): string;
}
/**
 * Executes a child process without limitations on stdout and stderr.
 * On error (exit code is not 0), it rejects with a SpawnProcessError that contains the stdout and stderr streams,
 * on success it returns the streams in an object.
 * @param {string} command - Command
 * @param {string[]} [args] - Arguments
 * @param {Object} [options] - Options for child_process.spawn
 */
export declare function spawnProcess(command: string, args: string[], options: execa.Options): execa.ExecaChildProcess<string>;
/**
 * Find a file by walking up parent directories
 */
export declare const findUp: (name: string) => string | undefined;
/**
 * Forwards `rootDir` or finds project root folder.
 */
export declare const findProjectRoot: (rootDir?: string) => string | undefined;
export declare const humanSize: (size: number) => string;
export declare const zip: (zipPath: string, filesPathList: IFiles, useNativeZip?: boolean) => Promise<void>;
export declare function trimExtension(entry: string): string;
export declare const isEmpty: (obj: Record<string, unknown>) => boolean;
export declare const isESMModule: (obj: unknown) => obj is ESMPluginsModule;
//# sourceMappingURL=utils.d.ts.map
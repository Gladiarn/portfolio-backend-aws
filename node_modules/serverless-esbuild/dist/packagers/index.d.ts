import type EsbuildServerlessPlugin from '../index';
import type { PackagerId, PackagerOptions } from '../types';
import type { Packager } from './packager';
/**
 * Asynchronously create a Packager instance and memoize it.
 *
 * @this EsbuildServerlessPlugin - Active plugin instance
 * @param {string} packagerId - Well known packager id
 * @returns {Promise<Packager>} - The selected Packager
 */
export declare const getPackager: (this: EsbuildServerlessPlugin, packagerId: PackagerId, packagerOptions: PackagerOptions) => Promise<Packager>;
//# sourceMappingURL=index.d.ts.map
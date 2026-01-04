/**
 * @since 0.67.0
 */
import * as FastCheck from "./FastCheck.js";
import type * as Schema from "./Schema.js";
/**
 * @category model
 * @since 0.67.0
 */
export interface LazyArbitrary<A> {
    (fc: typeof FastCheck): FastCheck.Arbitrary<A>;
}
/**
 * @category hooks
 * @since 0.67.0
 */
export declare const ArbitraryHookId: unique symbol;
/**
 * @category hooks
 * @since 0.67.0
 */
export type ArbitraryHookId = typeof ArbitraryHookId;
/**
 * @category hooks
 * @since 0.72.3
 */
export interface GenerationContext {
    readonly depthIdentifier?: string;
    readonly maxDepth: number;
}
/**
 * @category hooks
 * @since 0.72.3
 */
export type ArbitraryAnnotation<A> = (...args: [...ReadonlyArray<LazyArbitrary<any>>, GenerationContext]) => LazyArbitrary<A>;
/**
 * @category annotations
 * @since 0.67.0
 */
export declare const arbitrary: <A>(annotation: ArbitraryAnnotation<A>) => <I, R>(self: Schema.Schema<A, I, R>) => Schema.Schema<A, I, R>;
/**
 * Returns a LazyArbitrary for the `A` type of the provided schema.
 *
 * @category arbitrary
 * @since 0.67.0
 */
export declare const makeLazy: <A, I, R>(schema: Schema.Schema<A, I, R>) => LazyArbitrary<A>;
/**
 * Returns a fast-check Arbitrary for the `A` type of the provided schema.
 *
 * @category arbitrary
 * @since 0.67.0
 */
export declare const make: <A, I, R>(schema: Schema.Schema<A, I, R>) => FastCheck.Arbitrary<A>;
//# sourceMappingURL=Arbitrary.d.ts.map
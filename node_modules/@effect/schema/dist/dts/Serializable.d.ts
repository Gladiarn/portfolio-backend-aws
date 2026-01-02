/**
 * @since 0.67.0
 */
import type * as Effect from "effect/Effect";
import type * as Exit from "effect/Exit";
import type * as ParseResult from "./ParseResult.js";
import * as Schema from "./Schema.js";
/**
 * @since 0.67.0
 * @category symbol
 */
export declare const symbol: unique symbol;
/**
 * The `Serializable` trait allows objects to define their own schema for
 * serialization.
 *
 * @since 0.67.0
 * @category model
 */
export interface Serializable<A, I, R> {
    readonly [symbol]: Schema.Schema<A, I, R>;
}
/**
 * @since 0.67.0
 * @category model
 */
export declare namespace Serializable {
    /**
     * @since 0.68.15
     */
    type Type<T> = T extends Serializable<infer A, infer _I, infer _R> ? A : never;
    /**
     * @since 0.68.15
     */
    type Encoded<T> = T extends Serializable<infer _A, infer I, infer _R> ? I : never;
    /**
     * @since 0.67.0
     */
    type Context<T> = T extends Serializable<infer _A, infer _I, infer R> ? R : never;
    /**
     * @since 0.69.0
     */
    type Any = Serializable<any, any, unknown>;
    /**
     * @since 0.69.0
     */
    type All = Any | Serializable<any, never, unknown> | Serializable<never, any, unknown> | Serializable<never, never, unknown>;
}
/**
 * @since 0.69.0
 */
export declare const asSerializable: <S extends Serializable.All>(serializable: S) => Serializable<Serializable.Type<S>, Serializable.Encoded<S>, Serializable.Context<S>>;
/**
 * @since 0.67.0
 * @category accessor
 */
export declare const selfSchema: <A, I, R>(self: Serializable<A, I, R>) => Schema.Schema<A, I, R>;
/**
 * @since 0.67.0
 * @category encoding
 */
export declare const serialize: <A, I, R>(self: Serializable<A, I, R>) => Effect.Effect<I, ParseResult.ParseError, R>;
/**
 * @since 0.67.0
 * @category decoding
 */
export declare const deserialize: {
    (value: unknown): <A, I, R>(self: Serializable<A, I, R>) => Effect.Effect<A, ParseResult.ParseError, R>;
    <A, I, R>(self: Serializable<A, I, R>, value: unknown): Effect.Effect<A, ParseResult.ParseError, R>;
};
/**
 * @since 0.67.0
 * @category symbol
 */
export declare const symbolResult: unique symbol;
/**
 * The `WithResult` trait is designed to encapsulate the outcome of an
 * operation, distinguishing between success and failure cases. Each case is
 * associated with a schema that defines the structure and types of the success
 * or failure data.
 *
 * @since 0.67.0
 * @category model
 */
export interface WithResult<Success, SuccessEncoded, Failure, FailureEncoded, ResultR> {
    readonly [symbolResult]: {
        readonly success: Schema.Schema<Success, SuccessEncoded, ResultR>;
        readonly failure: Schema.Schema<Failure, FailureEncoded, ResultR>;
    };
}
/**
 * @since 0.67.0
 * @category model
 */
export declare namespace WithResult {
    /**
     * @since 0.68.16
     */
    type Success<T> = T extends WithResult<infer _A, infer _I, infer _E, infer _EI, infer _R> ? _A : never;
    /**
     * @since 0.69.0
     */
    type SuccessEncoded<T> = T extends WithResult<infer _A, infer _I, infer _E, infer _EI, infer _R> ? _I : never;
    /**
     * @since 0.69.0
     */
    type Failure<T> = T extends WithResult<infer _A, infer _I, infer _E, infer _EI, infer _R> ? _E : never;
    /**
     * @since 0.69.0
     */
    type FailureEncoded<T> = T extends WithResult<infer _A, infer _I, infer _E, infer _EI, infer _R> ? _EI : never;
    /**
     * @since 0.67.0
     */
    type Context<T> = T extends WithResult<infer _SA, infer _SI, infer _FA, infer _FI, infer R> ? R : never;
    /**
     * @since 0.69.0
     */
    type Any = WithResult<any, any, any, any, unknown>;
    /**
     * @since 0.69.0
     */
    type All = Any | WithResult<any, any, never, never, unknown>;
}
/**
 * @since 0.69.0
 */
export declare const asWithResult: <WR extends WithResult.All>(withExit: WR) => WithResult<WithResult.Success<WR>, WithResult.SuccessEncoded<WR>, WithResult.Failure<WR>, WithResult.FailureEncoded<WR>, WithResult.Context<WR>>;
/**
 * @since 0.67.0
 * @category accessor
 */
export declare const failureSchema: <SA, SI, FA, FI, R>(self: WithResult<SA, SI, FA, FI, R>) => Schema.Schema<FA, FI, R>;
/**
 * @since 0.67.0
 * @category accessor
 */
export declare const successSchema: <SA, SI, FA, FI, R>(self: WithResult<SA, SI, FA, FI, R>) => Schema.Schema<SA, SI, R>;
/**
 * @since 0.67.0
 * @category accessor
 */
export declare const exitSchema: <SA, SI, FA, FI, R>(self: WithResult<SA, SI, FA, FI, R>) => Schema.Schema<Exit.Exit<SA, FA>, Schema.ExitEncoded<SI, FI, unknown>, R>;
/**
 * @since 0.67.0
 * @category encoding
 */
export declare const serializeFailure: {
    <FA>(value: FA): <SA, SI, FI, R>(self: WithResult<SA, SI, FA, FI, R>) => Effect.Effect<FI, ParseResult.ParseError, R>;
    <SA, SI, FA, FI, R>(self: WithResult<SA, SI, FA, FI, R>, value: FA): Effect.Effect<FI, ParseResult.ParseError, R>;
};
/**
 * @since 0.67.0
 * @category decoding
 */
export declare const deserializeFailure: {
    (value: unknown): <SA, SI, FA, FI, R>(self: WithResult<SA, SI, FA, FI, R>) => Effect.Effect<FA, ParseResult.ParseError, R>;
    <SA, SI, FA, FI, R>(self: WithResult<SA, SI, FA, FI, R>, value: unknown): Effect.Effect<FA, ParseResult.ParseError, R>;
};
/**
 * @since 0.67.0
 * @category encoding
 */
export declare const serializeSuccess: {
    <SA>(value: SA): <SI, FA, FI, R>(self: WithResult<SA, SI, FA, FI, R>) => Effect.Effect<SI, ParseResult.ParseError, R>;
    <SA, SI, FA, FI, R>(self: WithResult<SA, SI, FA, FI, R>, value: SA): Effect.Effect<SI, ParseResult.ParseError, R>;
};
/**
 * @since 0.67.0
 * @category decoding
 */
export declare const deserializeSuccess: {
    (value: unknown): <SA, SI, FA, FI, R>(self: WithResult<SA, SI, FA, FI, R>) => Effect.Effect<SA, ParseResult.ParseError, R>;
    <SA, SI, FA, FI, R>(self: WithResult<SA, SI, FA, FI, R>, value: unknown): Effect.Effect<SA, ParseResult.ParseError, R>;
};
/**
 * @since 0.67.0
 * @category encoding
 */
export declare const serializeExit: {
    <SA, FA>(value: Exit.Exit<SA, FA>): <SI, FI, R>(self: WithResult<SA, SI, FA, FI, R>) => Effect.Effect<Schema.ExitEncoded<SI, FI, unknown>, ParseResult.ParseError, R>;
    <SA, SI, FA, FI, R>(self: WithResult<SA, SI, FA, FI, R>, value: Exit.Exit<SA, FA>): Effect.Effect<Schema.ExitEncoded<SI, FI, unknown>, ParseResult.ParseError, R>;
};
/**
 * @since 0.67.0
 * @category decoding
 */
export declare const deserializeExit: {
    (value: unknown): <SA, SI, FA, FI, R>(self: WithResult<SA, SI, FA, FI, R>) => Effect.Effect<Exit.Exit<SA, FA>, ParseResult.ParseError, R>;
    <SA, SI, FA, FI, R>(self: WithResult<SA, SI, FA, FI, R>, value: unknown): Effect.Effect<Exit.Exit<SA, FA>, ParseResult.ParseError, R>;
};
/**
 * The `SerializableWithResult` trait is specifically designed to model remote
 * procedures that require serialization of their input and output, managing
 * both successful and failed outcomes.
 *
 * This trait combines functionality from both the `Serializable` and `WithResult`
 * traits to handle data serialization and the bifurcation of operation results
 * into success or failure categories.
 *
 * @since 0.67.0
 * @category model
 */
export interface SerializableWithResult<A, I, R, Success, SuccessEncoded, Failure, FailureEncoded, ResultR> extends Serializable<A, I, R>, WithResult<Success, SuccessEncoded, Failure, FailureEncoded, ResultR> {
}
/**
 * @since 0.67.0
 * @category model
 */
export declare namespace SerializableWithResult {
    /**
     * @since 0.69.0
     */
    type Context<P> = P extends SerializableWithResult<infer _S, infer _SI, infer SR, infer _A, infer _AI, infer _E, infer _EI, infer RR> ? SR | RR : never;
    /**
     * @since 0.69.0
     */
    type Any = SerializableWithResult<any, any, any, any, any, any, any, unknown>;
    /**
     * @since 0.69.0
     */
    type All = Any | SerializableWithResult<any, any, any, any, any, never, never, unknown>;
}
/**
 * @since 0.69.0
 */
export declare const asSerializableWithResult: <SWR extends SerializableWithResult.All>(procedure: SWR) => SerializableWithResult<Serializable.Type<SWR>, Serializable.Encoded<SWR>, Serializable.Context<SWR>, WithResult.Success<SWR>, WithResult.SuccessEncoded<SWR>, WithResult.Failure<SWR>, WithResult.FailureEncoded<SWR>, WithResult.Context<SWR>>;
//# sourceMappingURL=Serializable.d.ts.map
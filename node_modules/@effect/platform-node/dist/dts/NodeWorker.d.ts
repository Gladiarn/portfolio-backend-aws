/**
 * @since 1.0.0
 */
import type * as Worker from "@effect/platform/Worker";
import type * as Layer from "effect/Layer";
import type * as WorkerThreads from "node:worker_threads";
/**
 * @since 1.0.0
 * @category layers
 */
export declare const layerManager: Layer.Layer<Worker.WorkerManager>;
/**
 * @since 1.0.0
 * @category layers
 */
export declare const layerWorker: Layer.Layer<Worker.PlatformWorker>;
/**
 * @since 1.0.0
 * @category layers
 */
export declare const layer: (spawn: (id: number) => WorkerThreads.Worker) => Layer.Layer<Worker.WorkerManager | Worker.Spawner, never, never>;
//# sourceMappingURL=NodeWorker.d.ts.map
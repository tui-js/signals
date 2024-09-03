export { BaseSignal, getValue, type MaybeSignal } from "./src/base.ts";
export { computed, ComputedSignal, effect } from "./src/computed.ts";
export { DependantSignal } from "./src/dependant.ts";
export { Signal, signal } from "./src/signal.ts";

export { getIntermediate, isObservable } from "./src/observables/shared.ts";
export {
    deepObservableArray,
    type ObservableArray,
    shallowObservableArray,
} from "./src/observables/array.ts";
export {
    type ObservableObject,
    observableObject,
    type ObservableObjectIntermediate,
} from "./src/observables/object.ts";

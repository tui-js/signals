import { $access, $value, BaseSignal } from "./base.ts";
import { DependantSignal } from "./dependant.ts";

// TODO: Only watch root dependencies

export function computed<T>(computation: () => T): ComputedSignal<T> {
    return new ComputedSignal(computation);
}

export function effect(effect: () => void): ComputedSignal<void> {
    return new ComputedSignal(effect);
}

export class ComputedSignal<T> extends DependantSignal<T> {
    constructor(computation: () => T) {
        super(undefined as T, () => {
            this[$value] = computation();
            this.updateDependants();
        });

        // TODO: destroy if no signals were associated with this
        BaseSignal.activeSignal = this;
        this[$value] = computation();
        BaseSignal.activeSignal = undefined;
    }

    [$access](signal: BaseSignal): void {
        this.dependencies.add(signal);
        signal.dependants ??= new Set();
        signal.dependants.add(this);
        signal.sideEffects ??= new Set();
        signal.sideEffects.add(this.sideEffect);
    }
}

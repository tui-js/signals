import { $access, $value, BaseSignal } from "./base.ts";
import { DependantSignal } from "./dependant.ts";

export function signal<T>(value: T): Signal<T> {
    return new Signal(value);
}

export class Signal<T> extends BaseSignal<T> {
    set(value: T): this {
        BaseSignal.activeSignal?.[$access]?.(this);

        if (typeof value !== "object" && value === this[$value]) return this;

        this[$value] = value;
        this.updateDependants();

        return this;
    }

    modify(modifier: (value: T) => T): this {
        return this.set(modifier(this[$value]));
    }

    derive<Y>(computation: (value: T) => Y): DependantSignal<Y> {
        const derived = new DependantSignal(computation(this[$value]), () => {
            derived[$value] = computation(this[$value]);
            derived.updateDependants();
        });
        derived.dependencies.add(this);
        this.dependants ??= new Set();
        this.dependants.add(derived);
        this.sideEffects ??= new Set();
        this.sideEffects.add(derived.sideEffect);
        return derived;
    }
}

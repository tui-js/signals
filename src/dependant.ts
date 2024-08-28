import { BaseSignal, type SideEffect } from "./base.ts";

export class DependantSignal<T> extends BaseSignal<T> {
    dependencies = new Set<BaseSignal>();
    sideEffect: SideEffect;

    constructor(value: T, sideEffect: SideEffect) {
        super(value);

        this.sideEffect = sideEffect;
    }

    [Symbol.dispose]() {
        super[Symbol.dispose]();

        for (const { sideEffects, dependants } of this.dependencies) {
            dependants?.delete(this);
            sideEffects?.delete(this.sideEffect);
        }
    }
}

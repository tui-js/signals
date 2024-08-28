export const $value = Symbol.for("Tui.SignalValue");
export const $access = Symbol.for("Tui.SignalAccess");

export type SideEffect = () => void;

export type MaybeSignal<T> = T | BaseSignal<T>;

export function getValue<T>(maybeSignal: MaybeSignal<T>): T {
    return typeof maybeSignal === "object" && maybeSignal instanceof BaseSignal
        ? maybeSignal.get()
        : maybeSignal;
}

export class BaseSignal<T = unknown> {
    static activeSignal?: BaseSignal;

    protected [$value]: T;
    protected [$access]?(signal: BaseSignal): void;

    dependants?: Set<BaseSignal>;
    sideEffects?: Set<SideEffect>;

    constructor(value: T) {
        this[$value] = value;

        // TODO: Other objects
        if (Array.isArray(value)) {
            const { push, unshift, pop, splice, sort } = value;

            const updateable = <P extends Array<unknown>, R extends unknown>(
                method: (...args: P) => R,
            ) => {
                const newMethod = method.bind(value);
                return (...args: P) => {
                    const result = newMethod(...args);
                    this.updateDependants();
                    return result;
                };
            };

            Object.defineProperties(value, {
                push: { value: updateable(push) },
                unshift: { value: updateable(unshift) },
                pop: { value: updateable(pop) },
                splice: { value: updateable(splice) },
                sort: { value: updateable(sort) },
            });
        }
    }

    updateDependants() {
        if (!this.sideEffects) return;
        for (const sideEffect of this.sideEffects) {
            sideEffect();
        }
    }

    get(): T {
        BaseSignal.activeSignal?.[$access]?.(this);
        return this[$value];
    }

    [Symbol.dispose]() {
        if (!this.dependants) return;

        for (const dependant of this.dependants) {
            dependant[Symbol.dispose]();
        }
    }
}

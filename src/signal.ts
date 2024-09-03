import { $access, $value, BaseSignal } from "./base.ts";

export function signal<T>(value: T): Signal<T> {
    return new Signal(value);
}

export class Signal<T> extends BaseSignal<T> {
    set(value: T): this {
        BaseSignal.activeSignal?.[$access]?.(this);

        this[$value] = value;
        this.updateDependants();

        return this;
    }

    modify(modifier: (value: T) => T): this {
        return this.set(modifier(this[$value]));
    }
}

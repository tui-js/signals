import { $access, BaseSignal } from "../base.ts";
import { type Signal, signal } from "../signal.ts";
import { brandObservable, type Observable } from "./shared.ts";

export type ObservableArray<T> = Observable<T, Signal<T>>;

export function deepObservableArray<T extends unknown[]>(array: T): ObservableArray<T> {
    const intermediate = signal(array);

    const observable: ObservableArray<T> = brandObservable(array, intermediate);

    // TODO: Consider overwriting methods to reduce the number of unnecessary changes
    return new Proxy(observable, {
        get(target, property, receiver) {
            if (property === Symbol.toStringTag) {
                return "Tui.DeepObservableArray";
            }
            BaseSignal.activeSignal?.[$access]?.(intermediate);
            return Reflect.get(target, property, receiver);
        },
        set(target, property, value, receiver) {
            const changed = Reflect.set(target, property, value, receiver);
            intermediate.updateDependants();
            return changed;
        },
    });
}

export function shallowObservableArray<T extends unknown[]>(array: T): ObservableArray<T> {
    const intermediate = signal(array);
    const observable: ObservableArray<T> = brandObservable(array, intermediate);

    const accessIntermediate = () => {
        BaseSignal.activeSignal?.[$access]?.(intermediate);
        intermediate.updateDependants();
    };

    const push = array.push.bind(array);
    const unshift = array.unshift.bind(array);
    const pop = array.pop.bind(array);
    const splice = array.splice.bind(array);
    const sort = array.sort.bind(array);

    return Object.defineProperties(observable, {
        [Symbol.toStringTag]: {
            value: "Tui.ShallowObservableArray",
        },
        push: {
            value(...args: unknown[]) {
                if (args.length) accessIntermediate();
                return push(...args);
            },
        },
        unshift: {
            value(...args: unknown[]) {
                if (args.length) accessIntermediate();
                return unshift(...args);
            },
        },
        pop: {
            value() {
                if (array.length) accessIntermediate();
                return pop();
            },
        },
        splice: {
            value(start: number, deleteCount?: number, ...items: unknown[]) {
                if (deleteCount || items.length) accessIntermediate();
                return splice(start, deleteCount!, ...items);
            },
        },
        sort: {
            value(cb: ((a: unknown, b: unknown) => number) | undefined) {
                // It is too expensive to check if sort() actually changed the array
                // So we assume it just always does
                accessIntermediate();
                return sort(cb);
            },
        },
    });
}

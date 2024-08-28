import { type Signal, signal } from "./signal.ts";

export const $intermediate = Symbol.for("Tui.ObservableIntermediate");
export const $observable = Symbol.for("Tui.Observable");
export type Observable<T> = T & {
    [$intermediate]: ObservableIntermediate<T>;
    [$observable]: true;
};
export type ObservableIntermediate<T> = { [key in keyof T]: Signal<T[key]> };

// TOOD: option for deep observable

export function observable<T extends object>(object: T): Observable<T> {
    type Key = keyof T;

    const intermediate = {} as ObservableIntermediate<T>;
    for (const key in object) {
        intermediate[key] = signal(object[key]);
        delete object[key];
    }

    const observable = Object.assign(object, {
        [$intermediate]: intermediate,
        [$observable]: true as const,
    });

    return new Proxy(observable, {
        get(target, property, receiver) {
            if (property === Symbol.toStringTag) {
                return "Tui.Observable";
            }

            if (property in intermediate) {
                return intermediate[property as Key].get();
            }
            return Reflect.get(target, property, receiver);
        },
        set(target, property, value, receiver) {
            if (property in intermediate) {
                intermediate[property as Key].set(value);
                return true;
            }
            return Reflect.set(target, property, value, receiver);
        },
    });
}

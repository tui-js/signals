export const $intermediate = Symbol.for("Tui.ObservableIntermediate");
export const $observable = Symbol.for("Tui.Observable");

export type Observable<T, I> = T & {
  [$observable]: true;
  [$intermediate]: I;
};

export function brandObservable<T, I>(object: T, intermediate: I): Observable<T, I> {
  return Object.defineProperties(object, {
    [$observable]: { value: true },
    [$intermediate]: { value: intermediate },
  }) as Observable<T, I>;
}

export function getIntermediate<T, I>(observable: Observable<T, I>): I {
  return observable[$intermediate];
}

export function isObservable<T extends object>(object: T): object is Observable<T, unknown> {
  return $observable in object && object[$observable] === true;
}

export const $value = Symbol.for("Tui.SignalValue");
export const $access = Symbol.for("Tui.SignalAccess");

export type SideEffect = () => void;

export type MaybeSignal<T> = T | BaseSignal<T>;

export function getValue<T>(maybeSignal: MaybeSignal<T>): T {
  return maybeSignal instanceof BaseSignal ? maybeSignal.get() : maybeSignal;
}

// deno-lint-ignore no-explicit-any
export class BaseSignal<T = any> {
  static activeSignal?: BaseSignal;

  protected [$value]: T;
  protected [$access]?(signal: BaseSignal): void;

  dependants?: Set<BaseSignal>;
  sideEffects?: Set<SideEffect>;

  constructor(value: T) {
    this[$value] = value;
  }

  updateDependants() {
    if (!this.sideEffects) return;
    for (const sideEffect of this.sideEffects) {
      sideEffect();
    }
  }

  peek(): Readonly<T> {
    return this[$value];
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

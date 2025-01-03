import { $access, $value, BaseSignal } from "./base.ts";
import { DependantSignal } from "./dependant.ts";

// TODO: Support observables as explicit dependencies

export type SignalValues<T extends Nullable<BaseSignal>[]> = {
  [Key in keyof T]: T[Key] extends BaseSignal<infer Value> ? Value : undefined;
};

type Nullable<V> = V | undefined | null;

// TODO: Try to make types more readable because its ugh
export function computed<T>(computation: () => T): ComputedSignal<T>;
export function computed<T, const D extends Nullable<BaseSignal>[]>(
  dependencies: D,
  computation: (...args: SignalValues<D>) => T,
): ComputedSignal<T, D>;
export function computed<T, const D extends BaseSignal[]>(
  dependenciesOrComputation?: (() => T) | D,
  computation?: () => T,
): ComputedSignal<T, D> {
  if (typeof dependenciesOrComputation === "function") {
    const computation = dependenciesOrComputation;
    return new ComputedSignal(computation);
  }

  const dependencies = dependenciesOrComputation;
  return new ComputedSignal(computation!, dependencies);
}

export function effect(effect: () => void): ComputedSignal<void> {
  return new ComputedSignal(effect);
}

export class ComputedSignal<T, D extends Nullable<BaseSignal>[] = []> extends DependantSignal<T> {
  constructor(computation: (...args: SignalValues<D>) => T, dependencies?: D);
  constructor(computation: () => T);
  constructor(computation: (...args: unknown[]) => T, dependencies?: D) {
    if (dependencies) {
      super(
        computation(...dependencies.map((dependency) => dependency?.[$value]!)),
        () => {
          this[$value] = computation(...dependencies.map((dependency) => dependency?.[$value]!));
          this.updateDependants();
        },
      );

      for (const dependency of dependencies) {
        if (dependency) this[$access](dependency);
      }
      return;
    }

    super(undefined!, () => {
      this[$value] = computation();
      this.updateDependants();
    });

    BaseSignal.activeSignal = this;
    this[$value] = computation();
    BaseSignal.activeSignal = undefined;

    if (this.dependencies.size === 0) {
      this[Symbol.dispose]();
    }
  }

  override [$access](signal: BaseSignal): void {
    if (signal instanceof DependantSignal) {
      for (const dependency of signal.dependencies) {
        this[$access](dependency);
      }
      return;
    }

    this.dependencies.add(signal);
    signal.dependants ??= new Set();
    signal.dependants.add(this);
    signal.sideEffects ??= new Set();
    signal.sideEffects.add(this.sideEffect);
  }
}

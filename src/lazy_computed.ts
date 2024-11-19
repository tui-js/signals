import { BaseSignal, DependantSignal } from "../mod.ts";
import { $access, $value } from "./base.ts";

export type SignalValues<T extends BaseSignal[]> = {
  [Key in keyof T]: T[Key] extends BaseSignal<infer Value> ? Value : never;
};

// TODO: Try to make types more readable because its ugh
export function lazyComputed<T>(delay: number, computation: () => T): LazyComputedSignal<T>;
export function lazyComputed<T, const D extends BaseSignal[]>(
  delay: number,
  dependencies: D,
  computation: (...args: SignalValues<D>) => T,
): LazyComputedSignal<T, D>;
export function lazyComputed<T, const D extends BaseSignal[]>(
  delay: number,
  dependenciesOrComputation?: (() => T) | D,
  computation?: () => T,
): LazyComputedSignal<T, D> {
  if (typeof dependenciesOrComputation === "function") {
    const computation = dependenciesOrComputation;
    return new LazyComputedSignal(delay, computation);
  }

  const dependencies = dependenciesOrComputation;
  return new LazyComputedSignal(delay, computation!, dependencies);
}

export function lazyEffect(delay: number, effect: () => void): LazyComputedSignal<void> {
  return new LazyComputedSignal(delay, effect);
}

export class LazyComputedSignal<T, D extends BaseSignal[] = []> extends DependantSignal<T> {
  #lastFired = Date.now();
  #timeout?: number;
  delay: number;

  constructor(delay: number, computation: (...args: SignalValues<D>) => T, dependencies?: D);
  constructor(delay: number, computation: () => T);
  constructor(delay: number, computation: (...args: unknown[]) => T, dependencies?: D) {
    if (dependencies) {
      const computeWithDependencies = () => {
        this[$value] = computation(
          ...dependencies.map((dependency) => dependency[$value]!),
        );
        this.updateDependants();
        this.#lastFired = Date.now();
      };

      super(
        computation(...dependencies.map((dependency) => dependency[$value]!)),
        () => {
          if (Date.now() - this.#lastFired > delay) {
            clearTimeout(this.#timeout);
            computeWithDependencies();
          } else {
            clearTimeout(this.#timeout);
            this.#timeout = setTimeout(computeWithDependencies, this.delay);
          }
        },
      );

      this.delay = delay;

      for (const dependency of dependencies) {
        this[$access](dependency);
      }
      return;
    }

    const compute = () => {
      this[$value] = computation();
      this.updateDependants();
      this.#lastFired = Date.now();
    };

    super(undefined!, () => {
      if (Date.now() - this.#lastFired > delay) {
        clearTimeout(this.#timeout);
        compute();
      } else {
        clearTimeout(this.#timeout);
        this.#timeout = setTimeout(compute, this.delay);
      }
    });
    this.delay = delay;

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

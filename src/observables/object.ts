import { type Signal, signal } from "../signal.ts";
import { brandObservable, type Observable } from "./shared.ts";

export type ObservableObject<T> = Observable<T, ObservableObjectIntermediate<T>>;
export type ObservableObjectIntermediate<T> = { [key in keyof T]: Signal<T[key]> };

// TOOD: option for deep observable

export function observableObject<T extends object>(object: T): ObservableObject<T> {
  type Key = keyof T;

  // We use intermediate object to make sure the values are signals
  // In case someone directly modified the object beforehand to contain non-signal values
  const intermediate = {} as ObservableObjectIntermediate<T>;
  for (const key in object) {
    intermediate[key] = signal(object[key]);
    // We remove the value from the original object
    // To prevent misusing it instead, as it is not kept up-to-date
    delete object[key];
  }

  const observable: ObservableObject<T> = brandObservable(object, intermediate);

  return new Proxy(observable, {
    get(target, property, receiver) {
      if (property === Symbol.toStringTag) {
        return "Tui.ObservableObject";
      }

      if (property in intermediate) {
        return intermediate[property as Key].get();
      }

      return Reflect.get(target, property, receiver);
    },
    set(_, property, value) {
      if (property in intermediate) {
        intermediate[property as Key].set(value);
      } else {
        intermediate[property as Key] = signal(value);
      }
      return true;
    },
  });
}

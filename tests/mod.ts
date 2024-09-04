import { computed, deepObservableArray, shallowObservableArray, signal } from "../mod.ts";
import { assertEquals } from "jsr:@std/assert";
import { effect } from "../src/computed.ts";
import { $intermediate } from "../src/observables/shared.ts";
import { observableObject } from "../src/observables/object.ts";

Deno.test("mod.ts", async (t) => {
    await t.step("Signal", () => {
        let fiveCalls = 0;
        let tenCalls = 0;

        const num = signal(0);

        // call only when signal is equal to 5
        const fiveCallback = () => ++fiveCalls;
        const fiveCounting = computed([num], (num) => {
            if (num === 5) fiveCallback();
        });
        const tenCounting = computed([num], (num) => {
            if (num === 10) ++tenCalls;
        });

        assertEquals(num.get(), 0);

        num.set(5);
        assertEquals(num.get(), 5);
        assertEquals(fiveCalls, 1);

        num.set(10);
        num.set(10); // doesnt update when value isnt changed
        assertEquals(num.get(), 10);
        assertEquals(fiveCalls, 1);
        assertEquals(tenCalls, 1);

        num.set(5);
        num.set(5);
        assertEquals(fiveCalls, 2);

        tenCounting[Symbol.dispose]();

        num.set(10);
        assertEquals(tenCalls, 1);

        fiveCounting[Symbol.dispose]();

        num.set(5);
        assertEquals(fiveCalls, 2);

        num.set(10);
    });

    await t.step("Observables", async (t) => {
        await t.step("observableObject", () => {
            const observable = observableObject({
                uno: 1,
                dos: 2,
                tres: 3,
            });

            assertEquals(observable.uno, 1);
            assertEquals(observable.dos, 2);
            assertEquals(observable.tres, 3);

            const twice = computed(() => {
                // Keep in mind it creates a new object every time
                // It's definitely an idea to explore to see
                // if making objects like this just once is a good idea
                return {
                    uno: observable.uno * 2,
                    dos: observable.dos * 2,
                    tres: observable.tres * 2,
                };
            });

            assertEquals(twice.get(), {
                uno: 2,
                dos: 4,
                tres: 6,
            });

            observable.uno = 2;

            assertEquals(twice.get(), {
                uno: 4,
                dos: 4,
                tres: 6,
            });
        });

        await t.step("deepObservableArray", () => {
            const observable = deepObservableArray<number[]>([]);

            let counter = 0;
            effect(() => {
                observable[$intermediate].get();
                counter++;
            });
            assertEquals(counter, 1);

            observable[0] = 1;
            assertEquals(counter, 2);

            // It changes both the value and length
            observable.push(3);
            assertEquals(counter, 4);

            // It shifts the 2 elements, then adds a new value and changes length
            observable.unshift(2);
            assertEquals(counter, 8);

            // Moves elements around
            observable.sort();
            assertEquals(counter, 11);

            // Just pops last element
            observable.pop();
            assertEquals(counter, 12);

            // Shifts the two elements
            observable.shift();
            assertEquals(counter, 14);
        });

        await t.step("shallowObservableArray", () => {
            const observable = shallowObservableArray<number[]>([]);

            let counter = 0;
            effect(() => {
                observable[$intermediate].get();
                counter++;
            });
            assertEquals(counter, 1);

            // Unlike deepObservableArray shallowObservableArray only tracks changes that happen through modifing methods
            //  - It also means that deepObservableArray causes unnecessary updates when multiple properties get changed by one method call
            //    This probably will change in the future
            // that means that shallowObservableArray does not track index changes
            observable[0] = 1;
            assertEquals(counter, 1);

            observable.push(3);
            assertEquals(counter, 2);

            observable.unshift(2);
            assertEquals(counter, 3);

            observable.sort();
            assertEquals(counter, 4);

            observable.pop();
            observable.pop();
            observable.pop();
            assertEquals(counter, 7);

            // No elements in array – nothing changed
            observable.pop();
            assertEquals(counter, 7);

            // No elements in array – nothing changed
            observable.shift();
            assertEquals(counter, 7);

            observable.push(1, 2, 3);
            assertEquals(counter, 8);

            observable.shift();
            assertEquals(counter, 9);
        });
    });
});

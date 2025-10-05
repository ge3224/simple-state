import { describe, assert, it, beforeEach, vi } from "vitest";
import { newSimpleState } from "./index";

describe("get", () => {
  it("should return a number when initialized with a number", () => {
    const ss = newSimpleState(0);
    assert.equal(
      typeof ss.get(),
      "number",
      "Expected a return value of type number"
    );
  });

  it("should return an empty string when initialized with an empty string", () => {
    const ss = newSimpleState("");
    assert.equal(
      ss.get(),
      "",
      "Expected the state to be initialized with an empty string"
    );
  });

  it("should return false when initialized with false", () => {
    const ss = newSimpleState(false);
    assert.equal(
      ss.get(),
      false,
      "Expected the state to be initialized with false"
    );
  });

  it("should return an empty object when initialized with an empty object", () => {
    const ss = newSimpleState({});
    assert.equal(
      Object.keys(ss.get()).length,
      0,
      "Expected the state to be initialized with an empty object"
    );
  });

  it("should return an empty array when initialized with an empty array", () => {
    const ss = newSimpleState([]);
    assert.equal(
      ss.get().length,
      0,
      "Expected the state to be initialized with an empty array"
    );
  });

  it("should return null when initialized with null", () => {
    const ss = newSimpleState(null);
    assert.equal(
      ss.get(),
      null,
      "Expected the state to be initialized with null"
    );
  });

  it("should return undefined when initialized with undefined", () => {
    const ss = newSimpleState(undefined);
    assert.equal(
      ss.get(),
      undefined,
      "Expected the state to be initialized with undefined"
    );
  });

  it("should return a Map when initialized with a Map", () => {
    const map = new Map();
    map.set("key", "value");
    const ss = newSimpleState(map);
    const result = ss.get();
    assert.isTrue(result instanceof Map, "Expected state to be a Map");
    assert.equal(
      result.get("key"),
      "value",
      "Expected the Map to contain the correct value"
    );
  });

  it("should return a Set when initialized with a Set", () => {
    const set = new Set([1, 2, 3]);
    const ss = newSimpleState(set);
    const result = ss.get();
    assert.isTrue(result instanceof Set, "Expected state to be a Set");
    assert.isTrue(result.has(2), "Expected the Set to contain the number 2");
  });

  it("should return a Date when initialized with a Date", () => {
    const date = new Date("2024-01-01");
    const ss = newSimpleState(date);
    const result = ss.get();
    assert.isTrue(result instanceof Date, "Expected state to be a Date");
    assert.equal(
      result.getUTCFullYear(),
      2024,
      "Expected the Date to be January 1, 2024"
    );
  });

  it("should return an Array when initialized with an Array", () => {
    const array = [1, 2, 3];
    const ss = newSimpleState(array);
    const result = ss.get();
    assert.isTrue(Array.isArray(result), "Expected state to be an Array");
    assert.equal(result.length, 3, "Expected the Array to have 3 elements");
    assert.equal(result[0], 1, "Expected the first element to be 1");
  });

  it("should return an Object when initialized with an Object", () => {
    const obj = { key: "value" };
    const ss = newSimpleState(obj);
    const result = ss.get();
    assert.equal(typeof result, "object", "Expected state to be an Object");
    assert.notEqual(result, null, "Expected state to not be null.");
    assert.equal(
      result.key,
      "value",
      "Expected the Object to contain the correct key-value pair"
    );
  });

  it("should return a RegExp when initialized with a RegExp", () => {
    const regex = /hello/;
    const ss = newSimpleState(regex);
    const result = ss.get();
    assert.isTrue(result instanceof RegExp, "Expected state to be a RegExp");
    assert.isTrue(
      result.test("hello world"),
      "Expected the RegExp to match 'hello world'"
    );
  });

  it("should return a Function when initialized with a Function", () => {
    const fn = () => "hello";
    const ss = newSimpleState(fn);
    const result = ss.get();
    assert.equal(typeof result, "function", "Expected state to be a Function");
    assert.equal(result(), "hello", "Expected the function to return 'hello'");
  });

  it("should return a deep copy of nested objects", () => {
    const nested = { outer: { inner: { value: 42 } } };
    const ss = newSimpleState(nested);
    const result = ss.get();

    // Modify the returned object
    result.outer.inner.value = 999;

    // Original state should be unchanged
    assert.equal(
      ss.get().outer.inner.value,
      42,
      "Nested object mutation should not affect internal state"
    );
  });

  it("should return a deep copy of nested arrays", () => {
    const nested = [[1, 2], [3, 4]];
    const ss = newSimpleState(nested);
    const result = ss.get();

    // Modify the returned array
    result[0][0] = 999;

    // Original state should be unchanged
    assert.equal(
      ss.get()[0][0],
      1,
      "Nested array mutation should not affect internal state"
    );
  });

  it("should return a deep copy of RegExp with flags preserved", () => {
    const regex = /hello/gi;
    const ss = newSimpleState(regex);
    const result = ss.get();

    assert.isTrue(result instanceof RegExp, "Expected state to be a RegExp");
    assert.equal(result.source, "hello", "RegExp source should be preserved");
    assert.equal(result.flags, "gi", "RegExp flags should be preserved");
    assert.isTrue(result.test("HELLO"), "RegExp should work with preserved flags");
  });

  it("should return a deep copy of Date that doesn't affect internal state", () => {
    const date = new Date("2024-01-01");
    const ss = newSimpleState(date);
    const result = ss.get();

    // Modify the returned date
    result.setFullYear(2099);

    // Original state should be unchanged
    assert.equal(
      ss.get().getUTCFullYear(),
      2024,
      "Date mutation should not affect internal state"
    );
  });

  it("should handle custom classes by cloning their properties", () => {
    class CustomClass {
      constructor(public value: number, public name: string) {}
    }

    const instance = new CustomClass(42, "test");
    const ss = newSimpleState(instance);
    const result = ss.get();

    // The cloned object should have the same properties
    assert.equal(result.value, 42);
    assert.equal(result.name, "test");

    // Modifying the returned object shouldn't affect internal state
    result.value = 999;
    assert.equal(ss.get().value, 42);
  });

  it("should throw an error when trying to clone a Promise", () => {
    const promise = Promise.resolve(42);
    const ss = newSimpleState(promise);

    // structuredClone cannot clone Promises, so this should throw
    assert.throws(
      () => ss.get(),
      /Unable to clone state/,
      "Promises cannot be cloned with structuredClone"
    );
  });

  it("should throw an error when trying to clone a WeakMap", () => {
    const weakMap = new WeakMap();
    const ss = newSimpleState(weakMap);

    // structuredClone cannot clone WeakMaps, so this should throw
    assert.throws(
      () => ss.get(),
      /Unable to clone state/,
      "WeakMaps cannot be cloned with structuredClone"
    );
  });

  it("should throw an error when trying to clone a WeakSet", () => {
    const weakSet = new WeakSet();
    const ss = newSimpleState(weakSet);

    // structuredClone cannot clone WeakSets, so this should throw
    assert.throws(
      () => ss.get(),
      /Unable to clone state/,
      "WeakSets cannot be cloned with structuredClone"
    );
  });
});

describe("clone option", () => {
  it("should clone by default", () => {
    const obj = { count: 0 };
    const state = newSimpleState(obj);
    const retrieved = state.get();

    // Mutate the retrieved object
    retrieved.count = 999;

    // Internal state should be unchanged
    assert.equal(state.get().count, 0, "Default cloning should protect internal state");
  });

  it("should clone when explicitly enabled", () => {
    const obj = { count: 0 };
    const state = newSimpleState(obj, { clone: true });
    const retrieved = state.get();

    // Mutate the retrieved object
    retrieved.count = 999;

    // Internal state should be unchanged
    assert.equal(state.get().count, 0, "Explicit cloning should protect internal state");
  });

  it("should NOT clone when disabled", () => {
    const obj = { count: 0 };
    const state = newSimpleState(obj, { clone: false });
    const retrieved = state.get();

    // Mutate the retrieved object
    retrieved.count = 999;

    // Internal state WILL be affected (no cloning)
    assert.equal(state.get().count, 999, "Disabling clone should return direct reference");
  });

  it("should NOT clone arrays when disabled", () => {
    const arr = [1, 2, 3];
    const state = newSimpleState(arr, { clone: false });
    const retrieved = state.get();

    // Mutate the retrieved array
    retrieved.push(4);

    // Internal state WILL be affected
    assert.equal(state.get().length, 4, "Disabling clone should return direct reference for arrays");
  });

  it("should still return primitives directly regardless of clone option", () => {
    const state1 = newSimpleState(42, { clone: false });
    const state2 = newSimpleState(42, { clone: true });

    assert.equal(state1.get(), 42);
    assert.equal(state2.get(), 42);
  });

  it("should NOT clone subscriber notifications when disabled", async () => {
    const obj = { count: 0 };
    const state = newSimpleState(obj, { clone: false });
    let receivedValue: { count: number } | null = null;

    state.subscribe((value) => {
      receivedValue = value;
    });

    state.set({ count: 1 });
    await new Promise(resolve => queueMicrotask(resolve));

    // Mutate the received value
    receivedValue!.count = 999;

    // Internal state should be affected (no cloning)
    assert.equal(state.get().count, 999, "Subscribers should receive direct reference when clone is disabled");
  });

  it("should clone subscriber notifications by default", async () => {
    const obj = { count: 0 };
    const state = newSimpleState(obj);
    let receivedValue: { count: number } | null = null;

    state.subscribe((value) => {
      receivedValue = value;
    });

    state.set({ count: 1 });
    await new Promise(resolve => queueMicrotask(resolve));

    // Mutate the received value
    receivedValue!.count = 999;

    // Internal state should be unchanged
    assert.equal(state.get().count, 1, "Subscribers should receive cloned value by default");
  });

  it("should warn when cloning is disabled for mutable types", () => {
    const warnSpy = vi.spyOn(console, "warn");

    newSimpleState({ count: 0 }, { clone: false });

    assert.isTrue(
      warnSpy.mock.calls.some(call =>
        call[0].includes("Cloning is disabled")
      ),
      "Should warn when cloning is disabled for objects"
    );

    warnSpy.mockRestore();
  });

  it("should NOT warn when cloning is disabled for primitives", () => {
    const warnSpy = vi.spyOn(console, "warn");

    newSimpleState(42, { clone: false });

    assert.isFalse(
      warnSpy.mock.calls.some(call =>
        call[0].includes("Cloning is disabled")
      ),
      "Should not warn when cloning is disabled for primitives"
    );

    warnSpy.mockRestore();
  });
});

describe("set", () => {
  it("should store and retrieve a number", () => {
    const initial = 42;
    const update = 100;
    const state = newSimpleState(initial);
    state.set(update);
    assert.equal(state.get(), update);
  });

  it("should store and retrieve a string", () => {
    const initial = "initial";
    const update = "updated";
    const state = newSimpleState(initial);
    state.set(update);
    assert.equal(state.get(), update);
  });

  it("should store and retrieve a boolean", () => {
    const initial = true;
    const update = false;
    const state = newSimpleState(initial);
    state.set(update);
    assert.equal(state.get(), update);
  });

  it("should store and retrieve an object", () => {
    const initial = { key: "value" };
    const update = { key: "updated value" };
    const state = newSimpleState(initial);
    state.set(update);
    assert.deepEqual(state.get(), update);
  });

  it("should store and retrieve an array", () => {
    const initial = [1, 2, 3];
    const update = [4, 5, 6];
    const state = newSimpleState(initial);
    state.set(update);
    assert.deepEqual(state.get(), update);
  });

  it("should store and retrieve null", () => {
    const initial = null;
    const update = null;
    const state = newSimpleState(initial);
    state.set(update);
    assert.equal(state.get(), update);
  });

  it("should store and retrieve undefined", () => {
    const initial = undefined;
    const update = undefined;
    const state = newSimpleState(initial);
    state.set(update);
    assert.equal(state.get(), update);
  });

  it("should store and retrieve a symbol", () => {
    const initial = Symbol("initial");
    const update = Symbol("updated");
    const state = newSimpleState(initial);
    state.set(update);
    assert.equal(state.get(), update);
  });

  it("should store and retrieve a bigint", () => {
    const initial = BigInt(9007199254740991);
    const update = BigInt(1234567890123456);
    const state = newSimpleState(initial);
    state.set(update);
    assert.equal(state.get(), update);
  });

  it("should store and retrieve a function", () => {
    const initial = function () {
      return "initial";
    };
    const update = function () {
      return "updated";
    };
    const state = newSimpleState(initial);
    state.set(update);
    assert.equal(state.get()(), "updated");
  });

  it("should not notify subscribers when setting the same value", async () => {
    const state = newSimpleState(42);
    const callback = vi.fn((value: number) => {});

    state.subscribe(callback);

    // Set the same value twice
    state.set(42);
    state.set(42);

    // Wait for microtask
    await new Promise(resolve => queueMicrotask(resolve));

    // Callback should not be called since value didn't change
    assert.equal(callback.mock.calls.length, 0, "Callback should not be called for same value");

    // Set a different value
    state.set(43);

    // Wait for microtask
    await new Promise(resolve => queueMicrotask(resolve));

    // Now callback should be called once
    assert.equal(callback.mock.calls.length, 1, "Callback should be called once for new value");
    assert.deepStrictEqual(callback.mock.calls[0], [43]);
  });

  it("should notify subscribers for different object references even with same values", async () => {
    const obj1 = { value: 42 };
    const state = newSimpleState(obj1);
    const callback = vi.fn((value: { value: number }) => {});

    state.subscribe(callback);

    // Set the exact same object reference
    state.set(obj1);

    // Wait for microtask
    await new Promise(resolve => queueMicrotask(resolve));

    // Callback should not be called for same reference
    assert.equal(callback.mock.calls.length, 0, "Callback should not be called for same reference");

    // Set a new object with same values but different reference
    const obj2 = { value: 42 };
    state.set(obj2);

    // Wait for microtask
    await new Promise(resolve => queueMicrotask(resolve));

    // Callback should be called because it's a different reference
    assert.equal(callback.mock.calls.length, 1, "Callback should be called for different reference");
    assert.deepStrictEqual(callback.mock.calls[0][0], { value: 42 });
  });

  it("should batch multiple rapid updates into a single notification", async () => {
    const state = newSimpleState(0);
    const callback = vi.fn((value: number) => {});

    state.subscribe(callback);

    // Rapidly update state multiple times
    state.set(1);
    state.set(2);
    state.set(3);

    // Callback should not be called synchronously
    assert.equal(callback.mock.calls.length, 0, "Callback should not be called synchronously");

    // Wait for microtask
    await new Promise(resolve => queueMicrotask(resolve));

    // Callback should be called only once with the latest value
    assert.equal(callback.mock.calls.length, 1, "Callback should be called once after batching");
    assert.deepStrictEqual(callback.mock.calls[0], [3], "Callback should receive latest value");
  });
});

describe("subscribe", () => {
  let state: ReturnType<typeof newSimpleState<number>>;

  beforeEach(() => {
    state = newSimpleState(0);
  });

  it("should return the subscription ID when subscribing", () => {
    const callback = (param: number) => {
      console.log(param);
    };

    const id = state.subscribe(callback);
    assert.equal(typeof id, "number");
  });

  it("should add multiple callbacks and return unique IDs", () => {
    const id1 = state.subscribe((param) => {
      console.log(param);
    });
    const id2 = state.subscribe((param) => {
      console.log(param);
    });
    const id3 = state.subscribe((param) => {
      console.log(param);
    });

    // IDs should be unique
    assert.notEqual(id1, id2);
    assert.notEqual(id2, id3);
    assert.notEqual(id1, id3);
  });
});

describe("unsubscribe", () => {
  let state: ReturnType<typeof newSimpleState<number>>;
  let foo: ReturnType<typeof vi.fn>;
  let bar: ReturnType<typeof vi.fn>;
  let baz: ReturnType<typeof vi.fn>;
  let fooId: number;
  let barId: number;
  let bazId: number;

  beforeEach(() => {
    foo = vi.fn((_foo: number) => {});
    bar = vi.fn((_bar: number) => {});
    baz = vi.fn((_baz: number) => {});

    state = newSimpleState(0);
    fooId = state.subscribe(foo);
    barId = state.subscribe(bar);
    bazId = state.subscribe(baz);
  });

  it("should throw an error if the index is not a number", () => {
    const errorMsg = /Invalid input: Expected a number/;
    assert.throws(
      () => state.unsubscribe("not a number" as any),
      errorMsg,
      "An error was thrown because the argument was a string."
    );
    assert.throws(
      () => state.unsubscribe(null as any),
      errorMsg,
      "An error was thrown because the argument was an object."
    );
  });

  it("should throw an error if the subscription ID is invalid.", () => {
    const errorMsg = /Invalid subscription ID/;
    assert.throws(
      () => state.unsubscribe(-1),
      errorMsg,
      "An error was thrown because the subscription ID doesn't exist."
    );
    assert.throws(
      () => state.unsubscribe(10000),
      errorMsg,
      "An error was thrown because the subscription ID doesn't exist."
    );
  });

  it("should correctly remove a subscriber using subscription ID", async () => {
    state.set(1);
    await new Promise(resolve => queueMicrotask(resolve));

    assert.deepStrictEqual(
      foo.mock.calls[0],
      [1],
      "foo should be called with 1 on initial state change"
    );
    assert.deepStrictEqual(
      bar.mock.calls[0],
      [1],
      "bar should be called with 1 on initial state change"
    );
    assert.deepStrictEqual(
      baz.mock.calls[0],
      [1],
      "baz should be called with 1 on initial state change"
    );

    state.unsubscribe(bazId);
    state.set(2);
    await new Promise(resolve => queueMicrotask(resolve));

    assert.strictEqual(
      foo.mock.calls.length,
      2,
      "foo should be called twice (before and after unsubscribe)"
    );
    assert.deepStrictEqual(
      foo.mock.calls[1],
      [2],
      "foo should be called with 2 after state change to 2"
    );
    assert.strictEqual(
      bar.mock.calls.length,
      2,
      "bar should be called twice (before and after unsubscribe)"
    );
    assert.deepStrictEqual(
      bar.mock.calls[1],
      [2],
      "bar should be called with 2 after state change to 2"
    );
    assert.strictEqual(
      baz.mock.calls.length,
      1,
      "baz should only be called once (before unsubscribe)"
    );

    state.unsubscribe(barId);
    state.set(3);
    await new Promise(resolve => queueMicrotask(resolve));

    assert.strictEqual(
      foo.mock.calls.length,
      3,
      "foo should be called three times (before and after both unsubscriptions)"
    );
    assert.deepStrictEqual(
      foo.mock.calls[2],
      [3],
      "foo should be called with 3 after state change to 3"
    );
    assert.strictEqual(
      bar.mock.calls.length,
      2,
      "bar should still be called only twice after unsubscribing"
    );
    assert.strictEqual(
      baz.mock.calls.length,
      1,
      "baz should still be called only once after unsubscribing"
    );

    state.unsubscribe(fooId);
    state.set(4);
    await new Promise(resolve => queueMicrotask(resolve));

    assert.strictEqual(
      foo.mock.calls.length,
      3,
      "foo should not be called again after unsubscribing all subscribers"
    );
    assert.strictEqual(
      bar.mock.calls.length,
      2,
      "bar should not be called again after unsubscribing all subscribers"
    );
    assert.strictEqual(
      baz.mock.calls.length,
      1,
      "baz should not be called again after unsubscribing all subscribers"
    );
  });
});

import {
  assert,
  assertEquals,
  assertNotEquals,
  assertThrows,
} from "@std/assert";
import { newSimpleState } from "./index.ts";

// Mock function helper for tests
// deno-lint-ignore no-explicit-any
function createMock<T extends (...args: any[]) => any>() {
  const calls: Parameters<T>[] = [];
  // deno-lint-ignore no-explicit-any
  const fn = (...args: any[]) => {
    calls.push(args as Parameters<T>);
  };
  return { fn, calls };
}

Deno.test("get - should return a number when initialized with a number", () => {
  const ss = newSimpleState(0);
  assertEquals(
    typeof ss.get(),
    "number",
    "Expected a return value of type number",
  );
});

Deno.test("get - should return an empty string when initialized with an empty string", () => {
  const ss = newSimpleState("");
  assertEquals(
    ss.get(),
    "",
    "Expected the state to be initialized with an empty string",
  );
});

Deno.test("get - should return false when initialized with false", () => {
  const ss = newSimpleState(false);
  assertEquals(
    ss.get(),
    false,
    "Expected the state to be initialized with false",
  );
});

Deno.test("get - should return an empty object when initialized with an empty object", () => {
  const ss = newSimpleState({});
  assertEquals(
    Object.keys(ss.get()).length,
    0,
    "Expected the state to be initialized with an empty object",
  );
});

Deno.test("get - should return an empty array when initialized with an empty array", () => {
  const ss = newSimpleState([]);
  assertEquals(
    ss.get().length,
    0,
    "Expected the state to be initialized with an empty array",
  );
});

Deno.test("get - should return null when initialized with null", () => {
  const ss = newSimpleState(null);
  assertEquals(
    ss.get(),
    null,
    "Expected the state to be initialized with null",
  );
});

Deno.test("get - should return undefined when initialized with undefined", () => {
  const ss = newSimpleState(undefined);
  assertEquals(
    ss.get(),
    undefined,
    "Expected the state to be initialized with undefined",
  );
});

Deno.test("get - should return a Map when initialized with a Map", () => {
  const map = new Map();
  map.set("key", "value");
  const ss = newSimpleState(map);
  const result = ss.get();
  assert(result instanceof Map, "Expected state to be a Map");
  assertEquals(
    result.get("key"),
    "value",
    "Expected the Map to contain the correct value",
  );
});

Deno.test("get - should return a Set when initialized with a Set", () => {
  const set = new Set([1, 2, 3]);
  const ss = newSimpleState(set);
  const result = ss.get();
  assert(result instanceof Set, "Expected state to be a Set");
  assert(result.has(2), "Expected the Set to contain the number 2");
});

Deno.test("get - should return a Date when initialized with a Date", () => {
  const date = new Date("2024-01-01");
  const ss = newSimpleState(date);
  const result = ss.get();
  assert(result instanceof Date, "Expected state to be a Date");
  assertEquals(
    result.getUTCFullYear(),
    2024,
    "Expected the Date to be January 1, 2024",
  );
});

Deno.test("get - should return an Array when initialized with an Array", () => {
  const array = [1, 2, 3];
  const ss = newSimpleState(array);
  const result = ss.get();
  assert(Array.isArray(result), "Expected state to be an Array");
  assertEquals(result.length, 3, "Expected the Array to have 3 elements");
  assertEquals(result[0], 1, "Expected the first element to be 1");
});

Deno.test("get - should return an Object when initialized with an Object", () => {
  const obj = { key: "value" };
  const ss = newSimpleState(obj);
  const result = ss.get();
  assertEquals(typeof result, "object", "Expected state to be an Object");
  assertNotEquals(result, null, "Expected state to not be null.");
  assertEquals(
    result.key,
    "value",
    "Expected the Object to contain the correct key-value pair",
  );
});

Deno.test("get - should return a RegExp when initialized with a RegExp", () => {
  const regex = /hello/;
  const ss = newSimpleState(regex);
  const result = ss.get();
  assert(result instanceof RegExp, "Expected state to be a RegExp");
  assert(
    result.test("hello world"),
    "Expected the RegExp to match 'hello world'",
  );
});

Deno.test("get - should return a Function when initialized with a Function", () => {
  const fn = () => "hello";
  const ss = newSimpleState(fn);
  const result = ss.get();
  assertEquals(typeof result, "function", "Expected state to be a Function");
  assertEquals(result(), "hello", "Expected the function to return 'hello'");
});

Deno.test("get - should return a deep copy of nested objects", () => {
  const nested = { outer: { inner: { value: 42 } } };
  const ss = newSimpleState(nested);
  const result = ss.get();

  //Modify the returned object
  result.outer.inner.value = 999;

  // Original state should be unchanged
  assertEquals(
    ss.get().outer.inner.value,
    42,
    "Nested object mutation should not affect internal state",
  );
});

Deno.test("get - should return a deep copy of nested arrays", () => {
  const nested = [[1, 2], [3, 4]];
  const ss = newSimpleState(nested);
  const result = ss.get();

  // Modify the returned array
  result[0][0] = 999;

  // Original state should be unchanged
  assertEquals(
    ss.get()[0][0],
    1,
    "Nested array mutation should not affect internal state",
  );
});

Deno.test("get - should return a deep copy of RegExp with flags preserved", () => {
  const regex = /hello/gi;
  const ss = newSimpleState(regex);
  const result = ss.get();

  assert(result instanceof RegExp, "Expected state to be a RegExp");
  assertEquals(result.source, "hello", "RegExp source should be preserved");
  assertEquals(result.flags, "gi", "RegExp flags should be preserved");
  assert(
    result.test("HELLO"),
    "RegExp should work with preserved flags",
  );
});

Deno.test("get - should return a deep copy of Date that doesn't affect internal state", () => {
  const date = new Date("2024-01-01");
  const ss = newSimpleState(date);
  const result = ss.get();

  // Modify the returned date
  result.setFullYear(2099);

  // Original state should be unchanged
  assertEquals(
    ss.get().getUTCFullYear(),
    2024,
    "Date mutation should not affect internal state",
  );
});

Deno.test("get - should handle custom classes by cloning their properties", () => {
  class CustomClass {
    constructor(public value: number, public name: string) {}
  }

  const instance = new CustomClass(42, "test");
  const ss = newSimpleState(instance);
  const result = ss.get();

  // The cloned object should have the same properties
  assertEquals(result.value, 42);
  assertEquals(result.name, "test");

  // Modifying the returned object shouldn't affect internal state
  result.value = 999;
  assertEquals(ss.get().value, 42);
});

Deno.test("get - should throw an error when trying to clone a Promise", () => {
  const promise = Promise.resolve(42);
  const ss = newSimpleState(promise);

  // structuredClone cannot clone Promises, so this should throw
  assertThrows(
    () => ss.get(),
    Error,
    "Unable to clone state",
    "Promises cannot be cloned with structuredClone",
  );
});

Deno.test("get - should throw an error when trying to clone a WeakMap", () => {
  const weakMap = new WeakMap();
  const ss = newSimpleState(weakMap);

  // structuredClone cannot clone WeakMaps, so this should throw
  assertThrows(
    () => ss.get(),
    Error,
    "Unable to clone state",
    "WeakMaps cannot be cloned with structuredClone",
  );
});

Deno.test("get - should throw an error when trying to clone a WeakSet", () => {
  const weakSet = new WeakSet();
  const ss = newSimpleState(weakSet);

  // structuredClone cannot clone WeakSets, so this should throw
  assertThrows(
    () => ss.get(),
    Error,
    "Unable to clone state",
    "WeakSets cannot be cloned with structuredClone",
  );
});

Deno.test("get - should handle circular references in objects", () => {
  interface CircularObj {
    name: string;
    self?: CircularObj;
  }

  const obj: CircularObj = { name: "circular" };
  obj.self = obj; // Create circular reference

  const state = newSimpleState(obj);

  // structuredClone handles circular references correctly
  const result = state.get();
  assertEquals(result.name, "circular");
  assertEquals(result.self?.name, "circular");
  assertEquals(result.self, result, "Circular reference should be preserved");

  // Mutations to the cloned object should not affect internal state
  result.name = "mutated";
  assertEquals(
    state.get().name,
    "circular",
    "Internal state should be unchanged",
  );
});

Deno.test("get - should handle circular references in arrays", () => {
  // deno-lint-ignore no-explicit-any
  const arr: any[] = [1, 2, 3];
  arr.push(arr); // Create circular reference

  const state = newSimpleState(arr);

  // structuredClone handles circular references correctly
  const result = state.get();
  assertEquals(result.length, 4);
  assertEquals(result[0], 1);
  assertEquals(result[3], result, "Circular reference should be preserved");

  // Mutations should not affect internal state
  result[0] = 999;
  assertEquals(state.get()[0], 1, "Internal state should be unchanged");
});

Deno.test("clone option - should clone by default", () => {
  const obj = { count: 0 };
  const state = newSimpleState(obj);
  const retrieved = state.get();

  // Mutate the retrieved object
  retrieved.count = 999;

  // Internal state should be unchanged
  assertEquals(
    state.get().count,
    0,
    "Default cloning should protect internal state",
  );
});

Deno.test("clone option - should clone when explicitly enabled", () => {
  const obj = { count: 0 };
  const state = newSimpleState(obj, { clone: true });
  const retrieved = state.get();

  // Mutate the retrieved object
  retrieved.count = 999;

  // Internal state should be unchanged
  assertEquals(
    state.get().count,
    0,
    "Explicit cloning should protect internal state",
  );
});

Deno.test("clone option - should NOT clone when disabled", () => {
  const obj = { count: 0 };
  const state = newSimpleState(obj, { clone: false });
  const retrieved = state.get();

  // Mutate the retrieved object
  retrieved.count = 999;

  // Internal state WILL be affected (no cloning)
  assertEquals(
    state.get().count,
    999,
    "Disabling clone should return direct reference",
  );
});

Deno.test("clone option - should NOT clone arrays when disabled", () => {
  const arr = [1, 2, 3];
  const state = newSimpleState(arr, { clone: false });
  const retrieved = state.get();

  // Mutate the retrieved array
  retrieved.push(4);

  // Internal state WILL be affected
  assertEquals(
    state.get().length,
    4,
    "Disabling clone should return direct reference for arrays",
  );
});

Deno.test("clone option - should still return primitives directly regardless of clone option", () => {
  const state1 = newSimpleState(42, { clone: false });
  const state2 = newSimpleState(42, { clone: true });

  assertEquals(state1.get(), 42);
  assertEquals(state2.get(), 42);
});

Deno.test("clone option - should NOT clone subscriber notifications when disabled", async () => {
  const obj = { count: 0 };
  const state = newSimpleState(obj, { clone: false });
  let receivedValue: { count: number } | null = null;

  state.subscribe((value: { count: number }) => {
    receivedValue = value;
  });

  state.set({ count: 1 });
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

  // Mutate the received value
  receivedValue!.count = 999;

  // Internal state should be affected (no cloning)
  assertEquals(
    state.get().count,
    999,
    "Subscribers should receive direct reference when clone is disabled",
  );
});

Deno.test("clone option - should clone subscriber notifications by default", async () => {
  const obj = { count: 0 };
  const state = newSimpleState(obj);
  let receivedValue: { count: number } | null = null;

  state.subscribe((value: { count: number }) => {
    receivedValue = value;
  });

  state.set({ count: 1 });
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

  // Mutate the received value
  receivedValue!.count = 999;

  // Internal state should be unchanged
  assertEquals(
    state.get().count,
    1,
    "Subscribers should receive cloned value by default",
  );
});

Deno.test("clone option - should warn when cloning is disabled for mutable types", () => {
  const originalWarn = console.warn;
  // deno-lint-ignore no-explicit-any
  const warnCalls: any[][] = [];
  // deno-lint-ignore no-explicit-any
  console.warn = (...args: any[]) => warnCalls.push(args);

  newSimpleState({ count: 0 }, { clone: false });

  assert(
    warnCalls.some((call) => call[0].includes("Cloning is disabled")),
    "Should warn when cloning is disabled for objects",
  );

  console.warn = originalWarn;
});

Deno.test("clone option - should NOT warn when cloning is disabled for primitives", () => {
  const originalWarn = console.warn;
  // deno-lint-ignore no-explicit-any
  const warnCalls: any[][] = [];
  // deno-lint-ignore no-explicit-any
  console.warn = (...args: any[]) => warnCalls.push(args);

  newSimpleState(42, { clone: false });

  assert(
    !warnCalls.some((call) => call[0].includes("Cloning is disabled")),
    "Should not warn when cloning is disabled for primitives",
  );

  console.warn = originalWarn;
});

Deno.test("set - should store and retrieve a number", () => {
  const initial = 42;
  const update = 100;
  const state = newSimpleState(initial);
  state.set(update);
  assertEquals(state.get(), update);
});

Deno.test("set - should store and retrieve a string", () => {
  const initial = "initial";
  const update = "updated";
  const state = newSimpleState(initial);
  state.set(update);
  assertEquals(state.get(), update);
});

Deno.test("set - should store and retrieve a boolean", () => {
  const initial = true;
  const update = false;
  const state = newSimpleState(initial);
  state.set(update);
  assertEquals(state.get(), update);
});

Deno.test("set - should store and retrieve an object", () => {
  const initial = { key: "value" };
  const update = { key: "updated value" };
  const state = newSimpleState(initial);
  state.set(update);
  assertEquals(state.get(), update);
});

Deno.test("set - should store and retrieve an array", () => {
  const initial = [1, 2, 3];
  const update = [4, 5, 6];
  const state = newSimpleState(initial);
  state.set(update);
  assertEquals(state.get(), update);
});

Deno.test("set - should store and retrieve null", () => {
  const initial = null;
  const update = null;
  const state = newSimpleState(initial);
  state.set(update);
  assertEquals(state.get(), update);
});

Deno.test("set - should store and retrieve undefined", () => {
  const initial = undefined;
  const update = undefined;
  const state = newSimpleState(initial);
  state.set(update);
  assertEquals(state.get(), update);
});

Deno.test("set - should store and retrieve a symbol", () => {
  const initial = Symbol("initial");
  const update = Symbol("updated");
  const state = newSimpleState<symbol>(initial);
  state.set(update);
  assertEquals(state.get(), update);
});

Deno.test("set - should store and retrieve a bigint", () => {
  const initial = BigInt(9007199254740991);
  const update = BigInt(1234567890123456);
  const state = newSimpleState(initial);
  state.set(update);
  assertEquals(state.get(), update);
});

Deno.test("set - should store and retrieve a function", () => {
  const initial = function () {
    return "initial";
  };
  const update = function () {
    return "updated";
  };
  const state = newSimpleState(initial);
  state.set(update);
  assertEquals(state.get()(), "updated");
});

Deno.test("set - should not notify subscribers when setting the same value", async () => {
  const state = newSimpleState(42);
  // deno-lint-ignore no-explicit-any
  const mock = createMock<(value: any) => void>();

  state.subscribe(mock.fn);

  // Set the same value twice
  state.set(42);
  state.set(42);

  // Wait for microtask
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

  // Callback should not be called since value didn't change
  assertEquals(
    mock.calls.length,
    0,
    "Callback should not be called for same value",
  );

  // Set a different value
  state.set(43);

  // Wait for microtask
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

  // Now callback should be called once
  assertEquals(
    mock.calls.length,
    1,
    "Callback should be called once for new value",
  );
  assertEquals(mock.calls[0], [43]);
});

Deno.test("set - should notify subscribers for different object references even with same values", async () => {
  const obj1 = { value: 42 };
  const state = newSimpleState(obj1);
  // deno-lint-ignore no-explicit-any
  const mock = createMock<(value: any) => void>();

  state.subscribe(mock.fn);

  // Set the exact same object reference
  state.set(obj1);

  // Wait for microtask
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

  // Callback should not be called for same reference
  assertEquals(
    mock.calls.length,
    0,
    "Callback should not be called for same reference",
  );

  // Set a new object with same values but different reference
  const obj2 = { value: 42 };
  state.set(obj2);

  // Wait for microtask
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

  // Callback should be called because it's a different reference
  assertEquals(
    mock.calls.length,
    1,
    "Callback should be called for different reference",
  );
  assertEquals(mock.calls[0][0], { value: 42 });
});

Deno.test("set - should batch multiple rapid updates into a single notification", async () => {
  const state = newSimpleState(0);
  // deno-lint-ignore no-explicit-any
  const mock = createMock<(value: any) => void>();

  state.subscribe(mock.fn);

  // Rapidly update state multiple times
  state.set(1);
  state.set(2);
  state.set(3);

  // Callback should not be called synchronously
  assertEquals(
    mock.calls.length,
    0,
    "Callback should not be called synchronously",
  );

  // Wait for microtask
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

  // Callback should be called only once with the latest value
  assertEquals(
    mock.calls.length,
    1,
    "Callback should be called once after batching",
  );
  assertEquals(
    mock.calls[0],
    [3],
    "Callback should receive latest value",
  );
});

Deno.test("subscribe - should return the subscription ID when subscribing", () => {
  const state = newSimpleState(0);
  const callback = (param: number) => {
    console.log(param);
  };

  const id = state.subscribe(callback);
  assertEquals(typeof id, "number");
});

Deno.test("subscribe - should add multiple callbacks and return unique IDs", () => {
  const state = newSimpleState(0);
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
  assertNotEquals(id1, id2);
  assertNotEquals(id2, id3);
  assertNotEquals(id1, id3);
});

Deno.test("unsubscribe - should throw an error if the index is not a number", () => {
  const state = newSimpleState(0);
  // deno-lint-ignore no-explicit-any
  const fooMock = createMock<(value: any) => void>();
  // deno-lint-ignore no-explicit-any
  const barMock = createMock<(value: any) => void>();
  // deno-lint-ignore no-explicit-any
  const bazMock = createMock<(value: any) => void>();

  state.subscribe(fooMock.fn);
  state.subscribe(barMock.fn);
  state.subscribe(bazMock.fn);

  // deno-lint-ignore no-explicit-any
  const error1 = assertThrows(
    () => state.unsubscribe("not a number" as any),
  ) as Error;
  assert(error1.message.includes("Invalid input: Expected a number"), "An error was thrown because the argument was a string.");

  // deno-lint-ignore no-explicit-any
  const error2 = assertThrows(
    () => state.unsubscribe(null as any),
  ) as Error;
  assert(error2.message.includes("Invalid input: Expected a number"), "An error was thrown because the argument was an object.");
});

Deno.test("unsubscribe - should throw an error if the subscription ID is invalid", () => {
  const state = newSimpleState(0);
  // deno-lint-ignore no-explicit-any
  const fooMock = createMock<(value: any) => void>();
  // deno-lint-ignore no-explicit-any
  const barMock = createMock<(value: any) => void>();
  // deno-lint-ignore no-explicit-any
  const bazMock = createMock<(value: any) => void>();

  state.subscribe(fooMock.fn);
  state.subscribe(barMock.fn);
  state.subscribe(bazMock.fn);

  const error1 = assertThrows(
    () => state.unsubscribe(-1),
  ) as Error;
  assert(error1.message.includes("Invalid subscription ID"), "An error was thrown because the subscription ID doesn't exist.");

  const error2 = assertThrows(
    () => state.unsubscribe(10000),
  ) as Error;
  assert(error2.message.includes("Invalid subscription ID"), "An error was thrown because the subscription ID doesn't exist.");
});

Deno.test("unsubscribe - should correctly remove a subscriber using subscription ID", async () => {
  const state = newSimpleState(0);
  // deno-lint-ignore no-explicit-any
  const fooMock = createMock<(value: any) => void>();
  // deno-lint-ignore no-explicit-any
  const barMock = createMock<(value: any) => void>();
  // deno-lint-ignore no-explicit-any
  const bazMock = createMock<(value: any) => void>();

  const fooId = state.subscribe(fooMock.fn);
  const barId = state.subscribe(barMock.fn);
  const bazId = state.subscribe(bazMock.fn);

  state.set(1);
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

  assertEquals(
    fooMock.calls[0],
    [1],
    "foo should be called with 1 on initial state change",
  );
  assertEquals(
    barMock.calls[0],
    [1],
    "bar should be called with 1 on initial state change",
  );
  assertEquals(
    bazMock.calls[0],
    [1],
    "baz should be called with 1 on initial state change",
  );

  state.unsubscribe(bazId);
  state.set(2);
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

  assertEquals(
    fooMock.calls.length,
    2,
    "foo should be called twice (before and after unsubscribe)",
  );
  assertEquals(
    fooMock.calls[1],
    [2],
    "foo should be called with 2 after state change to 2",
  );
  assertEquals(
    barMock.calls.length,
    2,
    "bar should be called twice (before and after unsubscribe)",
  );
  assertEquals(
    barMock.calls[1],
    [2],
    "bar should be called with 2 after state change to 2",
  );
  assertEquals(
    bazMock.calls.length,
    1,
    "baz should only be called once (before unsubscribe)",
  );

  state.unsubscribe(barId);
  state.set(3);
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

  assertEquals(
    fooMock.calls.length,
    3,
    "foo should be called three times (before and after both unsubscriptions)",
  );
  assertEquals(
    fooMock.calls[2],
    [3],
    "foo should be called with 3 after state change to 3",
  );
  assertEquals(
    barMock.calls.length,
    2,
    "bar should still be called only twice after unsubscribing",
  );
  assertEquals(
    bazMock.calls.length,
    1,
    "baz should still be called only once after unsubscribing",
  );

  state.unsubscribe(fooId);
  state.set(4);
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

  assertEquals(
    fooMock.calls.length,
    3,
    "foo should not be called again after unsubscribing all subscribers",
  );
  assertEquals(
    barMock.calls.length,
    2,
    "bar should not be called again after unsubscribing all subscribers",
  );
  assertEquals(
    bazMock.calls.length,
    1,
    "baz should not be called again after unsubscribing all subscribers",
  );
});

Deno.test("equals option - should use reference equality by default", async () => {
  const state = newSimpleState({ count: 0 });
  // deno-lint-ignore no-explicit-any
  const mock = createMock<(value: any) => void>();
  state.subscribe(mock.fn);

  // Different object, same values - should notify
  state.set({ count: 0 });
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  assertEquals(
    mock.calls.length,
    1,
    "Should notify with different reference",
  );

  // Same reference - should not notify
  // Note: we need to store the actual internal reference, not a clone from get()
  const obj = { count: 1 };
  state.set(obj);
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  assertEquals(mock.calls.length, 2, "Should notify first time");

  state.set(obj); // Setting the exact same object reference
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  assertEquals(
    mock.calls.length,
    2,
    "Should not notify with same reference",
  );
});

Deno.test("alwaysNotify option - should always notify when true", async () => {
  const state = newSimpleState(5, { alwaysNotify: true });
  // deno-lint-ignore no-explicit-any
  const mock = createMock<(value: any) => void>();
  state.subscribe(mock.fn);

  // Same value - should still notify
  state.set(5);
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  assertEquals(
    mock.calls.length,
    1,
    "Should notify even with same value",
  );

  state.set(5);
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  assertEquals(
    mock.calls.length,
    2,
    "Should notify again with same value",
  );
});

Deno.test("equalityFn option - should use custom equality function for primitives", async () => {
  const state = newSimpleState(10, {
    equalityFn: (prev, next) => prev === next,
  });
  // deno-lint-ignore no-explicit-any
  const mock = createMock<(value: any) => void>();
  state.subscribe(mock.fn);

  // Same value - should not notify
  state.set(10);
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  assertEquals(
    mock.calls.length,
    0,
    "Should not notify with equal value",
  );

  // Different value - should notify
  state.set(20);
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  assertEquals(
    mock.calls.length,
    1,
    "Should notify with different value",
  );
});

Deno.test("equals option - should use custom equality function for objects (deep equality)", async () => {
  // deno-lint-ignore no-explicit-any
  const deepEqual = (a: any, b: any) =>
    JSON.stringify(a) === JSON.stringify(b);

  const state = newSimpleState({ x: 1, y: 2 }, { equalityFn: deepEqual });
  // deno-lint-ignore no-explicit-any
  const mock = createMock<(value: any) => void>();
  state.subscribe(mock.fn);

  // Different reference, same content - should not notify
  state.set({ x: 1, y: 2 });
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  assertEquals(
    mock.calls.length,
    0,
    "Should not notify with deep-equal object",
  );

  // Different content - should notify
  state.set({ x: 1, y: 3 });
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  assertEquals(
    mock.calls.length,
    1,
    "Should notify with different content",
  );
});

Deno.test("equals option - should work with arrays using custom equality", async () => {
  const arrayEqual = (a: number[], b: number[]) =>
    a.length === b.length && a.every((val, idx) => val === b[idx]);

  const state = newSimpleState([1, 2, 3], { equalityFn: arrayEqual });
  // deno-lint-ignore no-explicit-any
  const mock = createMock<(value: any) => void>();
  state.subscribe(mock.fn);

  // Different reference, same content - should not notify
  state.set([1, 2, 3]);
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  assertEquals(
    mock.calls.length,
    0,
    "Should not notify with equal array",
  );

  // Different content - should notify
  state.set([1, 2, 4]);
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  assertEquals(
    mock.calls.length,
    1,
    "Should notify with different array",
  );
});

Deno.test("equals option - should combine equals with clone option", async () => {
  // deno-lint-ignore no-explicit-any
  const deepEqual = (a: any, b: any) =>
    JSON.stringify(a) === JSON.stringify(b);

  const state = newSimpleState(
    { value: 100 },
    { equalityFn: deepEqual, clone: false },
  );
  // deno-lint-ignore no-explicit-any
  const mock = createMock<(value: any) => void>();
  state.subscribe(mock.fn);

  // Same content, different reference - should not notify
  state.set({ value: 100 });
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  assertEquals(
    mock.calls.length,
    0,
    "Should not notify with deep-equal object",
  );

  // Different content - should notify
  state.set({ value: 200 });
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  assertEquals(
    mock.calls.length,
    1,
    "Should notify with different content",
  );
});

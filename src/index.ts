export interface SimpleState<T> {
  get(): T;
  set(input: T): void;
  subscribe(callback: (value: T) => void): number;
  unsubscribe(id: number): void;
}

export interface SimpleStateOptions<T = unknown> {
  clone?: boolean;
  suppressWarnings?: boolean;
  equalityFn?: (prev: T, next: T) => boolean;
  alwaysNotify?: boolean;
}

export function newSimpleState<T>(
  initial: T,
  options?: SimpleStateOptions<T>,
): SimpleState<T> {
  const mutable = isMutable(initial) ? getMutableDataType(initial) : undefined;
  const shouldClone = options?.clone ?? true;
  const suppressWarnings = options?.suppressWarnings ?? false;
  const equalityFn = options?.equalityFn ??
    function defaultEqualityFn(a: T, b: T): boolean {
      return a === b;
    };
  const alwaysNotify = options?.alwaysNotify ?? false;

  function hasSameType(value: unknown): boolean {
    return typeof value === typeof initial;
  }

  if (typeof initial === "function" && !suppressWarnings) {
    console.warn(
      "Warning: Functions cannot be cloned. Mutations to captured variables (closures) will affect the stored state. Consider storing data instead of functions.",
    );
  }

  if (!shouldClone && mutable && !suppressWarnings) {
    console.warn(
      "Warning: Cloning is disabled. Mutations to the state object will affect the stored state. Ensure you do not mutate state externally.",
    );
  }

  let state = initial;

  function share(): T {
    if (!shouldClone || !mutable) return state;
    if (typeof initial === "function") return state;

    try {
      return structuredClone(state);
    } catch (error) {
      throw new Error(
        `Unable to clone state: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  const subscribers = new Map<number, (value: T) => void>();
  let nextId = 0;
  let dispatchScheduled = false;

  function dispatch() {
    // Subscribers are notified in insertion order (Map iteration order is guaranteed)
    subscribers.forEach(function notifySubscriber(callback) {
      callback(share());
    });
  }

  function scheduleDispatch() {
    if (!dispatchScheduled) {
      dispatchScheduled = true;
      queueMicrotask(function executeDispatch() {
        dispatchScheduled = false;
        dispatch();
      });
    }
  }

  return {
    get: function get() {
      return share();
    },
    set: function set(input: T) {
      if (!hasSameType(input)) {
        throw new Error(
          `Incompatible data type: Expected ${typeof initial}, but received ${typeof input}. Check your input and try again.`,
        );
      }

      if (mutable) {
        const newMutableType = getMutableDataType(input);
        if (newMutableType !== mutable) {
          throw new Error(
            `Incompatible mutable data type: Expected ${
              mutable ?? "undefined"
            }, but received ${
              newMutableType ?? "undefined"
            }. Check your input and try again.`,
          );
        }
      }

      const hasChanged = alwaysNotify ? true : !equalityFn(state, input);

      if (hasChanged) {
        state = input;
        scheduleDispatch();
      }
    },
    subscribe: function subscribe(callback: (value: T) => void) {
      const id = nextId++;
      subscribers.set(id, callback);
      return id;
    },
    unsubscribe: function unsubscribe(id: number) {
      if (typeof id !== "number") {
        throw new Error(
          `Invalid input: Expected a number, but received ${typeof id}`,
        );
      }
      if (!subscribers.has(id)) {
        throw new Error(`Invalid subscription ID: ${id}`);
      }
      subscribers.delete(id);
    },
  };
}

const MutableTypes = {
  OBJECT: "object",
  FUNCTION: "function",
  ARRAY: "array",
  MAP: "map",
  SET: "set",
  DATE: "date",
  REGEX: "regex",
} as const;

type MutableType = typeof MutableTypes[keyof typeof MutableTypes];

function isMutable(input: unknown): boolean {
  if (input === null) return false;
  const type = typeof input;
  return type === "object" || type === "function";
}

function getMutableDataType(input: unknown): MutableType | undefined {
  if (Array.isArray(input)) return MutableTypes.ARRAY;
  if (input instanceof Date) return MutableTypes.DATE;
  if (input instanceof Map) return MutableTypes.MAP;
  if (input instanceof Set) return MutableTypes.SET;
  if (input instanceof RegExp) return MutableTypes.REGEX;
  if (typeof input === "function") return MutableTypes.FUNCTION;
  if (typeof input === "object") return MutableTypes.OBJECT;
  return undefined;
}

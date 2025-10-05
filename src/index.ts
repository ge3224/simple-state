export interface SimpleState<T> {
  get(): T;
  set(input: T): void;
  subscribe(callback: (value: T) => void): number;
  unsubscribe(id: number): void;
}

export interface SimpleStateOptions {
  /**
   * Whether to deep clone mutable state when getting or notifying subscribers.
   *
   * Default: true (recommended for safety)
   *
   * Set to false for performance-critical scenarios where you can guarantee
   * that state won't be mutated externally.
   */
  clone?: boolean;

  /**
   * Suppress console warnings.
   *
   * Default: false
   *
   * Set to true to disable warnings (useful for benchmarks/tests).
   */
  suppressWarnings?: boolean;
}

export function newSimpleState<T>(initial: T, options?: SimpleStateOptions): SimpleState<T> {
  const _type = typeof initial;
  const _mutableType = isMutable(initial) ? getMutableDataType(initial) : undefined;
  const _shouldClone = options?.clone ?? true;
  const _suppressWarnings = options?.suppressWarnings ?? false;

  if (_type === "function" && !_suppressWarnings) {
    console.warn(
      'Warning: Functions cannot be cloned. Mutations to captured variables (closures) will affect the stored state. Consider storing data instead of functions.'
    );
  }

  if (!_shouldClone && isMutable(initial) && !_suppressWarnings) {
    console.warn(
      'Warning: Cloning is disabled. Mutations to the state object will affect the stored state. Ensure you do not mutate state externally.'
    );
  }

  let _state = initial;

  function share(): T {
    if (!_shouldClone || !isMutable(_state)) return _state;
    if (_type === "function") return _state;

    try {
      return structuredClone(_state);
    } catch (error) {
      throw new Error(
        `Unable to clone state: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  const _subscribers = new Map<number, (value: T) => void>();
  let _nextId = 0;
  let _dispatchScheduled = false;

  function dispatch() {
    // Subscribers are notified in insertion order (Map iteration order is guaranteed)
    _subscribers.forEach(function notifySubscriber(callback) {
      callback(share());
    });
  }

  function scheduleDispatch() {
    if (!_dispatchScheduled) {
      _dispatchScheduled = true;
      queueMicrotask(function executeDispatch() {
        _dispatchScheduled = false;
        dispatch();
      });
    }
  }

  return {
    get: function get() {
      return share();
    },
    set: function set(input: T) {
      if (typeof input !== _type) {
        throw new Error(
          `Incompatible data type: Expected ${_type}, but received ${typeof input}. Check your input and try again.`
        );
      }

      if (isMutable(input)) {
        const newMutableType = getMutableDataType(input);
        if (newMutableType !== _mutableType) {
          throw new Error(
            `Incompatible mutable data type: Expected ${_mutableType ?? 'undefined'}, but received ${newMutableType ?? 'undefined'}. Check your input and try again.`
          );
        }
      }

      if (_state !== input) {
        _state = input;
        scheduleDispatch();
      }
    },
    subscribe: function subscribe(callback: (value: T) => void) {
      const id = _nextId++;
      _subscribers.set(id, callback);
      return id;
    },
    unsubscribe: function unsubscribe(id: number) {
      if (typeof id !== "number") {
        throw new Error(
          `Invalid input: Expected a number, but received ${typeof id}`
        );
      }
      if (!_subscribers.has(id)) {
        throw new Error(`Invalid subscription ID: ${id}`);
      }
      _subscribers.delete(id);
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
  if (typeof input === "function") return MutableTypes.FUNCTION;
  if (Array.isArray(input)) return MutableTypes.ARRAY;
  if (input instanceof Map) return MutableTypes.MAP;
  if (input instanceof Set) return MutableTypes.SET;
  if (input instanceof Date) return MutableTypes.DATE;
  if (input instanceof RegExp) return MutableTypes.REGEX;
  if (typeof input === "object") return MutableTypes.OBJECT;
  return undefined;
}

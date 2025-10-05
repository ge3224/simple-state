import { newSimpleState, type SimpleState } from "../../src/index";

/**
 * Persistence Patterns
 *
 * Synchronizing state with localStorage, sessionStorage, and other storage backends
 */

// =============================================================================
// Pattern 1: Basic localStorage Persistence
// =============================================================================

console.log("=== Pattern 1: Basic localStorage ===");

function createPersistedState<T>(key: string, initial: T): SimpleState<T> {
  // Try to load from localStorage
  const stored = localStorage.getItem(key);
  const initialValue = stored ? JSON.parse(stored) : initial;

  const state = newSimpleState<T>(initialValue);

  // Sync to localStorage on every change
  state.subscribe((value) => {
    localStorage.setItem(key, JSON.stringify(value));
  });

  return state;
}

// Usage
const theme = createPersistedState("app-theme", "dark");
console.log("Initial theme:", theme.get());

theme.set("light");
console.log("Theme changed to:", theme.get());

// Reload page - theme will persist!

// =============================================================================
// Pattern 2: sessionStorage (per-tab state)
// =============================================================================

console.log("\n=== Pattern 2: sessionStorage ===");

function createSessionState<T>(key: string, initial: T): SimpleState<T> {
  const stored = sessionStorage.getItem(key);
  const initialValue = stored ? JSON.parse(stored) : initial;

  const state = newSimpleState<T>(initialValue);

  state.subscribe((value) => {
    sessionStorage.setItem(key, JSON.stringify(value));
  });

  return state;
}

// Usage - state only persists within the same tab
const tabState = createSessionState("tab-id", crypto.randomUUID());
console.log("Tab ID:", tabState.get());

// =============================================================================
// Pattern 3: Selective Persistence (only persist certain fields)
// =============================================================================

console.log("\n=== Pattern 3: Selective Persistence ===");

function createSelectivePersistedState<T extends Record<string, any>>(
  key: string,
  initial: T,
  persistKeys: (keyof T)[]
): SimpleState<T> {
  const stored = localStorage.getItem(key);
  let initialValue = initial;

  if (stored) {
    const parsed = JSON.parse(stored);
    // Only restore persisted keys
    initialValue = { ...initial, ...parsed };
  }

  const state = newSimpleState<T>(initialValue);

  state.subscribe((value) => {
    // Only save selected keys
    const toSave: Partial<T> = {};
    persistKeys.forEach((key) => {
      toSave[key] = value[key];
    });
    localStorage.setItem(key, JSON.stringify(toSave));
  });

  return state;
}

// Usage - only persist theme and fontSize, not temporary UI state
const appSettings = createSelectivePersistedState(
  "app-settings",
  { theme: "dark", fontSize: 14, sidebarOpen: false },
  ["theme", "fontSize"] // Don't persist sidebarOpen
);

console.log("Settings:", appSettings.get());
appSettings.set({ theme: "light", fontSize: 16, sidebarOpen: true });
console.log("After update:", appSettings.get());

// =============================================================================
// Pattern 4: Versioned Persistence (handle schema migrations)
// =============================================================================

console.log("\n=== Pattern 4: Versioned Persistence ===");

interface VersionedData<T> {
  version: number;
  data: T;
}

function createVersionedState<T>(
  key: string,
  initial: T,
  currentVersion: number,
  migrate?: (data: any, fromVersion: number) => T
): SimpleState<T> {
  const stored = localStorage.getItem(key);
  let initialValue = initial;

  if (stored) {
    const parsed: VersionedData<any> = JSON.parse(stored);

    if (parsed.version === currentVersion) {
      initialValue = parsed.data;
    } else if (migrate) {
      // Migration needed
      console.log(`Migrating from v${parsed.version} to v${currentVersion}`);
      initialValue = migrate(parsed.data, parsed.version);
    }
  }

  const state = newSimpleState<T>(initialValue);

  state.subscribe((value) => {
    const toSave: VersionedData<T> = {
      version: currentVersion,
      data: value
    };
    localStorage.setItem(key, JSON.stringify(toSave));
  });

  return state;
}

// Usage with migration
interface UserV1 {
  name: string;
}

interface UserV2 {
  firstName: string;
  lastName: string;
}

const user = createVersionedState<UserV2>(
  "user",
  { firstName: "", lastName: "" },
  2,
  (data, fromVersion) => {
    if (fromVersion === 1) {
      // Migrate from v1 to v2
      const parts = (data as UserV1).name.split(" ");
      return {
        firstName: parts[0] || "",
        lastName: parts[1] || ""
      };
    }
    return data;
  }
);

console.log("User:", user.get());

// =============================================================================
// Pattern 5: Debounced Persistence (reduce write frequency)
// =============================================================================

console.log("\n=== Pattern 5: Debounced Persistence ===");

function createDebouncedPersistedState<T>(
  key: string,
  initial: T,
  debounceMs = 1000
): SimpleState<T> {
  const stored = localStorage.getItem(key);
  const initialValue = stored ? JSON.parse(stored) : initial;

  const state = newSimpleState<T>(initialValue);

  let timeoutId: number | undefined;

  state.subscribe((value) => {
    // Cancel previous save
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    // Schedule new save
    timeoutId = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(value));
      console.log("Saved to localStorage");
    }, debounceMs) as unknown as number;
  });

  return state;
}

// Usage - only saves after user stops typing for 1 second
const draftPost = createDebouncedPersistedState("draft", { title: "", content: "" }, 1000);
draftPost.set({ title: "Hello", content: "" });
draftPost.set({ title: "Hello World", content: "" });
// Only saves once, 1 second after last update

// =============================================================================
// Pattern 6: Cross-Tab Synchronization
// =============================================================================

console.log("\n=== Pattern 6: Cross-Tab Sync ===");

function createSyncedState<T>(key: string, initial: T): SimpleState<T> {
  const stored = localStorage.getItem(key);
  const initialValue = stored ? JSON.parse(stored) : initial;

  const state = newSimpleState<T>(initialValue);

  // Save to localStorage
  state.subscribe((value) => {
    localStorage.setItem(key, JSON.stringify(value));
  });

  // Listen for changes from other tabs
  window.addEventListener("storage", (event) => {
    if (event.key === key && event.newValue) {
      const newValue = JSON.parse(event.newValue);
      state.set(newValue);
      console.log("State synced from another tab");
    }
  });

  return state;
}

// Usage - changes in one tab automatically sync to other tabs
const syncedCounter = createSyncedState("synced-counter", 0);
console.log("Synced counter:", syncedCounter.get());

// =============================================================================
// Pattern 7: IndexedDB for Large Data
// =============================================================================

console.log("\n=== Pattern 7: IndexedDB ===");

async function createIndexedDBState<T>(
  dbName: string,
  storeName: string,
  key: string,
  initial: T
): Promise<SimpleState<T>> {
  // Open IndexedDB
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
  });

  // Try to load existing value
  const stored = await new Promise<T | null>((resolve) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => resolve(null);
  });

  const state = newSimpleState<T>(stored ?? initial);

  // Save to IndexedDB on changes
  state.subscribe((value) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.put(value, key);
  });

  return state;
}

// Usage - for large data like images, files, etc.
// const largeData = await createIndexedDBState("myapp", "states", "large-dataset", []);

// =============================================================================
// Pattern 8: Encryption (sensitive data)
// =============================================================================

console.log("\n=== Pattern 8: Encrypted Persistence ===");

function createEncryptedState<T>(
  key: string,
  initial: T,
  encryptionKey: string
): SimpleState<T> {
  // Simple XOR encryption (use proper crypto in production!)
  const encrypt = (data: string): string => {
    return btoa(
      data
        .split("")
        .map((char, i) =>
          String.fromCharCode(char.charCodeAt(0) ^ encryptionKey.charCodeAt(i % encryptionKey.length))
        )
        .join("")
    );
  };

  const decrypt = (encrypted: string): string => {
    return atob(encrypted)
      .split("")
      .map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ encryptionKey.charCodeAt(i % encryptionKey.length))
      )
      .join("");
  };

  const stored = localStorage.getItem(key);
  let initialValue = initial;

  if (stored) {
    try {
      initialValue = JSON.parse(decrypt(stored));
    } catch (e) {
      console.error("Failed to decrypt stored data");
    }
  }

  const state = newSimpleState<T>(initialValue);

  state.subscribe((value) => {
    const encrypted = encrypt(JSON.stringify(value));
    localStorage.setItem(key, encrypted);
  });

  return state;
}

// Usage - for sensitive data (use Web Crypto API in production!)
const sensitiveData = createEncryptedState("sensitive", { token: "" }, "my-secret-key");
console.log("Encrypted data:", sensitiveData.get());

// =============================================================================
// Summary
// =============================================================================

console.log("\n=== Persistence Patterns Summary ===");
console.log(`
Available Patterns:

1. Basic localStorage - Simple key/value persistence
2. sessionStorage - Per-tab state (doesn't persist across tabs)
3. Selective Persistence - Only save certain fields
4. Versioned State - Handle schema migrations
5. Debounced Persistence - Reduce write frequency
6. Cross-Tab Sync - Sync state across browser tabs
7. IndexedDB - For large datasets
8. Encrypted State - For sensitive data

Best Practices:
- Use localStorage for user preferences
- Use sessionStorage for temporary UI state
- Use IndexedDB for large data (>5MB)
- Always handle JSON parse errors
- Consider debouncing for frequently updated state
- Use versioning for long-term data storage
- Never store sensitive data without encryption
`);

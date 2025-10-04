import { newSimpleState, type SimpleState } from "../../src/index";

/**
 * Maps pattern - managing collections of related state
 *
 * This example shows how to manage multiple items where each might
 * update independently, similar to Nanostores' map pattern.
 */

// Example 1: Basic state map
console.log("=== Example 1: Basic State Map ===");

interface StateMap<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  delete(key: string): void;
  has(key: string): boolean;
  keys(): string[];
  subscribe(callback: (map: Map<string, T>) => void): number;
}

function createStateMap<T>(initial?: Map<string, T>): StateMap<T> {
  const state = newSimpleState(new Map(initial));

  return {
    get(key: string) {
      return state.get().get(key);
    },
    set(key: string, value: T) {
      const newMap = new Map(state.get());
      newMap.set(key, value);
      state.set(newMap);
    },
    delete(key: string) {
      const newMap = new Map(state.get());
      newMap.delete(key);
      state.set(newMap);
    },
    has(key: string) {
      return state.get().has(key);
    },
    keys() {
      return Array.from(state.get().keys());
    },
    subscribe(callback: (map: Map<string, T>) => void) {
      return state.subscribe(callback);
    }
  };
}

interface User {
  id: string;
  name: string;
  online: boolean;
}

const users = createStateMap<User>();

users.subscribe((userMap) => {
  console.log("\nUsers updated:");
  userMap.forEach((user) => {
    console.log(`  ${user.name} (${user.online ? "online" : "offline"})`);
  });
});

users.set("1", { id: "1", name: "Alice", online: true });
users.set("2", { id: "2", name: "Bob", online: false });
users.set("3", { id: "3", name: "Charlie", online: true });

console.log("\nUpdating Bob's status:");
users.set("2", { id: "2", name: "Bob", online: true });

console.log("\nRemoving Charlie:");
users.delete("3");

// Example 2: Collection with item-level subscriptions
console.log("\n=== Example 2: Collection with Per-Item Updates ===");

interface CollectionItem<T> {
  value: T;
  subscribers: Set<(value: T) => void>;
}

interface Collection<T> {
  get(id: string): T | undefined;
  set(id: string, value: T): void;
  delete(id: string): void;
  getAll(): Map<string, T>;
  subscribeToItem(id: string, callback: (value: T) => void): () => void;
  subscribeToAll(callback: (items: Map<string, T>) => void): number;
}

function createCollection<T>(initial?: Map<string, T>): Collection<T> {
  const items = new Map<string, CollectionItem<T>>();
  const state = newSimpleState(new Map(initial));

  // Initialize items from initial values
  if (initial) {
    initial.forEach((value, id) => {
      items.set(id, { value, subscribers: new Set() });
    });
  }

  return {
    get(id: string) {
      return items.get(id)?.value;
    },

    set(id: string, value: T) {
      const item = items.get(id);
      if (item) {
        item.value = value;
        item.subscribers.forEach(callback => callback(value));
      } else {
        items.set(id, { value, subscribers: new Set() });
      }

      const newMap = new Map<string, T>();
      items.forEach((item, key) => newMap.set(key, item.value));
      state.set(newMap);
    },

    delete(id: string) {
      items.delete(id);
      const newMap = new Map<string, T>();
      items.forEach((item, key) => newMap.set(key, item.value));
      state.set(newMap);
    },

    getAll() {
      return state.get();
    },

    subscribeToItem(id: string, callback: (value: T) => void) {
      const item = items.get(id);
      if (item) {
        item.subscribers.add(callback);
      }
      return () => {
        const item = items.get(id);
        if (item) {
          item.subscribers.delete(callback);
        }
      };
    },

    subscribeToAll(callback: (items: Map<string, T>) => void) {
      return state.subscribe(callback);
    }
  };
}

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const todos = createCollection<Todo>();

// Subscribe to all changes
todos.subscribeToAll((allTodos) => {
  console.log(`\nTotal todos: ${allTodos.size}`);
});

// Subscribe to specific todo
todos.subscribeToItem("1", (todo) => {
  console.log(`Todo #1 updated: "${todo.text}" - ${todo.completed ? "✓" : "○"}`);
});

console.log("Adding todos:");
todos.set("1", { id: "1", text: "Learn Simple State", completed: false });
todos.set("2", { id: "2", text: "Build an app", completed: false });

console.log("\nUpdating todo #1:");
todos.set("1", { id: "1", text: "Learn Simple State", completed: true });

console.log("\nUpdating todo #2 (no specific subscriber):");
todos.set("2", { id: "2", text: "Build an app", completed: true });

// Example 3: Normalized data store
console.log("\n=== Example 3: Normalized Data Store ===");

interface Post {
  id: string;
  title: string;
  authorId: string;
  content: string;
}

interface Author {
  id: string;
  name: string;
  email: string;
}

interface Store {
  posts: StateMap<Post>;
  authors: StateMap<Author>;
}

const store: Store = {
  posts: createStateMap(),
  authors: createStateMap()
};

// Subscribe to posts
store.posts.subscribe((posts) => {
  console.log("\nPosts:");
  posts.forEach((post) => {
    const author = store.authors.get(post.authorId);
    console.log(`  "${post.title}" by ${author?.name || "Unknown"}`);
  });
});

// Add authors
store.authors.set("a1", {
  id: "a1",
  name: "Alice Johnson",
  email: "alice@example.com"
});

store.authors.set("a2", {
  id: "a2",
  name: "Bob Smith",
  email: "bob@example.com"
});

// Add posts
store.posts.set("p1", {
  id: "p1",
  title: "Introduction to Simple State",
  authorId: "a1",
  content: "..."
});

store.posts.set("p2", {
  id: "p2",
  title: "Advanced Patterns",
  authorId: "a2",
  content: "..."
});

store.posts.set("p3", {
  id: "p3",
  title: "Performance Tips",
  authorId: "a1",
  content: "..."
});

console.log("\nAll post keys:", store.posts.keys());
console.log("Has post p1:", store.posts.has("p1"));
console.log("Get post p1:", store.posts.get("p1")?.title);

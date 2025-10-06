import { newSimpleState, type SimpleState } from "../../src/index";

/**
 * Optimistic Updates Patterns
 *
 * Implementing instant UI feedback with rollback capabilities for async operations
 */

// =============================================================================
// Pattern 1: Basic Optimistic Update with Rollback
// =============================================================================

console.log("=== Pattern 1: Basic Optimistic Update ===");

function createOptimistic<T>(initial: T) {
  const state = newSimpleState(initial);
  let snapshot: T | null = null;

  return {
    state,
    optimistic(newValue: T) {
      snapshot = state.get();
      state.set(newValue);
    },
    commit() {
      snapshot = null;
    },
    rollback() {
      if (snapshot !== null) {
        state.set(snapshot);
        snapshot = null;
      }
    }
  };
}

// Usage - Like button
const likes = createOptimistic(42);

likes.state.subscribe(count => {
  console.log(`Likes: ${count}`);
});

// User clicks like
likes.optimistic(43);

// Simulate server error
setTimeout(() => {
  console.log("Server error - rolling back...");
  likes.rollback();
}, 1000);

// =============================================================================
// Pattern 2: Multiple Optimistic Updates
// =============================================================================

console.log("\n=== Pattern 2: Multiple Optimistic Updates ===");

function createOptimisticStack<T>(initial: T) {
  const state = newSimpleState(initial);
  const snapshots: T[] = [];

  return {
    state,
    optimistic(newValue: T) {
      snapshots.push(state.get());
      state.set(newValue);
    },
    commit() {
      snapshots.length = 0;
    },
    rollback() {
      while (snapshots.length > 0) {
        state.set(snapshots.pop()!);
      }
    },
    hasOptimistic: () => snapshots.length > 0
  };
}

// Usage - Multiple rapid interactions
const followers = createOptimisticStack(100);

followers.state.subscribe(count => {
  console.log(`Followers: ${count}`);
});

// User follows 3 accounts rapidly
followers.optimistic(101);
followers.optimistic(102);
followers.optimistic(103);

console.log("Has optimistic updates?", followers.hasOptimistic());

// All succeed
setTimeout(() => {
  console.log("All updates confirmed");
  followers.commit();
}, 500);

// =============================================================================
// Pattern 3: Async Operation with Loading State
// =============================================================================

console.log("\n=== Pattern 3: Async with Loading ===");

type AsyncState<T> =
  | { status: "idle"; data: T }
  | { status: "loading"; data: T; optimistic: T }
  | { status: "success"; data: T }
  | { status: "error"; data: T; error: string };

function createAsyncOptimistic<T>(initial: T) {
  const state = newSimpleState<AsyncState<T>>({
    status: "idle",
    data: initial
  });

  return {
    state,
    async update(
      optimisticValue: T,
      operation: (value: T) => Promise<T>
    ): Promise<void> {
      const current = state.get().data;

      // Set optimistic state
      state.set({
        status: "loading",
        data: current,
        optimistic: optimisticValue
      });

      try {
        const result = await operation(optimisticValue);
        state.set({
          status: "success",
          data: result
        });
      } catch (error) {
        state.set({
          status: "error",
          data: current,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  };
}

// Usage - Form submission
const formData = createAsyncOptimistic({ name: "Alice", email: "alice@example.com" });

formData.state.subscribe(state => {
  if (state.status === "loading") {
    console.log(`Saving: ${JSON.stringify(state.optimistic)} (showing optimistic value)`);
  } else if (state.status === "success") {
    console.log(`Saved: ${JSON.stringify(state.data)}`);
  } else if (state.status === "error") {
    console.log(`Error: ${state.error}, reverted to: ${JSON.stringify(state.data)}`);
  } else {
    console.log(`Current: ${JSON.stringify(state.data)}`);
  }
});

// Simulate form submission
formData.update(
  { name: "Bob", email: "bob@example.com" },
  async (value) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Simulate random success/failure
    if (Math.random() > 0.5) {
      return value;
    } else {
      throw new Error("Network timeout");
    }
  }
);

// =============================================================================
// Pattern 4: Optimistic List Updates (Social Feed)
// =============================================================================

console.log("\n=== Pattern 4: Optimistic List Updates ===");

interface Post {
  id: string;
  text: string;
  liked: boolean;
  likes: number;
  optimistic?: boolean;
}

function createOptimisticList<T extends { id: string }>(initial: T[]) {
  const state = newSimpleState(initial);
  const optimisticIds = new Set<string>();

  return {
    state,
    add(item: T & { optimistic?: boolean }) {
      optimisticIds.add(item.id);
      state.set([...state.get(), { ...item, optimistic: true }]);
    },
    update(id: string, updates: Partial<T>) {
      optimisticIds.add(id);
      state.set(
        state.get().map(item =>
          item.id === id
            ? { ...item, ...updates, optimistic: true } as T
            : item
        )
      );
    },
    commit(id: string) {
      optimisticIds.delete(id);
      state.set(
        state.get().map(item => {
          if (item.id === id) {
            const { optimistic, ...rest } = item as T & { optimistic?: boolean };
            return rest as T;
          }
          return item;
        })
      );
    },
    rollback(id: string, fallback: T) {
      optimisticIds.delete(id);
      state.set(
        state.get().map(item => (item.id === id ? fallback : item))
      );
    },
    remove(id: string) {
      optimisticIds.delete(id);
      state.set(state.get().filter(item => item.id !== id));
    }
  };
}

// Usage - Social feed
const posts = createOptimisticList<Post>([
  { id: "1", text: "Hello World", liked: false, likes: 10 }
]);

posts.state.subscribe(list => {
  console.log(
    "Posts:",
    list.map(p => `${p.text} (${p.likes} likes)${p.optimistic ? " [optimistic]" : ""}`)
  );
});

// User likes a post
const originalPost = posts.state.get().find(p => p.id === "1")!;
posts.update("1", { liked: true, likes: originalPost.likes + 1 });

// Simulate server confirmation
setTimeout(() => {
  console.log("Like confirmed by server");
  posts.commit("1");
}, 800);

// =============================================================================
// Pattern 5: Debounced Optimistic Updates
// =============================================================================

console.log("\n=== Pattern 5: Debounced Optimistic ===");

function createDebouncedOptimistic<T>(
  initial: T,
  saveOperation: (value: T) => Promise<T>,
  debounceMs = 500
) {
  const state = newSimpleState(initial);
  let timeoutId: number | undefined;
  let snapshot: T | null = null;

  return {
    state,
    update(newValue: T) {
      if (snapshot === null) {
        snapshot = state.get();
      }

      state.set(newValue);

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        try {
          const saved = await saveOperation(newValue);
          state.set(saved);
          snapshot = null;
        } catch (error) {
          console.error("Save failed, rolling back:", error);
          if (snapshot !== null) {
            state.set(snapshot);
            snapshot = null;
          }
        }
      }, debounceMs) as unknown as number;
    }
  };
}

// Usage - Auto-saving document
const document = createDebouncedOptimistic(
  { title: "Untitled", content: "" },
  async (doc) => {
    console.log("Saving to server...");
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log("Saved!");
    return doc;
  },
  300
);

document.state.subscribe(doc => {
  console.log(`Document: "${doc.title}" - ${doc.content.length} chars`);
});

// User types rapidly
document.update({ title: "My Doc", content: "H" });
setTimeout(() => document.update({ title: "My Doc", content: "He" }), 50);
setTimeout(() => document.update({ title: "My Doc", content: "Hel" }), 100);
setTimeout(() => document.update({ title: "My Doc", content: "Hell" }), 150);
setTimeout(() => document.update({ title: "My Doc", content: "Hello" }), 200);
// Only saves once after 300ms of inactivity

// =============================================================================
// Pattern 6: Queue with Retry
// =============================================================================

console.log("\n=== Pattern 6: Optimistic Queue with Retry ===");

interface QueuedUpdate<T> {
  id: string;
  operation: () => Promise<T>;
  retries: number;
  maxRetries: number;
}

function createOptimisticQueue<T>(initial: T) {
  const state = newSimpleState(initial);
  const queue: QueuedUpdate<T>[] = [];
  let processing = false;

  async function processQueue() {
    if (processing || queue.length === 0) return;
    processing = true;

    while (queue.length > 0) {
      const update = queue[0];

      try {
        const result = await update.operation();
        state.set(result);
        queue.shift(); // Remove successful update
      } catch (error) {
        update.retries++;
        if (update.retries >= update.maxRetries) {
          console.error(`Update ${update.id} failed after ${update.maxRetries} retries`);
          queue.shift(); // Remove failed update
        } else {
          console.log(`Update ${update.id} failed, retry ${update.retries}/${update.maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * update.retries));
        }
      }
    }

    processing = false;
  }

  return {
    state,
    enqueue(
      id: string,
      optimisticValue: T,
      operation: () => Promise<T>,
      maxRetries = 3
    ) {
      state.set(optimisticValue);
      queue.push({ id, operation, retries: 0, maxRetries });
      processQueue();
    },
    getPendingCount: () => queue.length
  };
}

// Usage - Offline-capable todo app
const todos = createOptimisticQueue<string[]>([]);

todos.state.subscribe(list => {
  console.log(`Todos (${todos.getPendingCount()} pending):`, list);
});

// Add todo optimistically
todos.enqueue(
  "add-1",
  ["Buy milk"],
  async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (Math.random() > 0.3) throw new Error("Network error");
    return ["Buy milk"];
  }
);

// =============================================================================
// Summary
// =============================================================================

console.log("\n=== Optimistic Updates Summary ===");
console.log(`
Available Patterns:

1. Basic Optimistic Update - Simple optimistic value with commit/rollback
2. Multiple Optimistic Updates - Stack-based rollback for rapid changes
3. Async with Loading State - Track loading/success/error with optimistic preview
4. Optimistic List Updates - Social feed-style optimistic item updates
5. Debounced Optimistic - Auto-save with debouncing and rollback
6. Optimistic Queue with Retry - Offline-capable with retry logic

Use Cases:
- Social interactions (likes, follows, comments)
- Form submissions with instant feedback
- Auto-saving documents/settings
- Shopping cart updates
- Real-time collaboration
- Offline-first applications

Best Practices:
- Always keep a snapshot before optimistic update
- Handle errors gracefully with rollback
- Show loading indicators during async operations
- Use debouncing for rapid updates (typing, dragging)
- Implement retry logic for critical operations
- Mark optimistic items visually (e.g., opacity, icon)
- Batch related updates together
`);

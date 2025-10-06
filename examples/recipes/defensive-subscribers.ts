import { newSimpleState, type SimpleState } from "../../src/index";

/**
 * Defensive subscribers pattern - avoiding the "zombie child" problem
 *
 * The "zombie child" problem occurs when:
 * 1. A subscriber depends on nested/optional data
 * 2. That data gets deleted from state
 * 3. The subscriber tries to access it and crashes
 *
 * This example shows defensive patterns to handle missing or deleted data.
 */

// Example 1: The problem - non-defensive subscriber
console.log("=== Example 1: The Problem ===");

interface User {
  id: number;
  profile?: {
    name: string;
    email: string;
  };
}

const user = newSimpleState<User>({
  id: 1,
  profile: {
    name: "Alice",
    email: "alice@example.com"
  }
});

// BAD: This subscriber assumes profile always exists
const badSubscriberId = user.subscribe((data) => {
  // This will crash when profile becomes undefined!
  console.log("Welcome,", data.profile.name);
});

console.log("Setting user with profile...");
user.set({ id: 1, profile: { name: "Bob", email: "bob@example.com" } });

console.log("Deleting profile...");
try {
  user.set({ id: 1, profile: undefined });
} catch (error) {
  console.log("Subscriber crashed:", error instanceof Error ? error.message : String(error));
}

user.unsubscribe(badSubscriberId);

// Example 2: Defensive with optional chaining
console.log("\n=== Example 2: Optional Chaining ===");

const user2 = newSimpleState<User>({
  id: 2,
  profile: { name: "Charlie", email: "charlie@example.com" }
});

user2.subscribe((data) => {
  // GOOD: Safe access with optional chaining
  const name = data.profile?.name ?? "Guest";
  console.log("Welcome,", name);
});

user2.set({ id: 2, profile: { name: "David", email: "david@example.com" } });
user2.set({ id: 2, profile: undefined }); // Gracefully handles missing data

// Example 3: Early return pattern
console.log("\n=== Example 3: Early Return ===");

interface AppState {
  currentUserId: number | null;
  users: Map<number, { name: string; role: string }>;
}

const appState = newSimpleState<AppState>({
  currentUserId: 1,
  users: new Map([
    [1, { name: "Alice", role: "admin" }],
    [2, { name: "Bob", role: "user" }]
  ])
});

appState.subscribe((state) => {
  // GOOD: Early return if data is missing
  if (!state.currentUserId) {
    console.log("No user logged in");
    return;
  }

  const currentUser = state.users.get(state.currentUserId);
  if (!currentUser) {
    console.log("User not found");
    return;
  }

  console.log(`Current user: ${currentUser.name} (${currentUser.role})`);
});

// Simulate logout
appState.set({
  currentUserId: null,
  users: appState.get().users
});

// Simulate user deletion while still "logged in"
appState.set({
  currentUserId: 1,
  users: new Map([[2, { name: "Bob", role: "user" }]]) // User 1 deleted
});

// Example 4: Selector pattern with defaults
console.log("\n=== Example 4: Safe Selectors ===");

interface Product {
  id: string;
  name: string;
  price: number;
}

interface CartState {
  items: Product[];
  selectedProductId: string | null;
}

function createCartStore() {
  const state = newSimpleState<CartState>({
    items: [
      { id: "a", name: "Apple", price: 1.5 },
      { id: "b", name: "Banana", price: 0.5 }
    ],
    selectedProductId: "a"
  });

  // GOOD: Selectors with defensive checks
  const selectors = {
    getSelectedProduct(): Product | null {
      const current = state.get();
      if (!current.selectedProductId) return null;
      return current.items.find(p => p.id === current.selectedProductId) ?? null;
    },

    getProductPrice(id: string): number {
      const product = state.get().items.find(p => p.id === id);
      return product?.price ?? 0;
    }
  };

  return { state, selectors };
}

const cart = createCartStore();

cart.state.subscribe((state) => {
  const selected = cart.selectors.getSelectedProduct();
  console.log(
    "Selected:",
    selected ? `${selected.name} ($${selected.price})` : "none"
  );
});

// Remove selected product from cart
cart.state.set({
  items: [{ id: "b", name: "Banana", price: 0.5 }], // "a" removed
  selectedProductId: "a" // Still trying to select removed product
});

// Example 5: Try-catch for complex logic
console.log("\n=== Example 5: Try-Catch for Complex Logic ===");

interface NestedData {
  organization?: {
    departments?: {
      engineering?: {
        team?: {
          lead?: { name: string };
        };
      };
    };
  };
}

const orgData = newSimpleState<NestedData>({
  organization: {
    departments: {
      engineering: {
        team: {
          lead: { name: "Alice" }
        }
      }
    }
  }
});

orgData.subscribe((data) => {
  try {
    // Complex nested access that might fail
    const leadName = data.organization!.departments!.engineering!.team!.lead!.name;
    console.log("Team lead:", leadName);
  } catch (error) {
    console.log("Team lead: Not assigned");
  }
});

// Delete nested structure
orgData.set({
  organization: {
    departments: {}
  }
});

// Example 6: Type guards for union types
console.log("\n=== Example 6: Type Guards ===");

type DataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: { count: number } };

const dataState = newSimpleState<DataState>({ status: "loading" });

dataState.subscribe((state) => {
  // GOOD: Type guards ensure safe access
  switch (state.status) {
    case "loading":
      console.log("Loading...");
      break;
    case "error":
      console.log("Error:", state.message);
      break;
    case "success":
      console.log("Count:", state.data.count);
      break;
  }
});

dataState.set({ status: "success", data: { count: 42 } });
dataState.set({ status: "error", message: "Network timeout" });
dataState.set({ status: "loading" });

// Example 7: Reference Equality Behavior
console.log("\n=== Example 7: Reference Equality ===");

const settings = newSimpleState({ theme: "dark", fontSize: 14 });

let notificationCount = 0;
settings.subscribe(() => {
  notificationCount++;
  console.log("Settings changed! (notification #" + notificationCount + ")");
});

// This WILL notify (different object reference)
settings.set({ theme: "dark", fontSize: 14 });
console.log("After setting new object with same values:", notificationCount); // 1

// This will NOT notify (same reference)
const currentSettings = settings.get();
settings.set(currentSettings);
console.log("After setting same reference:", notificationCount); // Still 1

// This is the expected pattern: always create new references
const updated = { ...settings.get(), theme: "light" };
settings.set(updated);
console.log("After setting new reference with changes:", notificationCount); // 2

console.log(`
Key takeaway: set() uses reference equality (===) to detect changes.
- Setting a NEW object (even with same values) = notification
- Setting the SAME reference = no notification
- Always spread/clone when updating: { ...state.get(), field: newValue }
`);

// Example 8: Subscription Ordering
console.log("\n=== Example 8: Subscription Ordering ===");

const counter = newSimpleState(0);

counter.subscribe(() => console.log("First subscriber"));
counter.subscribe(() => console.log("Second subscriber"));
counter.subscribe(() => console.log("Third subscriber"));

console.log("Setting counter to 1:");
counter.set(1);

console.log(`
Subscribers are notified in the order they were added (insertion order).
This is guaranteed because subscriptions use a Map internally.
`);

// Example 9: Selector-based Subscription Pattern
console.log("\n=== Example 9: Selector-based Subscription ===");

// Helper to subscribe with a selector - only notifies when selected value changes
function subscribeWithSelector<T, S>(
  state: SimpleState<T>,
  selector: (value: T) => S,
  callback: (selected: S) => void
): number {
  let previousSelected: S | undefined;

  return state.subscribe((value) => {
    const selected = selector(value);

    // Only notify if selected value changed
    if (selected !== previousSelected) {
      previousSelected = selected;
      callback(selected);
    }
  });
}

interface UserProfile {
  id: number;
  profile?: {
    name: string;
    email: string;
  };
  lastLogin?: Date;
}

const userProfile = newSimpleState<UserProfile>({
  id: 1,
  profile: { name: "Alice", email: "alice@example.com" },
  lastLogin: new Date()
});

// Subscribe only to email changes
subscribeWithSelector(
  userProfile,
  (user) => user.profile?.email, // Selector with defensive check
  (email) => {
    console.log("Email changed:", email ?? "No email");
  }
);

userProfile.set({
  ...userProfile.get(),
  lastLogin: new Date()
}); // Won't notify (email unchanged)

userProfile.set({
  ...userProfile.get(),
  profile: { name: "Alice", email: "alice@newdomain.com" }
}); // Will notify

userProfile.set({
  ...userProfile.get(),
  profile: undefined
}); // Will notify (email changed to undefined)

// Example 10: Error Boundary Pattern
console.log("\n=== Example 10: Error Boundary ===");

// Helper to catch errors in subscribers
function subscribeWithErrorBoundary<T>(
  state: SimpleState<T>,
  callback: (value: T) => void,
  onError: (error: unknown, value: T) => void
): number {
  return state.subscribe((value) => {
    try {
      callback(value);
    } catch (error) {
      onError(error, value);
    }
  });
}

interface ApiResponse {
  data?: {
    users?: Array<{ id: number; name: string }>;
  };
}

const apiResponse = newSimpleState<ApiResponse>({
  data: {
    users: [{ id: 1, name: "Alice" }]
  }
});

// Subscriber that might throw
subscribeWithErrorBoundary(
  apiResponse,
  (response) => {
    // This might crash if structure is unexpected
    const firstUser = response.data!.users![0];
    console.log("First user:", firstUser.name);
  },
  (error, value) => {
    console.error("Subscriber error:", error instanceof Error ? error.message : String(error));
    console.log("Failed to process:", value);
    // Could log to error tracking service, show user notification, etc.
  }
);

// Works fine
apiResponse.set({
  data: {
    users: [{ id: 2, name: "Bob" }]
  }
});

// Causes error, but doesn't crash the app
apiResponse.set({
  data: {} // Missing users array
});

// App continues working
apiResponse.set({
  data: {
    users: [{ id: 3, name: "Charlie" }]
  }
});

// Summary
console.log("\n=== Best Practices ===");
console.log(`
1. Use optional chaining (?.) and nullish coalescing (??)
2. Early return if required data is missing
3. Write defensive selectors that return null/defaults
4. Use type guards for union types
5. Wrap complex access in try-catch if needed
6. Prefer explicit undefined checks over assumptions
7. Always create new object references when updating
8. Subscribers execute in insertion order (guaranteed)
9. Use selector pattern to subscribe only to specific values
10. Use error boundaries to prevent subscriber crashes
`);

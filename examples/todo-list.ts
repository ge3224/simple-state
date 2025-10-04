import { newSimpleState } from "../src/index";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// Create a todo list state
const todos = newSimpleState<Todo[]>([]);

// Subscribe to changes
todos.subscribe((todoList) => {
  console.log("\n=== Todo List Updated ===");
  if (todoList.length === 0) {
    console.log("(empty)");
  } else {
    todoList.forEach((todo) => {
      const status = todo.completed ? "✓" : " ";
      console.log(`[${status}] ${todo.id}. ${todo.text}`);
    });
  }
  console.log("========================\n");
});

async function runDemo() {
  // Add todos (these will be batched)
  console.log("Adding todos rapidly (will be batched)...");
  todos.set([{ id: 1, text: "Learn Simple State", completed: false }]);
  todos.set([
    ...todos.get(),
    { id: 2, text: "Build an app", completed: false },
  ]);
  todos.set([
    ...todos.get(),
    { id: 3, text: "Deploy to production", completed: false },
  ]);

  // Wait for batched update
  await new Promise(resolve => setTimeout(resolve, 0));

  // Mark first todo as completed
  console.log("Completing first todo...");
  todos.set(
    todos.get().map((todo) => (todo.id === 1 ? { ...todo, completed: true } : todo))
  );

  await new Promise(resolve => setTimeout(resolve, 0));

  // Remove a todo
  console.log("Removing second todo...");
  todos.set(todos.get().filter((todo) => todo.id !== 2));

  await new Promise(resolve => setTimeout(resolve, 0));
}

runDemo();

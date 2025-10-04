# Contributing to Simple State

Contributions are welcome! If you see where this project can be improved - whether it's fixing a bug, handling an edge case, improving documentation, or enhancing tests - please feel free to contribute.

## Reporting Bugs

Found a bug? Please open an issue with:

- A clear description of the problem
- Steps to reproduce (ideally a minimal code example)
- What you expected vs. what actually happened
- Your environment (TypeScript version, Node version, OS)

## Submitting Changes

1. Fork the repo and create a branch from `main`
2. Install dependencies: `pnpm install`
3. Make your changes
4. Add tests if you're adding functionality
5. Run `pnpm test` and `pnpm type-check` to make sure everything passes
6. Commit with a clear message and submit a PR

## Code Style

- Write TypeScript with proper type annotations
- Use named function expressions for debugging: `const foo = function foo() {}` instead of `const foo = () => {}`
  - Exception: callbacks and inline functions can use arrows
- Follow the existing code style
- Keep it simple - this library has zero dependencies for a reason

## Development

```bash
# Install
pnpm install

# Test
pnpm test              # run once
pnpm test:watch        # watch mode
pnpm test:coverage     # with coverage

# Build and type check
pnpm build
pnpm type-check

# Try examples
pnpm dev  # browser examples
```

## Questions?

Open an issue - I'm happy to discuss ideas and answer questions.

# Testing

- Use `pnpm test` for tests
- Use `src/core/adapters/mock/${adapter}.ts` to create mock implementations of external services for testing
- If you must violate a lint rule, add a comment on the line before it like `// biome-ignore lint/${rule}: ${reason}`

## Application Service Tests

- Use `src/core/application/${domain}/${usecase}.test.ts` for unit tests of application services

---
globs: ["**/*"]
description: "Core coding principles and cross-cutting concerns"
alwaysApply: true
---

# Project Core Principles

## Philosophy

> "Write code that humans can understand, not just machines."

This project follows **Clean Code** principles as the foundation for all development decisions.

## Core Principles

### KISS (Keep It Simple, Stupid)
- Prefer simple solutions over clever ones
- If code needs extensive comments to explain, simplify it
- One function = one purpose

### DRY (Don't Repeat Yourself)
- Extract common patterns into reusable abstractions
- Avoid premature abstraction (Rule of Three)

### YAGNI (You Aren't Gonna Need It)
- Implement only what is needed now
- Avoid speculative features

## Naming Conventions

### Universal Rules
- Names should reveal intent
- Avoid abbreviations unless universally understood (`id`, `url`, `api`)
- Use domain vocabulary consistently

### Language-Specific
| Context | Convention | Example |
|---------|------------|---------|
| React Components | PascalCase | `UserProfile.tsx` |
| TypeScript functions | camelCase | `getUserById()` |
| Python functions | snake_case | `get_user_by_id()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Environment variables | UPPER_SNAKE_CASE | `DATABASE_URL` |

## Single Responsibility Principle

Each module, class, and function should have exactly one reason to change.

**Violation indicators:**
- Function names containing "and" or "or"
- Files exceeding 300 lines
- Functions exceeding 30 lines
- More than 3 levels of nesting

## Error Handling Philosophy

- Fail fast, fail explicitly
- Never swallow errors silently
- Provide actionable error messages
- Log errors with sufficient context

## Documentation Philosophy

- Code should be self-documenting
- Comments explain "why", not "what"
- Keep README.md updated with setup instructions
- Document architectural decisions in ADRs when significant

## Security First

- Never commit secrets or API keys
- Validate all external inputs
- Apply principle of least privilege
- Review OWASP Top 10 for web applications

## Testing Philosophy

- Write tests for behavior, not implementation
- Aim for 80% coverage on critical paths
- Tests are documentation

## Git Workflow

- Branch naming: `feat/`, `fix/`, `chore/`, `docs/`
- Keep commits atomic and focused

## Domain-Specific Guidelines

- **Frontend**: See [AGENTS_FRONTEND.md](./AGENTS_FRONTEND.md)
- **Backend & Database**: See [AGENTS_BACKEND.md](./AGENTS_BACKEND.md)
- **Infrastructure**: See [AGENTS_INFRA.md](./AGENTS_INFRA.md)

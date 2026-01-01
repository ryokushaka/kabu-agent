---
globs: ["src/**/*.tsx", "src/**/*.ts", "src/**/*.css", "src/**/*.scss", "*.html"]
description: "React.js frontend development rules"
---

# Frontend Development Rules

## Tech Stack

| Category | Choice | Rationale |
|----------|--------|-----------|
| Framework | React + TypeScript | Type safety, ecosystem |
| Styling | Tailwind CSS | Utility-first, consistency |
| Icons | lucide-react | Lightweight, tree-shakable |
| Build | Vite | Fast HMR, optimized builds |

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # Primitive components (Button, Input)
│   └── features/     # Feature-specific components
├── pages/            # Route-level components
├── hooks/            # Custom React hooks
├── utils/            # Pure utility functions
├── types/            # TypeScript interfaces/types
├── constants/        # Application constants
└── styles/           # Global styles, Tailwind config
```

## Component Guidelines

### Structure
- One component per file
- Co-locate tests: `Component.tsx` + `Component.test.tsx`
- Co-locate styles if needed: `Component.module.css`

### Functional Components Only
```tsx
// Correct
const UserProfile = ({ user }: UserProfileProps) => {
  return <div>{user.name}</div>;
};

// Avoid: class components
```

### Props Interface
```tsx
// Define props with interface, not type
interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}
```

### Composition Over Configuration
```tsx
// Prefer
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>

// Over
<Card title="Title" body="Content" showHeader={true} />
```

## State Management

### Hierarchy (prefer in order)
1. `useState` - local component state
2. `useReducer` - complex local state
3. `useContext` - shared state across component tree
4. External library - only when Context becomes unwieldy

### State Colocation
- Keep state as close to where it's used as possible
- Lift state only when necessary for sharing

## Hooks Best Practices

### Custom Hooks
- Prefix with `use`: `useAuth`, `useLocalStorage`
- Extract logic, not UI
- Return consistent tuple or object

```tsx
// Good: returns consistent shape
const useToggle = (initial = false) => {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle] as const;
};
```

### Dependency Arrays
- Include all dependencies
- Use `useCallback` and `useMemo` intentionally, not prematurely

## TypeScript Rules

### Strict Mode
- Enable `strict: true` in tsconfig
- No `any` - use `unknown` if type is truly unknown

### Type vs Interface
```tsx
// Use interface for object shapes
interface User {
  id: string;
  name: string;
}

// Use type for unions, intersections, primitives
type Status = 'idle' | 'loading' | 'error' | 'success';
type UserOrNull = User | null;
```

### Generic Components
```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

const List = <T,>({ items, renderItem }: ListProps<T>) => (
  <ul>{items.map(renderItem)}</ul>
);
```

## Styling Guidelines

### Tailwind CSS
- Follow `toss-grey` color palette in `index.css`
- Use design tokens over arbitrary values
- Extract repeated patterns to components, not CSS classes

### Responsive Design
- Mobile-first approach
- Use Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`

### Dark Mode
- Use CSS variables for theme values
- Apply `dark:` variants consistently

## Performance

### Code Splitting
- Lazy load routes: `React.lazy()` + `Suspense`
- Dynamic imports for heavy components

### Rendering Optimization
- Use `React.memo` only when profiler shows need
- Avoid inline object/function props in lists
- Use stable keys (not array index)

### Bundle Size
- Target < 500KB initial bundle
- Analyze with `vite-bundle-visualizer`

## Accessibility (a11y)

- Semantic HTML first (`button`, not `div` with onClick)
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast ratios (WCAG AA minimum)
- Focus management for modals/dialogs

## Error Handling

### Error Boundaries
```tsx
// Wrap route-level components
<ErrorBoundary fallback={<ErrorPage />}>
  <Routes />
</ErrorBoundary>
```

### API Errors
- Display user-friendly messages
- Log technical details to console/monitoring
- Provide retry actions when appropriate

## Testing

### Tools
- Vitest + React Testing Library
- MSW for API mocking

### Strategy
```tsx
// Test behavior, not implementation
test('submits form with valid data', async () => {
  render(<LoginForm />);

  await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'password123');
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  expect(mockSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123'
  });
});
```

## API Integration

### Centralized Client
- Single axios/fetch instance with interceptors
- Consistent error handling
- Request/response typing

### Data Fetching
- Use React Query or SWR for server state
- Separate server state from UI state

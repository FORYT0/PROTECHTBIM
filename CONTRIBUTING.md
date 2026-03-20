# Contributing to PROTECHT BIM

Thank you for your interest in contributing to PROTECHT BIM! This document provides guidelines and instructions for contributing to the project.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd protecht-bim
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Start development services**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d

   # Or start services individually
   npm run dev
   ```

## Code Style

### TypeScript

- Use TypeScript strict mode (already configured)
- Prefer interfaces over types for object shapes
- Use explicit return types for functions
- Avoid `any` - use `unknown` if type is truly unknown
- Use enums for fixed sets of values

### Naming Conventions

- **Files**: kebab-case (e.g., `work-package.ts`)
- **Classes**: PascalCase (e.g., `WorkPackageService`)
- **Interfaces**: PascalCase (e.g., `WorkPackage`)
- **Functions**: camelCase (e.g., `createWorkPackage`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Private members**: prefix with underscore (e.g., `_internalMethod`)

### Code Organization

- Keep files focused and under 300 lines when possible
- Group related functionality into modules
- Use barrel exports (index.ts) for clean imports
- Place types in `shared-types` library
- Place utilities in `shared-utils` library

## Git Workflow

### Branch Naming

- `feature/` - New features (e.g., `feature/gantt-chart`)
- `fix/` - Bug fixes (e.g., `fix/date-calculation`)
- `refactor/` - Code refactoring (e.g., `refactor/auth-service`)
- `docs/` - Documentation updates (e.g., `docs/api-guide`)
- `test/` - Test additions (e.g., `test/work-package-service`)

### Commit Messages

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes

**Examples:**
```
feat(api): add work package filtering endpoint

Implements filtering by status, assignee, and date range.
Includes pagination support.

Closes #123
```

```
fix(web): correct date display in Gantt chart

Dates were showing in UTC instead of local timezone.
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear, atomic commits
3. Write or update tests as needed
4. Run linting and tests: `npm run lint && npm test`
5. Update documentation if needed
6. Create a pull request with a clear description
7. Address review feedback
8. Squash commits if requested before merging

## Testing

### Unit Tests

- Write unit tests for all business logic
- Aim for >80% code coverage
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

```typescript
describe('WorkPackageService', () => {
  describe('createWorkPackage', () => {
    it('should create a work package with valid data', async () => {
      // Arrange
      const data = { subject: 'Test', type: 'task', project_id: '123' };
      
      // Act
      const result = await service.createWorkPackage(data);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.subject).toBe('Test');
    });
  });
});
```

### Integration Tests

- Test API endpoints end-to-end
- Use test database
- Clean up test data after each test

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific project
npx nx test api

# Run tests in watch mode
npx nx test api --watch

# Run tests with coverage
npx nx test api --coverage
```

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Update design documents for architectural changes
- Include examples in documentation

## Code Review

### As a Reviewer

- Be constructive and respectful
- Focus on code quality, not personal preferences
- Suggest improvements, don't demand them
- Approve when code meets standards

### As an Author

- Respond to all comments
- Ask for clarification if needed
- Make requested changes or explain why not
- Thank reviewers for their time

## Questions?

If you have questions about contributing, please reach out to the development team.

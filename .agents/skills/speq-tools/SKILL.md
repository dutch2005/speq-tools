```markdown
# speq-tools Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `speq-tools` TypeScript repository. You'll learn about file naming, import/export styles, commit message conventions, and how to write and run tests. The guide also provides suggested commands for common workflows to streamline your development process.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `myUtility.ts`, `parseData.test.ts`

### Import Style
- Use **relative imports** for referencing modules within the codebase.
  - Example:
    ```typescript
    import { parseData } from './parseData';
    ```

### Export Style
- Use **named exports** rather than default exports.
  - Example:
    ```typescript
    // In parseData.ts
    export function parseData(input: string): ParsedResult { ... }

    // Usage
    import { parseData } from './parseData';
    ```

### Commit Messages
- Follow the **conventional commit** style.
- Use prefixes such as `fix` to indicate the type of change.
  - Example:
    ```
    fix: handle null input in parseData utility
    ```

## Workflows

### Making a Code Change
**Trigger:** When you need to add a feature, fix a bug, or refactor code  
**Command:** `/make-change`

1. Create or update files using camelCase naming.
2. Use relative imports and named exports.
3. Write clear, conventional commit messages (e.g., `fix: ...`).
4. Add or update tests in files matching `*.test.*`.
5. Run tests to verify your changes.

### Writing and Running Tests
**Trigger:** When you add new code or modify existing logic  
**Command:** `/run-tests`

1. Create a test file with the pattern `*.test.ts` (e.g., `parseData.test.ts`).
2. Write tests for your functions and modules.
3. Use your preferred test runner (framework is not specified).
4. Run all tests and ensure they pass before committing.

## Testing Patterns

- Test files follow the `*.test.*` naming convention.
  - Example: `parseData.test.ts`
- Place tests alongside the modules they cover or in a dedicated test directory.
- The testing framework is not specified; ensure consistency with existing tests.
- Example test file:
  ```typescript
  import { parseData } from './parseData';

  describe('parseData', () => {
    it('should parse valid input', () => {
      const result = parseData('input');
      expect(result).toBeDefined();
    });
  });
  ```

## Commands
| Command        | Purpose                                    |
|----------------|--------------------------------------------|
| /make-change   | Start a new code change workflow           |
| /run-tests     | Run all test files matching `*.test.*`      |
```

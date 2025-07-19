# Contributing to json-streamify

Thank you for your interest in contributing to json-streamify! This document provides guidelines for development, testing, and publishing.

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm

### Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:

   ```bash
   npm run build
   ```

## Development Workflow

### Building

```bash
npm run build
```

This creates both CommonJS and ESM builds in the `dist/` directory.

### Testing

```bash
npm test
```

Run the comprehensive test suite to ensure all functionality works correctly.

### Code Quality

```bash
# Run linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Check code formatting
npm run format:check

# Auto-format code
npm run format

# Run all checks (lint + format + test)
npm run check

# Prepare for PR/publishing (clean, fix, test, build)
npm run pr
```

### Running the Demo

```bash
npm run demo
```

This starts a local Express server and demonstrates the library working with a real web API.

## Code Standards

- **TypeScript**: All code must be properly typed with no `any` usage
- **ESLint**: Code must pass all linting rules
- **Prettier**: Code must be formatted consistently
- **Tests**: All new features must include comprehensive tests

## Publishing to npm

### Prerequisites

1. **npm account**: Create an account at [npmjs.com](https://www.npmjs.com)
2. **npm CLI login**: Run `npm login` and enter your credentials
3. **Package name**: Ensure `@ccm/json-streamify` is available or update the name in `package.json`

### Pre-publish Checklist

1. **Update version** in `package.json`:

   ```bash
   npm version patch|minor|major
   ```

2. **Run pre-publish checks**:

   ```bash
   npm run pr
   ```

   This will clean, auto-fix linting/formatting, run tests, and build the project.

3. **Verify package contents**:

   ```bash
   npm pack --dry-run
   ```

### Publishing

```bash
# For scoped packages (first time)
npm publish --access public

# For subsequent releases
npm publish
```

### Package Contents

The published package includes:

- `dist/` - Compiled JavaScript (CJS and ESM)
- `dist/index.d.ts` - TypeScript definitions
- `package.json` - Package metadata
- `README.md` - Documentation

Demo files and development dependencies are excluded via `.gitignore` and npm's default exclusions.

## Project Structure

```text
json-streamify/
├── src/
│   ├── index.ts              # Main library code
│   └── __tests__/
│       └── index.test.ts     # Test suite
├── examples/
│   ├── server.ts             # Demo Express server
│   ├── client.ts             # Demo client
│   └── README.md             # Demo documentation
├── dist/                     # Build output (generated)
├── .eslintrc.js              # ESLint configuration
├── .prettierrc.js            # Prettier configuration
├── tsconfig.json             # TypeScript config (dev)
├── tsconfig.build.json       # TypeScript config (build)
├── jest.config.js            # Jest test configuration
└── package.json              # Package metadata
```

## Automated Checks

The project includes several automated quality checks:

- **Pre-commit**: Code is automatically formatted and linted
- **Pre-publish**: Build is automatically run via `prepare` script
- **CI/CD**: All checks must pass before merge (if configured)

## Release Process

1. Run pre-publish checks: `npm run pr`
2. Update version: `npm version [patch|minor|major]`
3. Publish: `npm publish`
4. Tag the release in git:

   ```bash
   git tag v1.0.0  # Replace with actual version
   git push origin v1.0.0
   ```

5. Update changelog if applicable

## Getting Help

- Check existing [issues](https://github.com/your-org/json-streamify/issues)
- Review the [examples](examples/) for usage patterns
- Run the demo to see the library in action

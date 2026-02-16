# @codygo-ai/eslint-plugin-mono

Custom ESLint plugin with monorepo-specific rules for CodyGo AI projects.

## Installation

```bash
npm install --save-dev @codygo-ai/eslint-plugin-mono eslint
```

## Requirements

- ESLint 9.x

## Usage

```javascript
import monoPlugin from '@codygo-ai/eslint-plugin-mono';

export default [
  {
    plugins: {
      mono: monoPlugin,
    },
    rules: {
      // Enable specific rules
    },
  },
];
```

## Features

Custom ESLint rules designed for monorepo management and workspace consistency.

## Development

### Run Tests

```bash
npm test
```

### Lint

```bash
npm run lint
```

## License

MIT

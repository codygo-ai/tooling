# @codygo-ai/eslint-config-base

Base ESLint configuration for CodyGo AI projects.

## Installation

```bash
npm install --save-dev @codygo-ai/eslint-config-base eslint prettier
```

## Requirements

- ESLint 9.x
- Prettier 3.x

## Usage

Create an `eslint.config.js` file in your project root:

```javascript
import baseConfig from '@codygo-ai/eslint-config-base';

export default [
  ...baseConfig,
  // Your custom rules here
];
```

## Features

This configuration includes:

- TypeScript support via `@typescript-eslint`
- Import/export linting with `eslint-plugin-import`
- Prettier integration with `eslint-plugin-prettier`
- ESLint comments validation
- Import resolver for TypeScript
- Custom monorepo rules via `@codygo-ai/eslint-plugin-mono`

## Included Plugins

- `@eslint/js`
- `@typescript-eslint/parser`
- `@typescript-eslint/eslint-plugin`
- `eslint-plugin-import`
- `eslint-plugin-prettier`
- `eslint-plugin-eslint-comments`
- `eslint-config-prettier`
- `eslint-import-resolver-typescript`
- `@codygo-ai/eslint-plugin-mono`

## License

MIT

# @codygo-ai/eslint-config-react

ESLint configuration for React projects at CodyGo AI.

## Installation

```bash
npm install --save-dev @codygo-ai/eslint-config-react eslint prettier react
```

## Requirements

- ESLint 9.x
- Prettier 3.x
- React 18.x

## Usage

Create an `eslint.config.js` file in your project root:

```javascript
import reactConfig from '@codygo-ai/eslint-config-react';

export default [
  ...reactConfig,
  // Your custom rules here
];
```

## Features

This configuration extends `@codygo-ai/eslint-config-preact` and adds:

- React-specific linting rules
- React Refresh support for HMR
- JSX best practices

## Included Plugins

- All plugins from `@codygo-ai/eslint-config-preact`
- `eslint-plugin-react`
- `eslint-plugin-react-refresh`

## License

MIT

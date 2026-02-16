# @codygo-ai/eslint-config-preact

ESLint configuration for Preact projects at CodyGo AI.

## Installation

```bash
npm install --save-dev @codygo-ai/eslint-config-preact eslint prettier preact
```

## Requirements

- ESLint 9.x
- Prettier 3.x
- Preact 10.x

## Usage

Create an `eslint.config.js` file in your project root:

```javascript
import preactConfig from '@codygo-ai/eslint-config-preact';

export default [
  ...preactConfig,
  // Your custom rules here
];
```

## Features

This configuration extends `@codygo-ai/eslint-config-base` and adds:

- Preact-specific linting rules
- React hooks linting (compatible with Preact)
- JSX support

## Included Plugins

- All plugins from `@codygo-ai/eslint-config-base`
- `eslint-plugin-react` (configured for Preact)
- `eslint-plugin-react-hooks`

## License

MIT

# @codygo-ai/tsconfig

Shared TypeScript configuration presets for CodyGo AI projects.

## Installation

```bash
npm install --save-dev @codygo-ai/tsconfig
```

## Usage

This package provides multiple TypeScript configurations for different project types:

### Base Configuration

For general TypeScript projects:

```json
{
  "extends": "@codygo-ai/tsconfig/base.json"
}
```

### React Configuration

For React projects:

```json
{
  "extends": "@codygo-ai/tsconfig/react.json"
}
```

### Preact Configuration

For Preact projects:

```json
{
  "extends": "@codygo-ai/tsconfig/preact.json"
}
```

### Node.js Configuration

For Node.js projects:

```json
{
  "extends": "@codygo-ai/tsconfig/node.json"
}
```

### AWS CDK Configuration

For AWS CDK projects:

```json
{
  "extends": "@codygo-ai/tsconfig/cdk.json"
}
```

## Available Configurations

- `base.json` - Base TypeScript configuration
- `react.json` - React-specific configuration
- `preact.json` - Preact-specific configuration
- `node.json` - Node.js-specific configuration
- `cdk.json` - AWS CDK-specific configuration

## License

MIT

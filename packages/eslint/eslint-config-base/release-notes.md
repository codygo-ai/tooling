## @codygo-ai/eslint-config-base v0.3.0-alpha

- Enable 8 previously dormant rules:
  - `no-forbidden-imports` — index.ts sentinel guard
  - `index-exports-only` — no logic in index.ts
  - `enforce-tilde-imports` — `~/` banned in libs, required in apps
  - `app-error-required-props` — AppError must have cause/context/code
  - `workspace-protocol` — internal deps must use `workspace:^`
  - `no-dotenv` — use `--env-file-if-exists` instead
  - `require-env-example` — configurable filename, apps-only scope
  - `package-json-schema` — base required fields/scripts
- Remove dead `package-hierarchy` rule
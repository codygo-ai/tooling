/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync } = require('child_process');
const { resolve } = require('path');

const { name: monoRepoPackageName } = require('./package.json');

module.exports = {
  '*.{ts,tsx,js,jsx}': (allFiles) => {
    // Filter out config files that aren't part of TypeScript projects
    const configFilePattern = /\.config\.(ts|js)$/;
    const sourceFiles = allFiles.filter((f) => !configFilePattern.test(f));

    const roots = JSON.parse(execSync('pnpm list -r --depth -1 --json', { encoding: 'utf-8' }));
    const projects = roots
      .filter(({ name }) => name !== monoRepoPackageName)
      .map(({ name, path }) => ({
        name,
        files: sourceFiles.filter((f) => resolve(f).startsWith(resolve(path))),
      }))
      .filter((p) => p.files.length > 0);
    const commands = projects.map(
      ({ name, files }) =>
        `pnpm --filter ${name} exec eslint --max-warnings=0 --no-warn-ignored '${files.join("' '")}'`
    );
    return commands;
  },
};

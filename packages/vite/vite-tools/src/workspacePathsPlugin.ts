import { readFileSync, statSync, readdirSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';

import type { Plugin } from 'vite';

function findWorkspaceRoot(startPath: string): string | undefined {
  let currentDir = startPath;
  const rootDir = '/';

  while (currentDir !== rootDir) {
    const workspaceFile = join(currentDir, 'pnpm-workspace.yaml');
    try {
      const stats = statSync(workspaceFile);
      if (stats.isFile()) {
        return currentDir;
      }
    } catch {
      // Continue searching
    }
    currentDir = dirname(currentDir);
  }

  return undefined;
}

function getWorkspacePackages(workspaceRoot: string): Map<string, string> {
  const packageMap = new Map<string, string>();
  const workspaceFile = readFileSync(join(workspaceRoot, 'pnpm-workspace.yaml'), 'utf-8');

  // Simple pattern matching for workspace packages
  const patterns = workspaceFile
    .split('\n')
    .filter((line) => line.trim().startsWith('-'))
    .map((line) => line.trim().substring(1).trim());

  function findPackages(pattern: string): void {
    // Convert glob pattern to directory traversal
    // Patterns like "apps/*" or "libs/*/*" become directory searches
    const parts = pattern.split('/').filter(Boolean);
    const searchDirs: string[] = [workspaceRoot];

    for (const part of parts) {
      const newDirs: string[] = [];
      for (const searchDir of searchDirs) {
        if (part === '*') {
          // Single level wildcard
          try {
            const entries = readdirSync(searchDir, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.isDirectory()) {
                newDirs.push(join(searchDir, entry.name));
              }
            }
          } catch {
            // Skip if can't read
          }
        } else if (part.includes('*')) {
          // Pattern matching (simple implementation)
          try {
            const entries = readdirSync(searchDir, { withFileTypes: true });
            const regex = new RegExp('^' + part.replace(/\*/g, '.*') + '$');
            for (const entry of entries) {
              if (entry.isDirectory() && regex.test(entry.name)) {
                newDirs.push(join(searchDir, entry.name));
              }
            }
          } catch {
            // Skip if can't read
          }
        } else {
          // Literal directory
          const literalPath = join(searchDir, part);
          if (existsSync(literalPath)) {
            newDirs.push(literalPath);
          }
        }
      }
      searchDirs.length = 0;
      searchDirs.push(...newDirs);
    }

    // Check each found directory for package.json
    for (const dir of searchDirs) {
      const packageJsonPath = join(dir, 'package.json');
      try {
        if (statSync(packageJsonPath).isFile()) {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
            name?: string;
          };
          if (typeof packageJson?.name === 'string') {
            packageMap.set(packageJson.name, dir);
          }
        }
      } catch {
        // Skip invalid packages
      }
    }
  }

  for (const pattern of patterns) {
    findPackages(pattern);
  }

  return packageMap;
}

interface WorkspacePathsPluginOptions {
  appSrcPath?: string;
}

export default function workspacePathsPlugin(options: WorkspacePathsPluginOptions = {}): Plugin {
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  if (!workspaceRoot) {
    return {
      name: 'workspace-paths',
    };
  }

  const packages = getWorkspacePackages(workspaceRoot);

  return {
    name: 'workspace-paths',
    config(config) {
      const alias: Record<string, string> = {};

      // Add ~/ alias if appSrcPath is provided
      if (options.appSrcPath) {
        alias['~'] = options.appSrcPath;
      }

      // Add workspace package aliases
      for (const [name, path] of packages.entries()) {
        alias[name] = resolve(path, 'src');
      }

      if (!config.resolve) {
        config.resolve = {};
      }
      if (!config.resolve.alias) {
        config.resolve.alias = {};
      }

      Object.assign(config.resolve.alias, alias);
    },
  };
}

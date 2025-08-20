#!/usr/bin/env node

import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// Resolve the path to mcp-server.js
const serverPath = fileURLToPath(new URL('../mcp-server.js', import.meta.url));

// Run the actual ESM script directly with `node`
const result = spawnSync('node', [
  serverPath
], {
  stdio: 'inherit',
  shell: true
});

process.exit(result.status);

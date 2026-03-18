'use strict';

const fs   = require('fs');
const path = require('path');

const MAX_DEPTH    = 4;
const MAX_CHILDREN = 50;
const IGNORED = new Set([
  '.git', 'node_modules', '.cache', '.npm', '.local',
  'proc', 'sys', 'dev', 'run',
]);

function scanDir(dirPath, depth = 0) {
  if (depth > MAX_DEPTH) return null;

  let stat;
  try {
    stat = fs.lstatSync(dirPath);
  } catch {
    return null;
  }

  const name = path.basename(dirPath) || '/';
  const isDir     = stat.isDirectory();
  const isSymlink = stat.isSymbolicLink();

  const node = {
    name,
    path:     dirPath,
    type:     isDir ? 'dir' : isSymlink ? 'symlink' : 'file',
    mode:     stat.mode,
    size:     stat.size,
    children: [],
  };

  if (!isDir) return node;

  let entries;
  try {
    entries = fs.readdirSync(dirPath);
  } catch {
    return node; // no read permission, return dir without children
  }

  entries = entries
    .filter(e => !IGNORED.has(e) && !e.startsWith('.'))
    .slice(0, MAX_CHILDREN);

  for (const entry of entries) {
    const child = scanDir(path.join(dirPath, entry), depth + 1);
    if (child) node.children.push(child);
  }

  return node;
}

function scanFilesystem(rootPath) {
  const start = rootPath || process.env.HOME || '/home';
  return scanDir(start, 0);
}

module.exports = { scanFilesystem };

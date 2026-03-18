'use strict';

const chokidar = require('chokidar');
const fs       = require('fs');
const path     = require('path');
const { MSG_TYPES } = require('./protocol');

class FsWatcher {
  constructor(sendFn) {
    this.sendFn    = sendFn;
    this.watcher   = null;
    this.watchPath = null;
  }

  watch(watchPath) {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.watchPath = watchPath;
    this.watcher = chokidar.watch(watchPath, {
      depth:         3,
      ignoreInitial: true,
      ignored:       /(node_modules|\.git)/,
      awaitWriteFinish: { stabilityThreshold: 200 },
    });

    this.watcher.on('add', (filePath) => {
      const s = this._stat(filePath);
      this.sendFn({
        type:    MSG_TYPES.FS_ADD,
        payload: {
          parent: path.dirname(filePath),
          node: {
            name:     path.basename(filePath),
            path:     filePath,
            type:     'file',
            mode:     s?.mode ?? 0o644,
            size:     s?.size ?? 0,
            children: [],
          },
        },
      });
    });

    this.watcher.on('addDir', (dirPath) => {
      const s = this._stat(dirPath);
      this.sendFn({
        type:    MSG_TYPES.FS_ADD,
        payload: {
          parent: path.dirname(dirPath),
          node: {
            name:     path.basename(dirPath),
            path:     dirPath,
            type:     'dir',
            mode:     s?.mode ?? 0o755,
            size:     0,
            children: [],
          },
        },
      });
    });

    this.watcher.on('unlink',    (p) => this.sendFn({ type: MSG_TYPES.FS_REMOVE, payload: { path: p } }));
    this.watcher.on('unlinkDir', (p) => this.sendFn({ type: MSG_TYPES.FS_REMOVE, payload: { path: p } }));

    this.watcher.on('change', (filePath) => {
      const s = this._stat(filePath);
      if (s) this.sendFn({ type: MSG_TYPES.FS_CHANGE, payload: { path: filePath, mode: s.mode } });
    });

    this.watcher.on('error', (err) => console.error('[Watcher] Error:', err));
  }

  _stat(p) {
    try { return fs.lstatSync(p); } catch { return null; }
  }

  close() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

module.exports = { FsWatcher };

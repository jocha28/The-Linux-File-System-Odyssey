'use strict';

const express        = require('express');
const http           = require('http');
const { WebSocketServer } = require('ws');
const path           = require('path');

const { MSG_TYPES }  = require('./protocol');
const { PtyManager } = require('./pty-manager');
const { FsWatcher }  = require('./fs-watcher');
const { scanFilesystem } = require('./fs-scanner');

const PORT      = 3001;
const START_DIR = process.env.HOME || '/home';

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const clientId = Date.now();
  console.log(`[WS] Client #${clientId} connecté depuis ${req.socket.remoteAddress}`);

  // Helper: send JSON message to this client
  const send = (msg) => {
    if (ws.readyState === ws.OPEN) {
      try { ws.send(JSON.stringify(msg)); } catch {}
    }
  };

  // --- 1. Send initial filesystem tree ---
  const tree = scanFilesystem(START_DIR);
  send({ type: MSG_TYPES.FS_TREE, payload: { root: tree, cwd: START_DIR } });

  // --- 2. Filesystem watcher ---
  const watcher = new FsWatcher(send);
  watcher.watch(START_DIR);

  // --- 3. PTY (real bash shell) ---
  let currentCwd = START_DIR;

  const ptyMgr = new PtyManager(send, (cwd) => {
    if (cwd === currentCwd) return;
    currentCwd = cwd;
    send({ type: MSG_TYPES.CWD_CHANGE, payload: { path: cwd } });
    // Re-scan the new directory and update watcher
    const subtree = scanFilesystem(cwd);
    send({ type: MSG_TYPES.FS_TREE, payload: { root: subtree, cwd } });
    watcher.watch(cwd);
  });

  ptyMgr.spawn(START_DIR);

  // --- Message handling ---
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case MSG_TYPES.PTY_INPUT:
        ptyMgr.write(msg.payload);
        break;

      case MSG_TYPES.PTY_RESIZE:
        ptyMgr.resize(msg.payload.cols, msg.payload.rows);
        break;

      case MSG_TYPES.FS_SCAN: {
        const subtree = scanFilesystem(msg.payload.path);
        send({ type: MSG_TYPES.FS_TREE, payload: { root: subtree, cwd: currentCwd } });
        break;
      }

      default:
        break;
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client #${clientId} déconnecté`);
    ptyMgr.kill();
    watcher.close();
  });

  ws.on('error', (err) => console.error(`[WS] Client #${clientId} erreur:`, err.message));
});

server.listen(PORT, () => {
  console.log(`\n🌌 Linux File-System Odyssey - Serveur`);
  console.log(`   HTTP : http://localhost:${PORT}`);
  console.log(`   WS   : ws://localhost:${PORT}/ws\n`);
});

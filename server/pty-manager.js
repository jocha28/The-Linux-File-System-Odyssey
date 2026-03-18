'use strict';

const pty = require('node-pty');
const { MSG_TYPES } = require('./protocol');

const CWD_SENTINEL = '::CWD::';
const CWD_REGEX    = /::CWD::([^\r\n]+)/g;

class PtyManager {
  constructor(sendFn, onCwdChange) {
    this.sendFn      = sendFn;
    this.onCwdChange = onCwdChange;
    this.ptyProcess  = null;
  }

  spawn(startDir = process.env.HOME || '/home') {
    // --norc --noprofile : ne pas charger .bashrc/.profile qui pourraient
    // écraser notre PROMPT_COMMAND. On définit PROMPT_COMMAND directement
    // dans l'environnement — bash interactif le respecte dans ce cas.
    this.ptyProcess = pty.spawn('bash', ['--norc', '--noprofile'], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd:  startDir,
      env: {
        ...process.env,
        TERM:           'xterm-256color',
        PROMPT_COMMAND: `printf "\\n${CWD_SENTINEL}$(pwd)\\n"`,
        PS1:            '\\[\\033[1;32m\\]\\u@odyssey\\[\\033[0m\\]:\\[\\033[1;34m\\]\\w\\[\\033[0m\\]\\$ ',
      },
    });

    this.ptyProcess.onData((data) => {
      // Extract all CWD sentinels
      const matches = [...data.matchAll(CWD_REGEX)];
      for (const m of matches) {
        this.onCwdChange(m[1].trim());
      }

      // Strip sentinel lines before forwarding to terminal
      const clean = data.replace(/::CWD::[^\r\n]*\r?\n?/g, '');
      if (clean) {
        this.sendFn({ type: MSG_TYPES.PTY_OUTPUT, payload: clean });
      }
    });

    this.ptyProcess.onExit(({ exitCode }) => {
      this.sendFn({
        type:    MSG_TYPES.PTY_OUTPUT,
        payload: `\r\n\x1b[33m[Session terminée — code ${exitCode}]\x1b[0m\r\n`,
      });
    });

    console.log(`[PTY] Spawned bash in ${startDir}`);
  }

  write(data) {
    if (this.ptyProcess) this.ptyProcess.write(data);
  }

  resize(cols, rows) {
    if (this.ptyProcess && cols > 0 && rows > 0) {
      this.ptyProcess.resize(cols, rows);
    }
  }

  kill() {
    if (this.ptyProcess) {
      try { this.ptyProcess.kill(); } catch {}
      this.ptyProcess = null;
    }
  }
}

module.exports = { PtyManager };

import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

export class Terminal {
  constructor(containerId) {
    this.xterm = new XTerm({
      theme: {
        background:    '#060d08',
        foreground:    '#00ff88',
        cursor:        '#00ff88',
        cursorAccent:  '#000',
        selectionBackground: '#00ff8833',
        black:         '#000000',
        red:           '#ff4444',
        green:         '#00ff88',
        yellow:        '#ffcc00',
        blue:          '#4488ff',
        magenta:       '#ff00ff',
        cyan:          '#00ccff',
        white:         '#cccccc',
        brightBlack:   '#555555',
        brightRed:     '#ff6666',
        brightGreen:   '#44ffaa',
        brightYellow:  '#ffdd44',
        brightBlue:    '#66aaff',
        brightMagenta: '#ff44ff',
        brightCyan:    '#44ddff',
        brightWhite:   '#ffffff',
      },
      fontFamily:   "'Courier New', 'Lucida Console', monospace",
      fontSize:     13,
      lineHeight:   1.2,
      scrollback:   1000,
      cursorBlink:  true,
      cursorStyle:  'block',
      allowProposedApi: true,
    });

    this.fitAddon = new FitAddon();
    this.xterm.loadAddon(this.fitAddon);
    this.xterm.loadAddon(new WebLinksAddon());

    const el = document.getElementById(containerId);
    this.xterm.open(el);

    // Délai pour laisser le DOM s'initialiser avant de fitter
    setTimeout(() => this.fitAddon.fit(), 150);
    window.addEventListener('resize', () => this.fitAddon.fit());
  }

  write(data) { this.xterm.write(data); }

  onData(cb)  { this.xterm.onData(cb); }

  getDimensions() {
    return { cols: this.xterm.cols, rows: this.xterm.rows };
  }

  focus() { this.xterm.focus(); }
}

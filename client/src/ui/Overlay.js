export class Overlay {
  constructor() {
    this.pathEl   = document.getElementById('current-path');
    this.statusEl = document.getElementById('connection-status');
    this.tooltip  = document.getElementById('tooltip');
  }

  setCwd(path) {
    if (this.pathEl) this.pathEl.textContent = path;
  }

  setConnectionStatus(status) {
    if (!this.statusEl) return;
    if (status === 'connected') {
      this.statusEl.textContent = '● Connecté';
      this.statusEl.className   = 'connected';
    } else {
      this.statusEl.textContent = '● Déconnecté — reconnexion...';
      this.statusEl.className   = '';
    }
  }

  showTooltip(x, y, html) {
    if (!this.tooltip) return;
    this.tooltip.innerHTML    = html;
    this.tooltip.style.left   = `${x + 16}px`;
    this.tooltip.style.top    = `${y - 12}px`;
    this.tooltip.style.display = 'block';
  }

  hideTooltip() {
    if (this.tooltip) this.tooltip.style.display = 'none';
  }
}

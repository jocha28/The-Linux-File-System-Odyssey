import { send, on } from '../ws/socket.js';
import { MSG_TYPES } from '../utils/protocol.js';

export class TerminalBridge {
  constructor(terminal) {
    this.terminal = terminal;

    // Sortie PTY → affichage dans le terminal
    on(MSG_TYPES.PTY_OUTPUT, (data) => {
      this.terminal.write(data);
    });

    // Saisie clavier → envoi au PTY
    this.terminal.onData((data) => {
      send({ type: MSG_TYPES.PTY_INPUT, payload: data });
    });

    // Envoyer les dimensions initiales
    const dims = this.terminal.getDimensions();
    send({ type: MSG_TYPES.PTY_RESIZE, payload: dims });
  }
}

const RECONNECT_DELAY = 2500;

let socket          = null;
let statusCallback  = null;
const listeners     = {};
let reconnectTimer  = null;

export function connect(onStatus) {
  statusCallback = onStatus;
  _open();
}

function _open() {
  if (socket && socket.readyState < 2) return; // CONNECTING ou OPEN

  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  socket = new WebSocket(`${proto}://${location.host}/ws`);

  socket.onopen = () => {
    statusCallback?.('connected');
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  };

  socket.onmessage = (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }
    listeners[msg.type]?.(msg.payload);
  };

  socket.onclose = () => {
    statusCallback?.('disconnected');
    reconnectTimer = setTimeout(_open, RECONNECT_DELAY);
  };

  socket.onerror = () => {}; // géré par onclose
}

export function send(msg) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(msg));
  }
}

export function on(type, handler) { listeners[type] = handler; }
export function off(type)         { delete listeners[type]; }

/**
 * Décode les bits de mode Unix et retourne des propriétés visuelles.
 * @param {number} mode - stat.mode (ex: 0o100755)
 * @returns {{ color: number, emissive: number, label: string }}
 */
export function getPermissionProps(mode) {
  if (!mode) return { color: 0x444444, emissive: 0x000000, label: 'inconnu' };

  const isSetuid = (mode & 0o4000) !== 0;
  const isSetgid = (mode & 0o2000) !== 0;
  const ownerRead  = (mode & 0o400) !== 0;
  const ownerWrite = (mode & 0o200) !== 0;
  const ownerExec  = (mode & 0o100) !== 0;

  if (isSetuid || isSetgid) {
    return { color: 0xff00ff, emissive: 0x220022, label: 'setuid/setgid' };
  }
  if (ownerExec) {
    return { color: 0x00ccff, emissive: 0x001833, label: 'exécutable' };
  }
  if (ownerRead && ownerWrite) {
    return { color: 0x44ff88, emissive: 0x002211, label: 'lecture/écriture' };
  }
  if (ownerRead && !ownerWrite) {
    return { color: 0xff4444, emissive: 0x1a0000, label: 'lecture seule' };
  }
  if (!ownerRead && ownerWrite) {
    return { color: 0xffaa00, emissive: 0x1a0800, label: 'écriture seule' };
  }
  return { color: 0x222222, emissive: 0x000000, label: 'inaccessible' };
}

/**
 * Construit la chaîne rwxrwxrwx depuis le mode.
 */
export function getModeString(mode) {
  if (!mode) return '----------';
  const b = (bit) => (mode & bit) ? 1 : 0;
  return [
    b(0o400) ? 'r' : '-',
    b(0o200) ? 'w' : '-',
    b(0o100) ? 'x' : '-',
    b(0o040) ? 'r' : '-',
    b(0o020) ? 'w' : '-',
    b(0o010) ? 'x' : '-',
    b(0o004) ? 'r' : '-',
    b(0o002) ? 'w' : '-',
    b(0o001) ? 'x' : '-',
  ].join('');
}

export function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'Ko', 'Mo', 'Go'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

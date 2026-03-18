'use strict';

const MSG_TYPES = {
  // Client -> Server
  PTY_INPUT:  'PTY_INPUT',
  PTY_RESIZE: 'PTY_RESIZE',
  FS_SCAN:    'FS_SCAN',

  // Server -> Client
  PTY_OUTPUT: 'PTY_OUTPUT',
  FS_TREE:    'FS_TREE',
  FS_ADD:     'FS_ADD',
  FS_REMOVE:  'FS_REMOVE',
  FS_CHANGE:  'FS_CHANGE',
  CWD_CHANGE: 'CWD_CHANGE',
  ERROR:      'ERROR',
};

module.exports = { MSG_TYPES };

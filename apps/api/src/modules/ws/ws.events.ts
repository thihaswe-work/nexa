export const WsEvent = {
  // Connection lifecycle
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',

  // Presence
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_STATUS: 'user:status',

  // Typing
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // Message delivery
  MESSAGE_SENT: 'message:sent',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_READ: 'message:read',
  MESSAGE_STATUS: 'message:status',

  // Read receipts
  CONVERSATION_READ: 'conversation:read',

  // Chat events
  CHAT_MESSAGE_CREATED: 'chat:message:created',
  CHAT_MESSAGE_UPDATED: 'chat:message:updated',
  CHAT_MESSAGE_DELETED: 'chat:message:deleted',
  CHAT_REACTION_ADDED: 'chat:reaction:added',
  CHAT_REACTION_REMOVED: 'chat:reaction:removed',
  CHAT_CONVERSATION_CREATED: 'chat:conversation:created',
  CHAT_NEW_MESSAGE: 'chat:new:message',

  // Error
  ERROR: 'error',
} as const;

export const WsRoom = {
  user(userId: string): string {
    return `user:${userId}`;
  },
  conversation(conversationId: string): string {
    return `conversation:${conversationId}`;
  },
} as const;

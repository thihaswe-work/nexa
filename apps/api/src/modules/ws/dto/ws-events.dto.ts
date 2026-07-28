export interface TypingEvent {
  conversationId: string;
  userId: string;
}

export interface MessageDeliveredEvent {
  messageId: string;
  conversationId: string;
  deliveredAt: string;
}

export interface MessageReadEvent {
  conversationId: string;
  messageIds: string[];
  readAt: string;
}

export interface MessageStatusEvent {
  messageId: string;
  conversationId: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: string;
}

export interface ConversationReadEvent {
  conversationId: string;
  lastReadAt: string;
}

export interface UserStatusEvent {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeenAt?: string;
}

export interface ErrorEvent {
  code: string;
  message: string;
}

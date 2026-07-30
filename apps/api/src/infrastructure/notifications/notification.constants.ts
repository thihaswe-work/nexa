export const QUEUES = {
  MESSAGE: 'notifications.message',
  FRIEND_REQUEST: 'notifications.friend-request',
  NEARBY_INVITE: 'notifications.nearby-invite',
  ANNOUNCEMENT: 'notifications.announcement',
} as const;

export const JOBS = {
  SEND_MESSAGE_PUSH: 'send-message-push',
  SEND_FRIEND_REQUEST_PUSH: 'send-friend-request-push',
  SEND_NEARBY_INVITE_PUSH: 'send-nearby-invite-push',
  SEND_ANNOUNCEMENT_PUSH: 'send-announcement-push',
} as const;

export const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: {
    type: 'exponential' as const,
    delay: 5000,
  },
  removeOnComplete: 100,
  removeOnFail: 50,
};

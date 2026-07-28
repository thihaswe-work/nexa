import { Prisma } from '@prisma/client';

type PrismaModelNames = Prisma.ModelName;

// Models that support soft delete
const SOFT_DELETE_MODELS: PrismaModelNames[] = [
  'User',
  'Profile',
  'FriendRequest',
  'Friendship',
  'Conversation',
  'Message',
  'MessageAttachment',
  'Notification',
  'Device',
  'RefreshToken',
  'Report',
  'Block',
  'LocationHistory',
];

// Actions where soft delete should be intercepted
const MODIFY_ACTIONS = ['findUnique', 'findFirst', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate'];

export function softDeleteMiddleware(): Prisma.Middleware {
  return async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<any>,
  ) => {
    const model = params.model as PrismaModelNames;

    if (!SOFT_DELETE_MODELS.includes(model)) {
      return next(params);
    }

    // Intercept delete → set deletedAt
    if (params.action === 'delete') {
      params.action = 'update';
      params.args['data'] = { deletedAt: new Date() };
    }

    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      if (params.args.data) {
        params.args.data['deletedAt'] = new Date();
      } else {
        params.args['data'] = { deletedAt: new Date() };
      }
    }

    // Intercept read queries → exclude soft-deleted records
    if (params.action === 'findUnique') {
      params.action = 'findFirst';
      params.args.where['deletedAt'] = params.args.where['deletedAt'] ?? null;
    }

    if (params.action === 'findFirst') {
      params.args.where['deletedAt'] = params.args.where['deletedAt'] ?? null;
    }

    if (params.action === 'findMany') {
      if (params.args.where) {
        params.args.where['deletedAt'] = params.args.where['deletedAt'] ?? null;
      } else {
        params.args['where'] = { deletedAt: null };
      }
    }

    if (params.action === 'count') {
      if (params.args.where) {
        params.args.where['deletedAt'] = params.args.where['deletedAt'] ?? null;
      } else {
        params.args['where'] = { deletedAt: null };
      }
    }

    return next(params);
  };
}

import { withAuth } from 'next-auth/middleware';
import { Role } from '@/types/role';

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      const pathname = req.nextUrl.pathname;

      if (pathname === '/login' || pathname.startsWith('/api/auth')) {
        return true;
      }

      if (!token) return false;

      const role = token.role as string;
      const allowedRoles = Object.values(Role) as string[];

      if (!allowedRoles.includes(role)) return false;

      return true;
    },
  },
});

export const config = {
  matcher: ['/dashboard/:path*'],
};

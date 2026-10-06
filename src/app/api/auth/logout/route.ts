import { ok, route } from '@/lib/api';
import { checkOrigin, endSession } from '@/lib/session';
export const POST = route('auth.logout', async (request: Request) => {
  checkOrigin(request);
  await endSession();
  return ok({ success: true });
});

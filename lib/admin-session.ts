import { getAuthSession, isAdminSession } from "@/lib/auth";

export async function isAdminModeEnabled() {
  const session = await getAuthSession();
  return isAdminSession(session);
}

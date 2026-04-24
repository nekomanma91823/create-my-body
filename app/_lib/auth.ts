import { auth } from "@/auth";

export interface AuthUser {
  email: string;
  name?: string;
  image?: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  return {
    email: session.user.email,
    name: session.user.name ?? undefined,
    image: session.user.image ?? undefined,
  };
}

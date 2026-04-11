import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/");
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}

export function isAdmin(role?: string) {
  return role === "ADMIN";
}

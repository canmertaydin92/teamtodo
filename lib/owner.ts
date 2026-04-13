export const OWNER_EMAIL = process.env.OWNER_EMAIL ?? "canmertaydin1992@gmail.com";

export function isOwner(email?: string | null) {
  return email === OWNER_EMAIL;
}

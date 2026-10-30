import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import argon2 from "argon2";
export const randomToken = () => randomBytes(32).toString("base64url");
// SHA-256 é apropriado aqui para segredos aleatórios de 256 bits; senhas usam Argon2id.
export const tokenHash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const hashPassword = (password: string) =>
  argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
export const verifyPassword = (hash: string, password: string) =>
  argon2.verify(hash, password);
export function issueCsrf(secret: string) {
  const nonce = randomToken();
  return (
    nonce + "." + createHmac("sha256", secret).update(nonce).digest("base64url")
  );
}
export function validCsrf(cookie: unknown, header: unknown, secret: string) {
  if (
    typeof cookie !== "string" ||
    typeof header !== "string" ||
    cookie.length > 150 ||
    cookie !== header
  )
    return false;
  const [nonce, signature, ...rest] = cookie.split(".");
  if (!nonce || !signature || rest.length) return false;
  const expected = createHmac("sha256", secret)
    .update(nonce)
    .digest("base64url");
  const a = Buffer.from(signature),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export const publicUser = (u: {
  id: string;
  username: string;
  role: "ADMIN" | "PLAYER";
  canCreateCampaigns: boolean;
}) => ({
  id: u.id,
  username: u.username,
  role: u.role,
  canCreateCampaigns: u.canCreateCampaigns,
});

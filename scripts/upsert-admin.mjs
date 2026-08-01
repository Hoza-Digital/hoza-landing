import { randomBytes, scryptSync } from "node:crypto";

const email = process.env.ADMIN_EMAIL_INPUT?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD_INPUT;
const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
const backendSecret = process.env.SUPABASE_BACKEND_SECRET;

if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
  throw new Error("Set ADMIN_EMAIL_INPUT to a valid email address.");
}

if (!password || password.length < 8) {
  throw new Error("Set ADMIN_PASSWORD_INPUT to a password with at least 8 characters.");
}

if (!supabaseUrl || !publishableKey || !backendSecret) {
  throw new Error(
    "Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_BACKEND_SECRET.",
  );
}

const salt = randomBytes(16);
const passwordHash = scryptSync(password, salt, 64);
const encodedPassword = `scrypt$${salt.toString("base64url")}$${passwordHash.toString("base64url")}`;

const response = await fetch(`${supabaseUrl}/rest/v1/rpc/hoza_admin_upsert_user`, {
  method: "POST",
  headers: {
    apikey: publishableKey,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    p_backend_secret: backendSecret,
    p_email: email,
    p_password_hash: encodedPassword,
  }),
});

if (!response.ok) {
  throw new Error(`Supabase admin update failed with HTTP ${response.status}.`);
}

console.log(`Admin user saved: ${email}`);

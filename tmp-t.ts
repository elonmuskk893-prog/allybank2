import { createClient } from "@supabase/supabase-js";
const a = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const mode = process.argv[2];
const email = "verifytest-tmp@example.com";
if (mode === "create") {
  const { data, error } = await a.auth.admin.createUser({ email, password: "TestPass#2026x", email_confirm: true });
  if (error) throw error;
  await a.from("users").update({ email_verified_at: null, status: "active" }).eq("id", data.user.id);
  console.log("created");
} else {
  const { data } = await a.from("users").select("id").eq("email", email).maybeSingle();
  if (data) { await a.auth.admin.deleteUser(data.id); console.log("deleted"); }
}

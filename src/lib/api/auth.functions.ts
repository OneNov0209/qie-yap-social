import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

function buildMessage(nonce: string) {
  return `Sign to login to QIE Yap: ${nonce}`;
}

/** Step 1: client requests a nonce for the wallet to sign. */
export const requestLoginNonce = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ address: AddressSchema }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const address = data.address.toLowerCase();
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    const { error } = await supabaseAdmin
      .from("login_nonces")
      .upsert({ address, nonce, expires_at: new Date(Date.now() + 10 * 60_000).toISOString() });
    if (error) throw new Error(error.message);
    return { message: buildMessage(nonce), nonce };
  });

/**
 * Step 2: client returns the signature. Server verifies via EIP-191,
 * provisions a Supabase user if needed, and returns a one-time hashed token
 * the client uses with `supabase.auth.verifyOtp` to establish a session.
 */
export const verifyLoginSignature = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({
      address: AddressSchema,
      signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    const { verifyMessage } = await import("viem");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const address = data.address.toLowerCase();

    // 1) Look up the stored nonce
    const { data: row, error: nErr } = await supabaseAdmin
      .from("login_nonces")
      .select("nonce, expires_at")
      .eq("address", address)
      .maybeSingle();
    if (nErr) throw new Error(nErr.message);
    if (!row) throw new Error("No login challenge found. Request a new nonce.");
    if (new Date(row.expires_at).getTime() < Date.now()) {
      throw new Error("Login challenge expired. Try again.");
    }

    // 2) Verify the signature
    const ok = await verifyMessage({
      address: data.address as `0x${string}`,
      message: buildMessage(row.nonce),
      signature: data.signature as `0x${string}`,
    });
    if (!ok) throw new Error("Invalid signature");

    // burn the nonce
    await supabaseAdmin.from("login_nonces").delete().eq("address", address);

    // 3) Ensure a Supabase user exists for this wallet
    const email = `${address}@qieyap.wallet`;

    // Try to find an existing profile first to grab the user id
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles").select("id").eq("address", address).maybeSingle();

    let userId = existingProfile?.id as string | undefined;

    if (!userId) {
      const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { wallet_address: data.address },
      });
      if (cErr || !created.user) {
        // Maybe the auth user exists without a profile — list and find it
        const { data: list } = await supabaseAdmin.auth.admin.listUsers();
        const found = list.users.find((u) => u.email?.toLowerCase() === email);
        if (!found) throw new Error(cErr?.message ?? "Failed to provision user");
        userId = found.id;
      } else {
        userId = created.user.id;
      }

      // Insert a default profile
      const shortName = `${data.address.slice(0, 6)}…${data.address.slice(-4)}`;
      const username = `qie_${address.slice(2, 8)}`;
      await supabaseAdmin.from("profiles").insert({
        id: userId,
        address: data.address,
        username,
        display_name: shortName,
        bio: "",
        avatar_seed: data.address,
      });
    }

    // 4) Issue a magic-link hashed token the client can redeem for a session
    const { data: link, error: lErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (lErr || !link?.properties?.hashed_token) {
      throw new Error(lErr?.message ?? "Failed to issue session token");
    }

    return {
      email,
      hashedToken: link.properties.hashed_token,
      userId,
      address: data.address,
    };
  });

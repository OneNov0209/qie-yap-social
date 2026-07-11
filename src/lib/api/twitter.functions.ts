import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

function base64url(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randB64(len = 48) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

/** Starts the Twitter OAuth 2.0 PKCE flow. Returns the URL to redirect the user to. */
export const startTwitterOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ walletAddress: AddressSchema, origin: z.string().url() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const clientId = process.env.TWITTER_CLIENT_ID;
    if (!clientId) throw new Error("TWITTER_CLIENT_ID is not configured");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Enforce strict 1:1 upfront: does this wallet already have a link?
    const wallet = data.walletAddress.toLowerCase();
    const { data: existing } = await supabaseAdmin
      .from("wallet_twitter_links")
      .select("twitter_username, wallet_address")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) {
      throw new Error(
        `Your account is already linked to X @${existing.twitter_username}.`,
      );
    }

    const state = randB64(24);
    const verifier = randB64(48);
    const challenge = await pkceChallenge(verifier);

    const { error } = await supabaseAdmin.from("twitter_oauth_states").insert({
      state,
      code_verifier: verifier,
      wallet_address: wallet,
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    });
    if (error) throw new Error(error.message);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: `${data.origin}/api/public/twitter/callback`,
      scope: "tweet.read users.read offline.access",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    return { url: `https://twitter.com/i/oauth2/authorize?${params.toString()}` };
  });

/** Returns the current user's Twitter link, if any. */
export const getMyTwitterLink = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data } = await supabase
      .from("wallet_twitter_links")
      .select("twitter_id, twitter_username, wallet_address, linked_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data;
  });

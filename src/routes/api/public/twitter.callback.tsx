import { createFileRoute } from "@tanstack/react-router";

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { location: url } });
}

function errorRedirect(origin: string, msg: string) {
  return redirect(`${origin}/?twitter_error=${encodeURIComponent(msg)}`);
}

export const Route = createFileRoute("/api/public/twitter/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = `${url.protocol}//${url.host}`;
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const err = url.searchParams.get("error");
        if (err) return errorRedirect(origin, err);
        if (!code || !state) return errorRedirect(origin, "missing_code_or_state");

        const clientId = process.env.TWITTER_CLIENT_ID;
        const clientSecret = process.env.TWITTER_CLIENT_SECRET;
        if (!clientId || !clientSecret) return errorRedirect(origin, "twitter_not_configured");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Load & burn the state row
        const { data: row } = await supabaseAdmin
          .from("twitter_oauth_states")
          .select("*")
          .eq("state", state)
          .maybeSingle();
        if (!row) return errorRedirect(origin, "invalid_state");
        await supabaseAdmin.from("twitter_oauth_states").delete().eq("state", state);
        if (new Date(row.expires_at).getTime() < Date.now()) {
          return errorRedirect(origin, "state_expired");
        }
        if (!row.wallet_address) return errorRedirect(origin, "missing_wallet");

        // Exchange code -> access token
        const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: `${origin}/api/public/twitter/callback`,
            code_verifier: row.code_verifier,
          }),
        });
        if (!tokenRes.ok) {
          const body = await tokenRes.text();
          console.error("twitter token exchange failed", body);
          return errorRedirect(origin, "token_exchange_failed");
        }
        const token = (await tokenRes.json()) as { access_token?: string };
        if (!token.access_token) return errorRedirect(origin, "no_access_token");

        // Fetch Twitter user identity
        const meRes = await fetch("https://api.twitter.com/2/users/me", {
          headers: { authorization: `Bearer ${token.access_token}` },
        });
        if (!meRes.ok) return errorRedirect(origin, "twitter_me_failed");
        const me = (await meRes.json()) as { data?: { id: string; username: string } };
        if (!me.data?.id) return errorRedirect(origin, "no_twitter_user");

        const twitterId = me.data.id;
        const twitterUsername = me.data.username;
        const wallet = row.wallet_address;

        // Strict 1:1 enforcement (against existing bindings)
        const { data: existingLink } = await supabaseAdmin
          .from("wallet_twitter_links")
          .select("twitter_id, twitter_username, wallet_address, user_id")
          .or(`twitter_id.eq.${twitterId},wallet_address.eq.${wallet}`);
        if (existingLink && existingLink.length > 0) {
          const conflict = existingLink[0];
          if (conflict.twitter_id === twitterId && conflict.wallet_address !== wallet) {
            return errorRedirect(
              origin,
              `X account @${twitterUsername} is already bound to wallet ${conflict.wallet_address.slice(0, 6)}…${conflict.wallet_address.slice(-4)}`,
            );
          }
          if (conflict.wallet_address === wallet && conflict.twitter_id !== twitterId) {
            return errorRedirect(
              origin,
              `This wallet is already bound to X @${conflict.twitter_username}`,
            );
          }
        }

        // Look up the user_id for this wallet (from profiles.address)
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .ilike("address", wallet)
          .maybeSingle();
        if (!profile) return errorRedirect(origin, "wallet_not_registered");

        // Insert the immutable binding
        const { error: insErr } = await supabaseAdmin.from("wallet_twitter_links").insert({
          twitter_id: twitterId,
          twitter_username: twitterUsername,
          wallet_address: wallet,
          user_id: profile.id,
        });
        if (insErr) return errorRedirect(origin, insErr.message);

        // Also mirror the handle on the profile for display
        await supabaseAdmin
          .from("profiles")
          .update({ username: twitterUsername })
          .eq("id", profile.id);

        return redirect(`${origin}/?twitter_linked=${encodeURIComponent(twitterUsername)}`);
      },
    },
  },
});

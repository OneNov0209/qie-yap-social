# QIE Yap — Twitter binding, on-chain yaps, dark mode & Phase 2

## 1. Twitter login (per-user OAuth 2.0 PKCE)

- Lovable X connector = workspace-scoped, tidak cocok untuk mengikat tiap end-user. **Pivot ke custom Twitter OAuth**.
- Kamu buat Twitter App di developer.x.com → dapatkan **Client ID + Client Secret**. Saya minta via `add_secret` sebagai `TWITTER_CLIENT_ID` & `TWITTER_CLIENT_SECRET`.
- Callback URL yang harus kamu daftarkan: `https://<your-published-domain>/api/public/twitter/callback` (dan preview URL saat testing).
- Flow: user klik "Connect X" → server fn `startTwitterOAuth` (PKCE, simpan `code_verifier` + `state` di tabel `twitter_oauth_states`) → redirect ke Twitter → callback route `/api/public/twitter/callback` menukar code jadi access_token → ambil `id` + `username` user Twitter → simpan pending link → user diminta **sign wallet** → binding tersimpan.

## 2. Registration flow: Twitter + Wallet (strict 1:1 immutable)

Tabel baru `wallet_twitter_links`:
- `twitter_id` (PK, unique), `twitter_username`, `wallet_address` (unique), `user_id` (fk auth.users), `linked_at`, `tx_hash` (opsional bukti on-chain).

Aturan:
- Satu `twitter_id` hanya boleh punya SATU `wallet_address`. Sekali tersimpan tidak bisa diubah.
- Registrasi:
  1. User login Twitter (OAuth) → dapat `twitter_id`.
  2. Cek: kalau `twitter_id` sudah punya wallet terdaftar → **hanya wallet itu** yang boleh sign-in. Wallet lain ditolak dengan pesan "This X account is already bound to 0xabc…def".
  3. User connect wallet → sign message: `Bind wallet {addr} to X @{username} on QIE Yap: {nonce}`.
  4. Server verifikasi signature (viem `verifyMessage`), lalu insert baris final. Constraint DB mencegah race (unique on twitter_id + unique on wallet_address).

## 3. Yap on-chain (hash anchor)

Kontrak `QieYap.sol` sederhana yang saya sediakan buat kamu deploy via Remix:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract QieYap {
    event Yapped(address indexed author, bytes32 indexed contentHash, uint256 timestamp, string cid);
    function yap(bytes32 contentHash, string calldata cid) external {
        emit Yapped(msg.sender, contentHash, block.timestamp, cid);
    }
}
```

- Deploy di QIE chain (1990). Kamu paste alamat kontraknya nanti; saya simpan di `.env` sebagai `VITE_QIE_YAP_CONTRACT`.
- Saat user post: hitung `keccak256(content)` client-side → user sign tx `yap(hash, "")` → simpan `content` + `tx_hash` + `content_hash` di DB. Kolom baru di `posts`: `tx_hash`, `content_hash`, `on_chain` (bool).
- Kalau tx pending/reject: post disimpan sebagai draft/off-chain (badge "off-chain").

## 4. Phase 2 kontrak (Tip, Super Yap, Boost)

- `tipPost(postId, amount)` → panggil contract Tip `0x1276…` (native QIE `value`), lalu simpan record di tabel `tips` + trigger notifikasi.
- `superYap(postId)` → contract `0x9B0D…`, 10 QIE. Update `is_super_yap = true` setelah tx confirmed.
- `boostPost(postId, hours, amount)` → contract `0xf346…`. Update `is_boosted`, `boost_expires_at`.

Karena saya belum punya ABI final ketiga kontrak, saya akan pakai **ABI minimal yang masuk akal** (single payable function `tip(address to)`, `superYap(bytes32 postId)`, `boost(bytes32 postId, uint256 hours)`). Kalau ABI aslinya beda, kamu paste ABI-nya dan saya adjust.

## 5. Notification triggers

Postgres trigger:
- `AFTER INSERT ON likes` → insert notification untuk author post.
- `AFTER INSERT ON follows` → insert notification untuk followee.
- `AFTER INSERT ON posts WHERE reply_to IS NOT NULL` → notif ke author parent.
- `AFTER INSERT ON tips` → notif tip.

## 6. Dark / Light mode

- `next-themes` sudah ada di deps. Wrap root dengan `ThemeProvider`, tambah toggle button di header (icon sun/moon). Token dark mode di `styles.css` sudah lengkap.
- Persist di `localStorage`, default = light (sesuai preferensi kamu sebelumnya).

## 7. Responsive (desktop + mobile)

- Header sudah punya bottom-nav mobile. Saya audit ulang: composer, post card, profile grid, leaderboard tabel → pastikan `min-w-0` + `truncate` di area teks, tabel jadi card list di `<sm`.

## 8. File yang berubah / baru

**Migration** (1 file): tambah kolom `posts.tx_hash`, `content_hash`, `on_chain`; buat tabel `wallet_twitter_links`, `twitter_oauth_states`, `tips`; tambah trigger notifikasi; GRANT + RLS.

**Server code:**
- `src/lib/api/twitter.functions.ts` (start + finish OAuth, bind wallet)
- `src/routes/api/public/twitter.callback.ts` (OAuth callback)
- `src/lib/api/tips.functions.ts` (record tip setelah tx confirmed)
- `src/lib/qie-contracts.ts` (viem write helpers untuk yap/tip/superYap/boost)

**UI:**
- `src/components/theme-toggle.tsx` + `ThemeProvider` di `__root.tsx`
- `src/components/register-flow.tsx` (modal: Step 1 X login → Step 2 wallet sign)
- Update `composer.tsx` → sign yap tx sebelum insert DB
- Update `post-card.tsx` → tombol Tip / Super Yap / Boost memanggil viem write, tampilkan link explorer tx

**Docs:** `docs/QieYap.sol` — Solidity contract untuk deploy via Remix, plus panduan singkat.

## Yang saya butuhkan darimu

1. Buat Twitter Developer App (OAuth 2.0, User authentication, scopes: `tweet.read users.read offline.access`). Setelah selesai, saya munculkan form aman untuk paste **Client ID** + **Client Secret**.
2. Deploy `QieYap.sol` via Remix di chain 1990, lalu kirim alamat kontraknya.
3. (Opsional) Kalau ABI kontrak Tip/SuperYap/Boost yang sudah ter-deploy berbeda, kirim ABI-nya.

Konfirmasi lanjut? Atau ada yang mau diubah dari plan ini?

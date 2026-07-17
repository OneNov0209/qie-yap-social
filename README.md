# QIE Yap — Social dApp on QIE Mainnet

QIE Yap is a decentralized social platform built on the **QIE blockchain**. Users can post "Yaps", send on-chain **Tips**, create **Super Yaps**, and **Boost** posts — all powered by smart contracts and a Supabase backend.

---

## 🚀 Live Demo

- **Website:** [https://qie.yap.onenov.xyz/](https://qie.yap.onenov.xyz/)
- **Blockchain Explorer:** [https://qie.explorer.onenov.xyz](https://qie.explorer.onenov.xyz)

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| **Blockchain** | QIE Mainnet (Chain ID: 1990) |
| **Smart Contract** | Solidity ^0.8.24 (Deployed via Remix) |
| **Frontend** | React + Vite (Lovable-generated) |
| **Backend / DB** | Supabase (PostgreSQL) |
| **Hosting** | Vercel |
| **Wallet Integration** | MetaMask / QIE Wallet (viem) |

---

## 🔗 Smart Contract (QIE Mainnet)

- **Network:** QIE Mainnet (Chain ID: 1990)
- **RPC URL:** `https://rpc-evm.qie.onenov.xyz`
- **Explorer:** `https://qie.explorer.onenov.xyz`
- **Contract Address:** `0x2A433A09e0Ce2766affb89E774BbdC3c29044D0a`
- **Treasury / Dev Wallet:** `0x109b18b9cb9ec1C9CED114A13FfA86F8c13CFa7a`

### Contract Features

| Feature | Details |
|---------|---------|
| **Tip** | 2% platform fee → `devWallet`, 98% → recipient |
| **Super Yap** | 50% burned, 50% → `treasury` |
| **Boost** | 100% → `treasury` |
| **Yap** | Emits on-chain event hash (no content stored) |

---

## 🗄️ Supabase Database

- **Project URL:** `https://lwthbqulodmpkwygacbz.supabase.co`
- **Project ID:** `lwthbqulodmpkwygacbz`
- **Publishable Key (anon):**
```

sb_publishable_ypmwDTbkmDtz29_tQhq2pA_YDV7uYI0

```

### Key Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (linked to `auth.users`) |
| `posts` | Yap posts (content, tx_hash, boost info) |
| `notifications` | Like, follow, tip, reply notifications |
| `likes` | User likes on posts |
| `follows` | User follows |

---

## ⚙️ Environment Variables (Vercel)

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://lwthbqulodmpkwygacbz.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_ypmwDTbkmDtz29_tQhq2pA_YDV7uYI0` |
| `VITE_SUPABASE_PROJECT_ID` | `lwthbqulodmpkwygacbz` |
| `SUPABASE_URL` | `https://lwthbqulodmpkwygacbz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Keep secret! Store in Vercel only)* |
| `VITE_QIE_YAP_CONTRACT` | `0x2A433A09e0Ce2766affb89E774BbdC3c29044D0a` |

---

## 🛠️ Database Setup (SQL Migrations)

Run these commands in Supabase SQL Editor to set up the required tables and permissions:

```sql
-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  address text NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  bio text DEFAULT '',
  avatar_seed text NOT NULL,
  is_validator boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_super_yap boolean DEFAULT false,
  is_boosted boolean DEFAULT false,
  boost_expires_at timestamptz,
  tx_hash text,
  content_hash text,
  on_chain boolean DEFAULT false,
  reply_to uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('follow','like','reply','tip')),
  from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  amount numeric,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Likes table
CREATE TABLE IF NOT EXISTS public.likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT INSERT, DELETE ON public.likes TO authenticated;
GRANT SELECT ON public.likes TO authenticated;
```

---

✅ Features

· ✅ Connect wallet (MetaMask / QIE Wallet)
· ✅ Display QIE balance
· ✅ Post Yaps with Super Yap and Boost options
· ✅ On-chain + off-chain post storage
· ✅ Like posts
· ✅ Send QIE tips to post authors
· ✅ Boost posts (for post owners)
· ✅ Real-time feed updates via Supabase Realtime

---

🧪 Local Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/OneNov0209/qie-yap-social.git
cd qie-yap-social
bun install   # or npm install
```

Create a .env file with the variables listed above, then run:

```bash
bun run dev
```

---

🚀 Deployment

The project is deployed on Vercel via GitHub integration.

To redeploy manually:

1. Push changes to the main branch.
2. Go to Vercel Dashboard → Project → Deployments.
3. Click Redeploy (ensure "Use existing build cache" is unchecked).

---

🔐 Security Notes

· Never commit .env or SUPABASE_SERVICE_ROLE_KEY to GitHub.
· All sensitive keys are stored only in Vercel Environment Variables.
· Supabase Row Level Security (RLS) is enabled for all tables.

---

📄 License

MIT License — feel free to use and modify this project for your own purposes.

---

🎯 Acknowledgments

Built for the QIE Hackathon 3rd Edition (2026).
Special thanks to the QIE ecosystem and Lovable for the frontend scaffolding.

---

Happy Yapping! 🚀✨

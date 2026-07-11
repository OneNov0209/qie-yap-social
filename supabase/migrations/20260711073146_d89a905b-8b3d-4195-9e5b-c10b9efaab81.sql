
-- 1. Extend posts with on-chain fields
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS tx_hash text,
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS on_chain boolean NOT NULL DEFAULT false;

-- 2. wallet_twitter_links (strict 1:1 immutable)
CREATE TABLE IF NOT EXISTS public.wallet_twitter_links (
  twitter_id       text PRIMARY KEY,
  twitter_username text NOT NULL,
  wallet_address   text NOT NULL UNIQUE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tx_hash          text,
  linked_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS wallet_twitter_links_user_id_key ON public.wallet_twitter_links(user_id);

GRANT SELECT ON public.wallet_twitter_links TO anon, authenticated;
GRANT INSERT ON public.wallet_twitter_links TO authenticated;
GRANT ALL ON public.wallet_twitter_links TO service_role;
ALTER TABLE public.wallet_twitter_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Links are public" ON public.wallet_twitter_links FOR SELECT USING (true);
CREATE POLICY "User inserts own link" ON public.wallet_twitter_links FOR INSERT WITH CHECK (auth.uid() = user_id);
-- No UPDATE / DELETE policies = immutable

-- 3. twitter_oauth_states (server-only)
CREATE TABLE IF NOT EXISTS public.twitter_oauth_states (
  state          text PRIMARY KEY,
  code_verifier  text NOT NULL,
  wallet_address text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL DEFAULT (now() + interval '15 minutes')
);
GRANT ALL ON public.twitter_oauth_states TO service_role;
ALTER TABLE public.twitter_oauth_states ENABLE ROW LEVEL SECURITY;
-- No policies → clients cannot read/write; only service_role via admin client

-- 4. tips
CREATE TABLE IF NOT EXISTS public.tips (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  from_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        numeric NOT NULL CHECK (amount > 0),
  tx_hash       text NOT NULL UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tips_post_id_idx ON public.tips(post_id);
CREATE INDEX IF NOT EXISTS tips_to_user_id_idx ON public.tips(to_user_id);

GRANT SELECT ON public.tips TO anon, authenticated;
GRANT INSERT ON public.tips TO authenticated;
GRANT ALL ON public.tips TO service_role;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tips are public" ON public.tips FOR SELECT USING (true);
CREATE POLICY "User sends tips as self" ON public.tips FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- 5. Notification triggers
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_author uuid;
BEGIN
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
  IF post_author IS NULL OR post_author = NEW.user_id THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, type, from_user_id, post_id)
  VALUES (post_author, 'like', NEW.user_id, NEW.post_id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_on_like ON public.likes;
CREATE TRIGGER trg_notify_on_like AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.follower_id = NEW.following_id THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, type, from_user_id)
  VALUES (NEW.following_id, 'follow', NEW.follower_id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_on_follow ON public.follows;
CREATE TRIGGER trg_notify_on_follow AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

CREATE OR REPLACE FUNCTION public.notify_on_reply()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE parent_author uuid;
BEGIN
  IF NEW.reply_to IS NULL THEN RETURN NEW; END IF;
  SELECT author_id INTO parent_author FROM public.posts WHERE id = NEW.reply_to;
  IF parent_author IS NULL OR parent_author = NEW.author_id THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, type, from_user_id, post_id)
  VALUES (parent_author, 'reply', NEW.author_id, NEW.id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_on_reply ON public.posts;
CREATE TRIGGER trg_notify_on_reply AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_reply();

CREATE OR REPLACE FUNCTION public.notify_on_tip()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.from_user_id = NEW.to_user_id THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, type, from_user_id, post_id, amount)
  VALUES (NEW.to_user_id, 'tip', NEW.from_user_id, NEW.post_id, NEW.amount);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_on_tip ON public.tips;
CREATE TRIGGER trg_notify_on_tip AFTER INSERT ON public.tips
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_tip();

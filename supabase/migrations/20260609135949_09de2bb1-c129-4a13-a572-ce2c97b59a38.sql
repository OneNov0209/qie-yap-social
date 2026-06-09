
-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  address text NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  bio text DEFAULT '',
  avatar_seed text NOT NULL,
  is_validator boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profiles_address_idx ON public.profiles(lower(address));
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- posts
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 280),
  is_super_yap boolean NOT NULL DEFAULT false,
  is_boosted boolean NOT NULL DEFAULT false,
  boost_expires_at timestamptz,
  reply_to uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX posts_author_idx ON public.posts(author_id);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are public" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users insert own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users delete own posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- likes
CREATE TABLE public.likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT ON public.likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are public" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users like as self" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike own" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- follows
CREATE TABLE public.follows (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
GRANT SELECT ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are public" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users follow as self" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users unfollow as self" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('follow','like','reply','tip')),
  from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  amount numeric,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- login nonces (server-only)
CREATE TABLE public.login_nonces (
  address text PRIMARY KEY,
  nonce text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);
GRANT ALL ON public.login_nonces TO service_role;
ALTER TABLE public.login_nonces ENABLE ROW LEVEL SECURITY;

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

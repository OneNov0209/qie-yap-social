import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Wallet, Image, User, Lock } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — QIE Yap" },
      { name: "description", content: "Create your QIE Yap identity." },
    ],
  }),
  component: RegisterPage,
});

// ✅ Fungsi hash bawaan browser (SHA-256)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function RegisterPage() {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (!window.ethereum) return;
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
      }
    } catch (error) {
      console.error("Wallet check error:", error);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
      setIsConnected(true);
      toast.success("Wallet connected!");
    } catch (error) {
      console.error("Connect error:", error);
    }
  };

  const handleRegister = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Cek apakah username sudah dipakai
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .maybeSingle();

      if (existingUser) {
        toast.error("Username already taken. Please choose another.");
        setIsLoading(false);
        return;
      }

      // 2. Hash password menggunakan Web Crypto API (bawaan browser)
      const hashedPassword = await hashPassword(password);

      // 3. Simpan data profil ke Supabase
      const { data: profile, error } = await supabase
        .from("profiles")
        .insert({
          address: walletAddress,
          username: username,
          display_name: username,
          avatar_seed: avatarUrl || walletAddress,
          password_hash: hashedPassword,
          is_validator: false,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Profile created successfully!");
      
      // 4. Redirect ke halaman login
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 1500);

    } catch (error: any) {
      console.error("Register error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-display text-2xl font-bold">Create Your Identity</h1>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-6">
          <div className="space-y-4">
            {/* Kolom 1: Wallet Otomatis */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Wallet Address</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <Wallet className="size-4 text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground truncate">
                    {walletAddress || "Not connected"}
                  </span>
                </div>
                {!isConnected && (
                  <Button onClick={connectWallet} variant="outline" size="sm">
                    Connect
                  </Button>
                )}
              </div>
            </div>

            {/* Kolom 2: Foto Profil via Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Avatar Image URL</label>
              <div className="flex items-center rounded-lg border border-border px-3">
                <Image className="size-4 text-muted-foreground mr-2" />
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-transparent py-2 text-sm outline-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">Paste a direct image link (JPEG/PNG)</p>
            </div>

            {/* Kolom 3: Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <div className="flex items-center rounded-lg border border-border px-3">
                <User className="size-4 text-muted-foreground mr-2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="Choose a unique username"
                  className="w-full bg-transparent py-2 text-sm outline-none"
                />
              </div>
            </div>

            {/* Kolom 4: Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="flex items-center rounded-lg border border-border px-3">
                <Lock className="size-4 text-muted-foreground mr-2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-transparent py-2 text-sm outline-none"
                />
              </div>
            </div>

            {/* Tombol Register */}
            <Button
              onClick={handleRegister}
              disabled={isLoading || !isConnected || !username || !password}
              className="w-full bg-brand hover:bg-brand/90 mt-4"
            >
              {isLoading ? "Registering..." : "Register"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

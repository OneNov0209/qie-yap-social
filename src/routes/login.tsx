import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getQieBalance } from "@/lib/qie-chain";
import { ArrowLeft, User, Lock, Wallet } from "lucide-react";
import bcrypt from "bcryptjs";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — QIE Yap" },
      { name: "description", content: "Login to your QIE Yap account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (!window.ethereum) return;
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
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
      toast.success("Wallet connected!");
    } catch (error) {
      console.error("Connect error:", error);
    }
  };

  const handleLogin = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter username and password");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Cari user berdasarkan username
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (error) throw error;
      if (!profiles) {
        toast.error("Username not found. Please register first.");
        setIsLoading(false);
        return;
      }

      // 2. Verifikasi password (hash)
      const isValid = bcrypt.compareSync(password, profiles.password_hash);
      if (!isValid) {
        toast.error("Incorrect password");
        setIsLoading(false);
        return;
      }

      // 3. Verifikasi wallet cocok
      if (profiles.address !== walletAddress) {
        toast.error("This wallet does not match the registered account");
        setIsLoading(false);
        return;
      }

      // 4. Login sukses! Simpan session user
      await supabase.auth.signInWithPassword({
        email: `${walletAddress}@qie.yap`,
        password: walletAddress,
      });

      toast.success("Login successful!");
      navigate({ to: "/" });

    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed");
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
          <h1 className="font-display text-2xl font-bold">Login</h1>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-6">
          <div className="space-y-4">
            {/* Wallet Connection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Wallet Address</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <Wallet className="size-4 text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground truncate">
                    {walletAddress || "Not connected"}
                  </span>
                </div>
                {!walletAddress && (
                  <Button onClick={connectWallet} variant="outline" size="sm">
                    Connect
                  </Button>
                )}
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <div className="flex items-center rounded-lg border border-border px-3">
                <User className="size-4 text-muted-foreground mr-2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="Enter your username"
                  className="w-full bg-transparent py-2 text-sm outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="flex items-center rounded-lg border border-border px-3">
                <Lock className="size-4 text-muted-foreground mr-2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent py-2 text-sm outline-none"
                />
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={isLoading || !walletAddress || !username || !password}
              className="w-full bg-brand hover:bg-brand/90 mt-4"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

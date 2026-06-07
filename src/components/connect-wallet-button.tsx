import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export function ConnectWalletButton() {
  const [open, setOpen] = useState(false);
  const { user, balance, connect, disconnect } = useAuth();

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="font-mono text-[11px] text-muted-foreground">
            {user.address.slice(0, 6)}…{user.address.slice(-4)}
          </span>
          <span className="text-xs font-semibold text-foreground">
            {balance.toFixed(2)} QIE
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            disconnect();
            toast("Wallet disconnected");
          }}
          className="rounded-full border-brand/30 text-brand hover:bg-brand-soft"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="rounded-full bg-brand px-5 text-primary-foreground hover:bg-brand/90 shadow-md shadow-brand/20"
      >
        Connect Wallet
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Connect a wallet</DialogTitle>
            <DialogDescription>
              Sign a message to log in to QIE Yap. No transaction, no gas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 pt-2">
            <button
              onClick={() => {
                connect("qie");
                setOpen(false);
                toast.success("Connected to QIE Wallet");
              }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-brand/40 hover:bg-brand-soft"
            >
              <img
                src="https://raw.githubusercontent.com/OneNov0209/logo/refs/heads/main/qie-logo.png"
                alt="QIE"
                className="size-9 rounded-lg"
              />
              <div>
                <div className="font-semibold">QIE Wallet</div>
                <div className="text-xs text-muted-foreground">Native ecosystem wallet</div>
              </div>
            </button>
            <button
              onClick={() => {
                connect("keplr");
                setOpen(false);
                toast.success("Connected to Keplr");
              }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-brand/40 hover:bg-brand-soft"
            >
              <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
                K
              </div>
              <div>
                <div className="font-semibold">Keplr</div>
                <div className="text-xs text-muted-foreground">Cosmos / IBC compatible</div>
              </div>
            </button>
          </div>
          <p className="pt-2 text-center text-[11px] text-muted-foreground">
            By connecting you agree to sign: <span className="font-mono">"Sign to login to QIE Yap"</span>
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

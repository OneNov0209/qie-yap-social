import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/add-qie-network")({
  head: () => ({
    meta: [
      { title: "Add QIE Network — QIE Yap" },
      { name: "description", content: "Add QIE Mainnet to your MetaMask wallet." },
    ],
  }),
  component: AddQieNetworkPage,
});

function AddQieNetworkPage() {
  const [isAdding, setIsAdding] = useState(false);

  const addQieNetwork = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected. Please install MetaMask.");
      return;
    }

    setIsAdding(true);
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x7C6", // 1990 dalam hex
          chainName: "QIE Mainnet",
          rpcUrls: ["https://rpc-evm.qie.onenov.xyz"],
          nativeCurrency: {
            name: "QIE",
            symbol: "QIE",
            decimals: 18,
          },
          blockExplorerUrls: ["https://qie.explorer.onenov.xyz"],
        }],
      });
      toast.success("QIE Mainnet added successfully!");
    } catch (error: any) {
      if (error.code === 4001) {
        toast.error("You rejected the request.");
      } else {
        toast.error("Failed to add QIE Mainnet. Please add it manually.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-12">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-display text-2xl font-bold">Add QIE Network</h1>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-6 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-brand/10">
            <PlusCircle className="size-8 text-brand" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Add QIE Mainnet to MetaMask</h2>
          <p className="text-muted-foreground mb-6">
            QIE Yap runs on QIE Mainnet (Chain ID: 1990).<br />
            Click the button below to add it to your wallet automatically.
          </p>
          <Button
            onClick={addQieNetwork}
            disabled={isAdding}
            className="bg-brand hover:bg-brand/90 w-full max-w-xs mx-auto"
          >
            {isAdding ? "Adding..." : "Add QIE Mainnet"}
          </Button>
        </div>
      </div>
    </div>
  );
}

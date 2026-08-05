import { createPublicClient, createWalletClient, defineChain, http, formatEther, parseEther, getContract, custom } from "viem";

export const QIE_CHAIN = defineChain({
  id: 1990,
  name: "QIE Mainnet",
  nativeCurrency: { name: "QIE", symbol: "QIE", decimals: 18 },
  rpcUrls: { 
    default: { 
      http: [
        "https://rpc-evm.qie.onenov.xyz",
        "https://rpc2mainnet.qie.digital",
        "https://rpc3mainnet.qie.digital"
      ] 
    } 
  },
  blockExplorers: { default: { name: "QIE Explorer", url: "https://qie.explorer.onenov.xyz" } },
});

const OFFICIAL_API = "https://mainnet.qie.digital/api/v2";
const PRIVATE_API = "https://api.qie.onenov.xyz";

export const qiePublicClient = createPublicClient({
  chain: QIE_CHAIN,
  transport: http(),
});

export async function getQieBalance(address: `0x${string}`): Promise<number> {
  const wei = await qiePublicClient.getBalance({ address });
  return parseFloat(formatEther(wei));
}

export type StakingBadge = "shrimp" | "fish" | "dolphin" | "shark" | "whale";
export function badgeFor(qie: number): StakingBadge {
  if (qie >= 100_000) return "whale";
  if (qie >= 10_000) return "shark";
  if (qie >= 1_000) return "dolphin";
  if (qie >= 100) return "fish";
  return "shrimp";
}

export async function getStakedQie(address: string): Promise<number | null> {
  try {
    const officialRes = await fetch(`${OFFICIAL_API}/addresses/${address}/coin-balance-history?limit=1`);
    if (officialRes.ok) {
      const data = await officialRes.json();
      if (data.items?.[0]?.value) {
        return Number(data.items[0].value) / 1e18;
      }
    }
    const privateRes = await fetch(`${PRIVATE_API}/cosmos/staking/v1beta1/delegations/${address}`);
    if (privateRes.ok) {
      const data = await privateRes.json();
      const total = (data.delegation_responses ?? []).reduce(
        (s: number, d: any) => s + (d.balance?.amount ? Number(d.balance.amount) : 0),
        0
      );
      return total / 1e18;
    }
    return null;
  } catch {
    return null;
  }
}

export const QIE_YAP_ABI = [
  { inputs: [{ internalType: "address", name: "_treasury", type: "address" }, { internalType: "address", name: "_devWallet", type: "address" }], stateMutability: "nonpayable", type: "constructor" },
  { inputs: [], name: "BOOST_PRICE_PER_HOUR", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "PLATFORM_FEE_PERCENT", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "SUPER_YAP_PRICE", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "boostsCreated", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "boostsCreated", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "postId", type: "uint256" }, { internalType: "uint256", name: "durationHours", type: "uint256" }], name: "boost", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [], name: "createSuperYap", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [], name: "devWallet", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getGlobalStats", outputs: [{ internalType: "uint256", name: "_totalTips", type: "uint256" }, { internalType: "uint256", name: "_totalSuperYaps", type: "uint256" }, { internalType: "uint256", name: "_totalBoosts", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "user", type: "address" }], name: "getUserStats", outputs: [{ internalType: "uint256", name: "_tipsSent", type: "uint256" }, { internalType: "uint256", name: "_tipsReceived", type: "uint256" }, { internalType: "uint256", name: "_superYaps", type: "uint256" }, { internalType: "uint256", name: "_boosts", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "owner", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "superYapsCreated", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "superYapsCreated", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "recipient", type: "address" }, { internalType: "string", name: "message", type: "string" }], name: "tip", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [], name: "tipsReceived", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "tipsReceived", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "tipsSent", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "tipsSent", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalBoosts", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSuperYaps", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalTipsSent", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "treasury", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "_devWallet", type: "address" }], name: "updateDevWallet", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "_treasury", type: "address" }], name: "updateTreasury", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "withdrawTips", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "bytes32", name: "contentHash", type: "bytes32" }, { internalType: "string", name: "cid", type: "string" }], name: "yap", outputs: [], stateMutability: "nonpayable", type: "function" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "user", type: "address" }, { indexed: true, internalType: "uint256", name: "postId", type: "uint256" }, { indexed: false, internalType: "uint256", name: "durationHours", type: "uint256" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }], name: "PostBoosted", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "user", type: "address" }, { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }], name: "SuperYapCreated", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "from", type: "address" }, { indexed: true, internalType: "address", name: "to", type: "address" }, { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }, { indexed: false, internalType: "string", name: "message", type: "string" }], name: "TipSent", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, internalType: "address", name: "author", type: "address" }, { indexed: true, internalType: "bytes32", name: "contentHash", type: "bytes32" }, { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }, { indexed: false, internalType: "string", name: "cid", type: "string" }], name: "Yapped", type: "event" },
] as const;

export async function getQieYapContract(contractAddress: `0x${string}`) {
  return getContract({
    address: contractAddress,
    abi: QIE_YAP_ABI,
    client: qiePublicClient,
  });
}

export async function checkWalletConnection(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    console.error("❌ QIE Wallet tidak terdeteksi. Install QIE Wallet.");
    return false;
  }
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    return accounts && accounts.length > 0;
  } catch {
    return false;
  }
}

export async function getWalletClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("❌ QIE Wallet tidak terdeteksi. Harap install QIE Wallet dan login.");
  }
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
  const address = accounts[0];
  if (!address) throw new Error("Tidak ada akun yang ditemukan di QIE Wallet.");
  const walletClient = createWalletClient({
    chain: QIE_CHAIN,
    transport: custom(window.ethereum),
  });
  return { walletClient, address: address as `0x${string}` };
}

export async function sendTip(contractAddress: `0x${string}`, recipient: `0x${string}`, amountInQie: string, message: string) {
  console.log("📤 Sending tip to:", recipient, "amount:", amountInQie);
  const { walletClient, address } = await getWalletClient();
  try {
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: QIE_YAP_ABI,
      functionName: "tip",
      args: [recipient, message],
      value: parseEther(amountInQie),
      account: address,
    });
    console.log("✅ Tip sent:", hash);
    return hash;
  } catch (error: any) {
    console.error("❌ Tip error:", error);
    throw new Error(error.message || "Tip gagal");
  }
}

export async function createSuperYap(contractAddress: `0x${string}`) {
  console.log("📤 Creating SuperYap");
  const { walletClient, address } = await getWalletClient();
  try {
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: QIE_YAP_ABI,
      functionName: "createSuperYap",
      value: parseEther("0.01"),
      account: address,
    });
    console.log("✅ SuperYap created:", hash);
    return hash;
  } catch (error: any) {
    console.error("❌ SuperYap error:", error);
    throw new Error(error.message || "SuperYap gagal");
  }
}

export async function boostPost(contractAddress: `0x${string}`, postId: bigint, durationHours: bigint) {
  console.log("📤 Boosting post:", postId, "duration:", durationHours);
  const { walletClient, address } = await getWalletClient();
  const cost = 0.005 * Number(durationHours);
  try {
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: QIE_YAP_ABI,
      functionName: "boost",
      args: [postId, durationHours],
      value: parseEther(cost.toString()),
      account: address,
    });
    console.log("✅ Boost sent:", hash);
    return hash;
  } catch (error: any) {
    console.error("❌ Boost error:", error);
    throw new Error(error.message || "Boost gagal");
  }
}

// ✅ TAMBAHAN BARU: Ambil bytecode kontrak (internal)
export async function getContractCode(address: `0x${string}`): Promise<string | null> {
  try {
    const code = await qiePublicClient.getCode({ address });
    return code;
  } catch (error) {
    console.error("❌ Gagal mengambil bytecode:", error);
    return null;
  }
}

// ✅ TAMBAHAN BARU: Ambil info kontrak dari API (opsional)
export async function getContractInfo(address: `0x${string}`): Promise<any | null> {
  try {
    const res = await fetch(`https://mainnet.qie.digital/api?module=contract&action=getsourcecode&address=${address}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

import { createPublicClient, defineChain, http, formatEther } from "viem";

export const QIE_CHAIN = defineChain({
  id: 1990,
  name: "QIE Mainnet",
  nativeCurrency: { name: "QIE", symbol: "QIE", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-evm.qie.onenov.xyz"] } },
  blockExplorers: { default: { name: "QIE Explorer", url: "https://qie.explorer.onenov.xyz" } },
});

export const QIE_REST = "https://api.qie.onenov.xyz";

export const CONTRACTS = {
  tip:      "0x1276f46a7885cD68c1AB1f4d6cFec1966a0b3aEB" as const,
  superYap: "0x9B0DBB1f751A4ACD81B5f9f9926e8f4ddA594Ec6" as const,
  boost:    "0xf3460007C1dBD2FA3B301be65C3C5BC3D694d56e" as const,
};

export const qiePublicClient = createPublicClient({
  chain: QIE_CHAIN,
  transport: http(),
});

export async function getQieBalance(address: `0x${string}`): Promise<number> {
  const wei = await qiePublicClient.getBalance({ address });
  return parseFloat(formatEther(wei));
}

/** Derive a "staking badge" tier from a QIE balance (placeholder until real staking RPC). */
export type StakingBadge = "shrimp" | "fish" | "dolphin" | "shark" | "whale";
export function badgeFor(qie: number): StakingBadge {
  if (qie >= 100_000) return "whale";
  if (qie >= 10_000)  return "shark";
  if (qie >= 1_000)   return "dolphin";
  if (qie >= 100)     return "fish";
  return "shrimp";
}

/** Read QIE staking total from the Cosmos REST endpoint, if available, else fall back to balance. */
export async function getStakedQie(address: string): Promise<number | null> {
  try {
    const res = await fetch(`${QIE_REST}/cosmos/staking/v1beta1/delegations/${address}`);
    if (!res.ok) return null;
    const data = await res.json() as { delegation_responses?: Array<{ balance?: { amount?: string } }> };
    const total = (data.delegation_responses ?? []).reduce(
      (s, d) => s + (d.balance?.amount ? Number(d.balance.amount) : 0),
      0,
    );
    return total / 1e18;
  } catch {
    return null;
  }
}

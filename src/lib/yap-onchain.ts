import { createWalletClient, custom, keccak256, toBytes, parseAbi } from "viem";
import { QIE_CHAIN } from "@/lib/qie-chain";

export const YAP_CONTRACT = (import.meta.env.VITE_QIE_YAP_CONTRACT ?? "").trim() as
  | `0x${string}`
  | "";

const YAP_ABI = parseAbi([
  "function yap(bytes32 contentHash, string cid) external",
]);

export function hashContent(content: string): `0x${string}` {
  return keccak256(toBytes(content));
}

export interface OnChainResult {
  txHash: `0x${string}`;
  contentHash: `0x${string}`;
}

/**
 * Submits a yap on-chain by calling QieYap.yap(hash, ""). Requires an
 * injected wallet (window.ethereum) on the QIE chain (1990). Throws if the
 * contract address is not configured — callers should treat that as a signal
 * to fall back to off-chain posting.
 */
export async function submitYapOnChain(
  address: `0x${string}`,
  content: string,
): Promise<OnChainResult> {
  if (!YAP_CONTRACT) throw new Error("On-chain yap contract not configured");
  if (!window.ethereum) throw new Error("No wallet detected");

  const client = createWalletClient({
    account: address,
    chain: QIE_CHAIN,
    transport: custom(window.ethereum),
  });

  // Ensure we are on QIE chain
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${QIE_CHAIN.id.toString(16)}` }],
    });
  } catch {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: `0x${QIE_CHAIN.id.toString(16)}`,
        chainName: QIE_CHAIN.name,
        nativeCurrency: QIE_CHAIN.nativeCurrency,
        rpcUrls: QIE_CHAIN.rpcUrls.default.http,
        blockExplorerUrls: [QIE_CHAIN.blockExplorers.default.url],
      }],
    });
  }

  const contentHash = hashContent(content);
  const txHash = await client.writeContract({
    address: YAP_CONTRACT,
    abi: YAP_ABI,
    functionName: "yap",
    args: [contentHash, ""],
  });
  return { txHash, contentHash };
}

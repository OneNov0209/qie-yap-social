// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title QieYap — hash-anchor for QIE Yap social posts
/// @notice Deploy this contract via Remix on QIE chain (id 1990).
/// After deploying, paste the contract address into your Lovable project's
/// .env as VITE_QIE_YAP_CONTRACT=0x... and republish.
///
/// The contract does not store post content. It emits an event that anchors
/// a keccak256 hash of the post's content to the blockchain, along with an
/// optional CID (e.g. IPFS) for off-chain retrieval.
contract QieYap {
    event Yapped(
        address indexed author,
        bytes32 indexed contentHash,
        uint256 timestamp,
        string  cid
    );

    /// @param contentHash keccak256(utf8Bytes(content))
    /// @param cid         Optional off-chain locator ("" is fine)
    function yap(bytes32 contentHash, string calldata cid) external {
        emit Yapped(msg.sender, contentHash, block.timestamp, cid);
    }
}

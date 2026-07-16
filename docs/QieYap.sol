// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract QieYap {
    address public owner;
    address public treasury;
    address public devWallet;
    
    uint256 public constant SUPER_YAP_PRICE = 0.01 ether;
    uint256 public constant BOOST_PRICE_PER_HOUR = 0.005 ether;
    uint256 public constant PLATFORM_FEE_PERCENT = 2;
    
    uint256 public totalTipsSent;
    uint256 public totalSuperYaps;
    uint256 public totalBoosts;
    
    mapping(address => uint256) public tipsSent;
    mapping(address => uint256) public tipsReceived;
    mapping(address => uint256) public superYapsCreated;
    mapping(address => uint256) public boostsCreated;
    
    event TipSent(address indexed from, address indexed to, uint256 amount, string message);
    event SuperYapCreated(address indexed user, uint256 timestamp);
    event PostBoosted(address indexed user, uint256 indexed postId, uint256 durationHours, uint256 amount);
    event Yapped(address indexed author, bytes32 indexed contentHash, uint256 timestamp, string cid);
    
    constructor(address _treasury, address _devWallet) {
        owner = msg.sender;
        treasury = _treasury;
        devWallet = _devWallet;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    function yap(bytes32 contentHash, string calldata cid) external {
        emit Yapped(msg.sender, contentHash, block.timestamp, cid);
    }
    
    function tip(address recipient, string calldata message) external payable {
        require(msg.value > 0, "Tip must be > 0");
        require(recipient != address(0), "Invalid recipient");
        require(recipient != msg.sender, "Cannot tip yourself");
        
        uint256 devFee = (msg.value * PLATFORM_FEE_PERCENT) / 100;
        uint256 recipientAmount = msg.value - devFee;
        
        (bool feeSent, ) = payable(devWallet).call{value: devFee}("");
        require(feeSent, "Fee transfer failed");
        
        (bool sent, ) = payable(recipient).call{value: recipientAmount}("");
        require(sent, "Transfer failed");
        
        tipsSent[msg.sender] += recipientAmount;
        tipsReceived[recipient] += recipientAmount;
        totalTipsSent += recipientAmount;
        
        emit TipSent(msg.sender, recipient, recipientAmount, message);
    }
    
    function createSuperYap() external payable {
        require(msg.value >= SUPER_YAP_PRICE, "Insufficient fee");
        
        uint256 burnAmount = msg.value / 2;
        (bool burnSuccess, ) = payable(0x000000000000000000000000000000000000dEaD).call{value: burnAmount}("");
        require(burnSuccess, "Burn failed");
        
        uint256 treasuryAmount = msg.value - burnAmount;
        (bool treasurySuccess, ) = payable(treasury).call{value: treasuryAmount}("");
        require(treasurySuccess, "Treasury transfer failed");
        
        superYapsCreated[msg.sender]++;
        totalSuperYaps++;
        
        emit SuperYapCreated(msg.sender, block.timestamp);
    }
    
    function boost(uint256 postId, uint256 durationHours) external payable {
        require(durationHours > 0 && durationHours <= 72, "Duration must be 1-72 hours");
        uint256 cost = BOOST_PRICE_PER_HOUR * durationHours;
        require(msg.value >= cost, "Insufficient fee");
        
        (bool sent, ) = payable(treasury).call{value: msg.value}("");
        require(sent, "Transfer failed");
        
        boostsCreated[msg.sender]++;
        totalBoosts++;
        
        emit PostBoosted(msg.sender, postId, durationHours, msg.value);
    }
    
    function updateTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }
    
    function updateDevWallet(address _devWallet) external onlyOwner {
        devWallet = _devWallet;
    }
    
    function withdrawTips() external {
        uint256 amount = tipsReceived[msg.sender];
        require(amount > 0, "No tips to withdraw");
        tipsReceived[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Withdraw failed");
    }
    
    function getUserStats(address user) external view returns (
        uint256 _tipsSent,
        uint256 _tipsReceived,
        uint256 _superYaps,
        uint256 _boosts
    ) {
        return (
            tipsSent[user],
            tipsReceived[user],
            superYapsCreated[user],
            boostsCreated[user]
        );
    }
    
    function getGlobalStats() external view returns (
        uint256 _totalTips,
        uint256 _totalSuperYaps,
        uint256 _totalBoosts
    ) {
        return (totalTipsSent, totalSuperYaps, totalBoosts);
    }
}

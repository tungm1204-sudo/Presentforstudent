// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AchievementReward is ERC20, Ownable {
    // Mapping to check if an address is an authorized staff
    mapping(address => bool) public isAuthorizedStaff;

    // Events
    event RewardIssued(address indexed student, uint256 amount, string achievementId, address indexed issuedBy);
    event TokensRedeemed(address indexed student, uint256 amount, string itemId);
    event StaffAuthorized(address indexed staff, address indexed authorizedBy);
    event StaffRevoked(address indexed staff, address indexed revokedBy);

    // Modifier to restrict access to authorized staff or owner
    modifier onlyStaff() {
        require(isAuthorizedStaff[msg.sender] || msg.sender == owner(), "Not authorized staff");
        _;
    }

    constructor() ERC20("EduRewardToken", "ERT") Ownable(msg.sender) {
        // Owner is authorized by default
        isAuthorizedStaff[msg.sender] = true;
    }

    /**
     * @dev Authorize a new staff member. Only owner can call this.
     * @param _staff Address of the staff to authorize
     */
    function authorizeStaff(address _staff) external onlyOwner {
        require(!isAuthorizedStaff[_staff], "Staff already authorized");
        isAuthorizedStaff[_staff] = true;
        emit StaffAuthorized(_staff, msg.sender);
    }

    /**
     * @dev Revoke a staff member's authorization. Only owner can call this.
     * @param _staff Address of the staff to revoke
     */
    function revokeStaff(address _staff) external onlyOwner {
        require(isAuthorizedStaff[_staff], "Staff not authorized");
        require(_staff != owner(), "Cannot revoke owner");
        isAuthorizedStaff[_staff] = false;
        emit StaffRevoked(_staff, msg.sender);
    }

    /**
     * @dev Issue reward tokens to a student. Only authorized staff can call this.
     * @param _student Address of the student receiving the reward
     * @param _amount Amount of tokens to mint (should include decimals, e.g., 10 * 10**18)
     * @param _achievementId Unique ID of the achievement (stored off-chain)
     */
    function issueReward(address _student, uint256 _amount, string memory _achievementId) external onlyStaff {
        require(_student != address(0), "Cannot mint to zero address");
        require(_amount > 0, "Amount must be greater than zero");
        require(bytes(_achievementId).length > 0, "Achievement ID cannot be empty");

        _mint(_student, _amount);
        emit RewardIssued(_student, _amount, _achievementId, msg.sender);
    }

    /**
     * @dev Redeem tokens for rewards. Students burn their tokens.
     * @param _amount Amount of tokens to redeem
     * @param _itemId The ID or name of the item being redeemed
     */
    function redeemTokens(uint256 _amount, string memory _itemId) external {
        require(_amount > 0, "Amount must be greater than zero");
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");
        require(bytes(_itemId).length > 0, "Item ID cannot be empty");

        _burn(msg.sender, _amount);
        emit TokensRedeemed(msg.sender, _amount, _itemId);
    }
}

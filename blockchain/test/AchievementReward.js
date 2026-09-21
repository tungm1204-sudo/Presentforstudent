import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("AchievementReward", function () {
  let AchievementReward, achievementReward;
  let owner, staff, student, otherAccount;

  beforeEach(async function () {
    [owner, staff, student, otherAccount] = await ethers.getSigners();
    AchievementReward = await ethers.getContractFactory("AchievementReward");
    achievementReward = await AchievementReward.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await achievementReward.owner()).to.equal(owner.address);
    });

    it("Should authorize the owner as staff by default", async function () {
      expect(await achievementReward.isAuthorizedStaff(owner.address)).to.equal(true);
    });

    it("Should have correct token name and symbol", async function () {
      expect(await achievementReward.name()).to.equal("EduRewardToken");
      expect(await achievementReward.symbol()).to.equal("ERT");
    });
  });

  describe("Staff Management", function () {
    it("Should allow owner to authorize a new staff member", async function () {
      await expect(achievementReward.authorizeStaff(staff.address))
        .to.emit(achievementReward, "StaffAuthorized")
        .withArgs(staff.address, owner.address);

      expect(await achievementReward.isAuthorizedStaff(staff.address)).to.equal(true);
    });

    it("Should not allow non-owner to authorize staff", async function () {
      await expect(
        achievementReward.connect(otherAccount).authorizeStaff(staff.address)
      ).to.be.revertedWithCustomError(achievementReward, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to revoke staff", async function () {
      await achievementReward.authorizeStaff(staff.address);
      await expect(achievementReward.revokeStaff(staff.address))
        .to.emit(achievementReward, "StaffRevoked")
        .withArgs(staff.address, owner.address);

      expect(await achievementReward.isAuthorizedStaff(staff.address)).to.equal(false);
    });
  });

  describe("Reward Issuance", function () {
    const amount = ethers.parseUnits("10", 18);
    const achievementId = "achv_001";

    it("Should allow authorized staff to issue rewards", async function () {
      await achievementReward.authorizeStaff(staff.address);

      await expect(achievementReward.connect(staff).issueReward(student.address, amount, achievementId))
        .to.emit(achievementReward, "RewardIssued")
        .withArgs(student.address, amount, achievementId, staff.address);

      expect(await achievementReward.balanceOf(student.address)).to.equal(amount);
    });

    it("Should not allow unauthorized account to issue rewards", async function () {
      await expect(
        achievementReward.connect(otherAccount).issueReward(student.address, amount, achievementId)
      ).to.be.revertedWith("Not authorized staff");
    });

    it("Should allow owner to issue rewards since owner is staff", async function () {
      await expect(achievementReward.issueReward(student.address, amount, achievementId))
        .to.emit(achievementReward, "RewardIssued")
        .withArgs(student.address, amount, achievementId, owner.address);

      expect(await achievementReward.balanceOf(student.address)).to.equal(amount);
    });
  });
});

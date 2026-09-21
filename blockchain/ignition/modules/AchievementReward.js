import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AchievementRewardModule", (m) => {
  const achievementReward = m.contract("AchievementReward", []);

  return { achievementReward };
});

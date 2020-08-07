const HFI = artifacts.require("HFI");
const HCRV = artifacts.require("HCRV");
const YearnRewards = artifacts.require("YearnRewards");
const YearnGovernance = artifacts.require("YearnGovernance");

const { getAddress } = require("@harmony-js/crypto");

module.exports = function(deployer) {
  deployer.deploy(HFI).then(function() {
    return deployer.deploy(HCRV).then(function() {
      const hfiBech32 = getAddress(HFI.address).bech32;
      const hcrvBech32 = getAddress(HCRV.address).bech32;
      
      console.log(`  Deploying YearnRewards contract...`);
      console.log(`  HFI address: ${hfiBech32} (${HFI.address})`);
      console.log(`  hCRV address: ${hcrvBech32} (${HCRV.address})`);
      
      return deployer.deploy(YearnRewards, HFI.address, HCRV.address).then(function() {
        const yearnRewardsBech32 = getAddress(YearnRewards.address).bech32;
        console.log(`  Yearn Rewards contract address: ${yearnRewardsBech32} (${YearnRewards.address})`);
      
        return deployer.deploy(YearnGovernance, HFI.address, HCRV.address).then(function() {
            const yearnGovernanceBech32 = getAddress(YearnGovernance.address).bech32;
            console.log(`  Yearn Governance contract address: ${yearnGovernanceBech32} (${YearnGovernance.address})`);
          }
        );
      });
    });
  });
};

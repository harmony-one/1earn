const HFI = artifacts.require("HFI");
const HCRV = artifacts.require("HCRV");
const YearnRewards = artifacts.require("YearnRewards");

const { getAddress } = require("@harmony-js/crypto");

module.exports = function(deployer) {
  deployer.deploy(HFI).then(function() {
    return deployer.deploy(HCRV).then(function() {
      return deployer.deploy(YearnRewards, HFI.address, HCRV.address).then(function() {
        const hfiBech32 = getAddress(HFI.address).bech32;
        const hcrvBech32 = getAddress(HCRV.address).bech32;
        const yearnRewardsBech32 = getAddress(YearnRewards.address).bech32;
        
        console.log(`  HFI address: ${HFI.address} - ${hfiBech32}`);
        console.log(`  hCRV address: ${HCRV.address} - ${hcrvBech32}`);
        console.log(`  Yearn Rewards contract address: ${YearnRewards.address} - ${yearnRewardsBech32}`);
      });
    });
  });
};

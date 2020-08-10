const ONEFI = artifacts.require("OneFI");
const ONECRV = artifacts.require("OneCRV");
const WONE = artifacts.require("WONE");
const HRC20Faucet = artifacts.require("HRC20Faucet");
const HRC20RestrictedFaucet = artifacts.require("HRC20RestrictedFaucet");
const ONEearnRewards = artifacts.require("OneEarnRewards");
const ONEearnGovernance = artifacts.require("OneEarnGovernance");

const { getAddress } = require("@harmony-js/crypto");
const web3 = require('web3');
const faucet = {
  amount: web3.utils.toWei("1000"), //award 10000 tokens per faucet interaction
  frequency: 17280 //will fund addresses once a day based on 5s block time
}

module.exports = function (deployer, network, accounts) {
  deployer.deploy(ONEFI).then(function () {
    return deployer.deploy(ONECRV).then(function () {
      return deployer.deploy(WONE).then(function () {

        return deployer.deploy(HRC20Faucet, ONECRV.address, faucet.amount, faucet.frequency).then(function () {
          return deployer.deploy(HRC20RestrictedFaucet, ONECRV.address, faucet.amount).then(function () {
            return deployer.deploy(ONEearnRewards, ONECRV.address, ONEFI.address).then(function () {
              return deployer.deploy(ONEearnGovernance, ONEFI.address, ONECRV.address, 0).then(function () {
                console.log(`   1FI address: ${ONEFI.address} - ${getAddress(ONEFI.address).bech32}`);
                console.log(`   1CRV address: ${ONECRV.address} - ${getAddress(ONECRV.address).bech32}`);
                console.log(`   1CRV faucet address: ${HRC20Faucet.address} - ${getAddress(HRC20Faucet.address).bech32}`);
                console.log(`   1CRV restricted faucet address: ${HRC20Faucet.address} - ${getAddress(HRC20Faucet.address).bech32}`);
                console.log(`   1earn Rewards contract address: ${ONEearnRewards.address} - ${getAddress(ONEearnRewards.address).bech32}`);
                console.log(`   1earn Governance contract address: ${ONEearnGovernance.address} - ${getAddress(ONEearnGovernance.address).bech32}\n`);
                console.log(`   export NETWORK=${network}; export ONEFI=${ONEFI.address}; export ONECRV=${ONECRV.address}; export WONE=${WONE.address}; export FAUCET=${HRC20Faucet.address}; export RESTRICTEDFAUCET=${HRC20RestrictedFaucet.address}; export REWARDS=${ONEearnRewards.address}; export GOVERNANCE=${ONEearnGovernance.address}\n`);
                //console.log(`   network=${network}; onefi=${ONEFI.address}; onecrv=${ONECRV.address}; wone=${WONE.address}; faucet=${HRC20Faucet.address}; restrictedFaucet=${HRC20RestrictedFaucet.address}; rewards=${ONEearnRewards.address}; governance=${ONEearnGovernance.address}\n`);
                console.log(`   addresses: {"onefi": "${ONEFI.address}", "onecrv": "${ONECRV.address}", "wone": "${WONE.address}", "faucet": "${HRC20Faucet.address}", "restrictedFaucet": "${HRC20RestrictedFaucet.address}", "rewards": "${ONEearnRewards.address}", "governance": "${ONEearnGovernance.address}"}`);
              }); // End 1earn Governance deployment
            }); // End 1earn Rewards deployment
          }); // End HRC20RestrictedFaucet deployment
        }); // End HRC20Faucet deployment

      }) // End WONE deployment
    }); // End 1CRV deployment
  }); // End 1FI deployment
}

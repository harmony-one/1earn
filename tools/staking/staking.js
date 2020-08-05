const web3 = require('web3');
const Coingecko = require('../utils/coingecko');

module.exports = class Staking {

    static async status(network, rewardsInstance, rewardContractAddress, lpTokenAddress, walletAddress) {
        let total = await rewardsInstance.totalSupply().call(network.gasOptions());
        console.log(`Total amount of staked lp token (${lpTokenAddress}) in the YearnRewards contract (${rewardContractAddress}) is now: ${web3.utils.fromWei(total)}`);
      
        let balanceOf = await rewardsInstance.balanceOf(walletAddress).call(network.gasOptions());
        console.log(`Total amount of staked lp tokens for address ${walletAddress} in the YearnRewards contract (${rewardContractAddress}): ${web3.utils.fromWei(balanceOf)}\n`);
      
        let earned = await rewardsInstance.earned(walletAddress).call(network.gasOptions());
        let price = await Coingecko.price('yearn-finance');
        let usdAmount = (web3.utils.fromWei(earned) * price);
        let formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        });
        let formatted = formatter.format(usdAmount);
        console.log(`Current earned rewards for address ${walletAddress} is: ${web3.utils.fromWei(earned)} HFI - ${formatted}\n`);
    }

}

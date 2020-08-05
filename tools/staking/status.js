// Args
const yargs = require('yargs');
const argv = yargs
    .option('network', {
        alias: 'n',
        description: 'Which network to mint tokens on',
        type: 'string',
        default: 'testnet'
    })
    .option('rewards-contract', {
      alias: 'r',
      description: 'The contract address for the rewards contract (YearnRewards)',
      type: 'string'
    })
    .option('token-address', {
        alias: 't',
        description: 'The contract address for the liquidity provider token (hCRV)',
        type: 'string'
      })
    .help()
    .alias('help', 'h')
    .argv;

if (argv["rewards-contract"] == null || argv["rewards-contract"] == '') {
  console.log('You must supply a rewards contract address using --rewards-contract CONTRACT_ADDRESS or -r CONTRACT_ADDRESS!');
  process.exit(0);
}

if (argv["token-address"] == null || argv["token-address"] == '') {
  console.log('You must supply a lp token contract address using --token-address CONTRACT_ADDRESS or -t CONTRACT_ADDRESS!');
  process.exit(0);
}

// Libs
const web3 = require('web3');
const Network = require("../network.js");

// Vars
const network = new Network(argv.network);

const rewardContractAddress = argv["rewards-contract"];
const tokenAddress = argv["token-address"];

let rewardsContract = network.loadContract('../build/contracts/YearnRewards.json', rewardContractAddress);
let rewardsInstance = rewardsContract.methods;

let tokenContract = network.loadContract('../build/contracts/HCRV.json', tokenAddress);
let tokenInstance = tokenContract.methods;

const walletAddress = tokenContract.wallet.signer.address;

async function status() {
  let tokenTotal = await tokenInstance.totalSupply().call(network.gasOptions());
  console.log(`Current total supply of the lp token is: ${web3.utils.fromWei(tokenTotal)}`);

  let balance = await tokenInstance.balanceOf(walletAddress).call(network.gasOptions());
  console.log(`Balance of lp token ${tokenAddress} for address ${walletAddress} is: ${web3.utils.fromWei(balance)}\n`);

  let stakingTotal = await rewardsInstance.totalSupply().call(network.gasOptions());
  console.log(`Total amount of staked lp token (${tokenAddress}) in the YearnRewards contract (${rewardContractAddress}) is now: ${web3.utils.fromWei(stakingTotal)}`);

  let balanceOf = await rewardsInstance.balanceOf(walletAddress).call(network.gasOptions());
  console.log(`Balance for address ${walletAddress} is now: ${web3.utils.fromWei(balanceOf)}`);

  let earned = await rewardsInstance.earned(walletAddress).call(network.gasOptions());
  console.log(`Current earned rewards for address ${walletAddress} is: ${web3.utils.fromWei(earned)} HFI`);
}

status()
  .then(() => {
    process.exit(0);
  })
  .catch(function(err){
    console.log(err);
    process.exit(0);
  });

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
    .option('amount', {
      alias: 'a',
      description: 'The amount of tokens to stake',
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

if (argv.amount == null || argv.amount == '') {
  console.log('You must supply the amount of tokens to mint using --amount AMOUNT or -a AMOUNT! Amount is a normal number - not wei');
  process.exit(0);
}

// Libs
const web3 = require('web3');
const Network = require("../network.js");

// Vars
const network = new Network(argv.network);

const amount = web3.utils.toWei(argv.amount);
const rewardContractAddress = argv["rewards-contract"];
const tokenAddress = argv["token-address"];

let rewardsContract = network.loadContract('../build/contracts/YearnRewards.json', rewardContractAddress);
let rewardsInstance = rewardsContract.methods;

let tokenContract = network.loadContract('../build/contracts/HCRV.json', tokenAddress);
let tokenInstance = tokenContract.methods;

const walletAddress = rewardsContract.wallet.signer.address;

async function tokenStatus() {
  let total = await tokenInstance.totalSupply().call(network.gasOptions());
  console.log(`Current total supply of the lp token is: ${web3.utils.fromWei(total)}`);

  let balance = await tokenInstance.balanceOf(walletAddress).call(network.gasOptions());
  console.log(`Balance of lp token ${tokenAddress} for address ${walletAddress} is: ${web3.utils.fromWei(balance)}\n`);
}

async function stake() {
  console.log(`Attempting to approve ${rewardContractAddress} to spend ${argv.amount} LP tokens (${tokenAddress}) for ${walletAddress}...`);
  let approvalResult = await tokenInstance.approve(rewardContractAddress, amount).send(network.gasOptions());
  let approvalTxHash = approvalResult.transaction.receipt.transactionHash;
  console.log(`Approval tx hash: ${approvalTxHash}\n`);

  console.log(`Attempting to stake ${argv.amount} LP tokens (${tokenAddress}) to rewards contract ${walletAddress}...`);
  let stakingResult = await rewardsInstance.stake(amount).send(network.gasOptions());
  let stakingTxHash = stakingResult.transaction.receipt.transactionHash;
  console.log(`Staking transaction hash: ${stakingTxHash}\n`);

  let total = await rewardsInstance.totalSupply().call(network.gasOptions());
  console.log(`Total amount of staked lp token (${tokenAddress}) in the YearnRewards contract (${rewardContractAddress}) is now: ${web3.utils.fromWei(total)}`);

  let balanceOf = await rewardsInstance.balanceOf(walletAddress).call(network.gasOptions());
  console.log(`Balance for address ${walletAddress} is now: ${web3.utils.fromWei(balanceOf)}`);

  let earned = await rewardsInstance.earned(walletAddress).call(network.gasOptions());
  console.log(`Current earned rewards for address ${walletAddress} is: ${web3.utils.fromWei(earned)}`);
}

tokenStatus()
  .then(() => {
    stake().then(() => {
      process.exit(0);
    })
  })
  .catch(function(err){
    console.log(err);
    process.exit(0);
  });

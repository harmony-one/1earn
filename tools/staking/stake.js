// Args
const yargs = require('yargs');
const argv = yargs
    .option('network', {
        alias: 'n',
        description: 'Which network to mint tokens on',
        type: 'string',
        default: 'testnet'
    })
    .option('lp', {
      alias: 'l',
      description: 'The contract address for the liquidity provider token (hCRV)',
      type: 'string'
    })
    .option('rewards', {
      alias: 'r',
      description: 'The contract address for the rewards contract (YearnRewards)',
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

const lpTokenAddress = argv.lp;
const rewardContractAddress = argv.rewards;

if (lpTokenAddress == null || lpTokenAddress == '') {
  console.log('You must supply a lp token contract address using --lp CONTRACT_ADDRESS or -l CONTRACT_ADDRESS!');
  process.exit(0);
}

if (rewardContractAddress == null || rewardContractAddress == '') {
  console.log('You must supply a rewards contract address using --rewards CONTRACT_ADDRESS or -r CONTRACT_ADDRESS!');
  process.exit(0);
}

if (argv.amount == null || argv.amount == '') {
  console.log('You must supply the amount of tokens to mint using --amount AMOUNT or -a AMOUNT! Amount is a normal number - not wei');
  process.exit(0);
}

// Libs
const web3 = require('web3');
const Staking = require('./staking');
const Network = require("../network.js");
const { getAddress } = require("@harmony-js/crypto");

// Vars
const network = new Network(argv.network);
const amount = web3.utils.toWei(argv.amount);

let rewardsContract = network.loadContract('../build/contracts/YearnRewards.json', rewardContractAddress, 'tester');
let rewardsInstance = rewardsContract.methods;

let lpTokenContract = network.loadContract('../build/contracts/HCRV.json', lpTokenAddress, 'tester');
let lpTokenInstance = lpTokenContract.methods;

const walletAddress = rewardsContract.wallet.signer.address;
const walletAddressBech32 = getAddress(walletAddress).bech32;

async function tokenStatus() {
  let total = await lpTokenInstance.totalSupply().call(network.gasOptions());
  console.log(`Current total supply of the lp token is: ${web3.utils.fromWei(total)}`);

  let balance = await lpTokenInstance.balanceOf(walletAddress).call(network.gasOptions());
  console.log(`Balance of lp token ${lpTokenAddress} for address ${walletAddressBech32} / ${walletAddress} is: ${web3.utils.fromWei(balance)}\n`);
}

async function stake() {
  console.log(`Attempting to approve ${rewardContractAddress} to spend ${argv.amount} LP tokens (${lpTokenAddress}) for ${walletAddress}...`);
  let approvalResult = await lpTokenInstance.approve(rewardContractAddress, amount).send(network.gasOptions());
  let approvalTxHash = approvalResult.transaction.receipt.transactionHash;
  console.log(`Approval tx hash: ${approvalTxHash}\n`);

  console.log(`Attempting to stake ${argv.amount} LP tokens (${lpTokenAddress}) to rewards contract ${walletAddress}...`);
  let stakingResult = await rewardsInstance.stake(amount).send(network.gasOptions());
  let stakingTxHash = stakingResult.transaction.receipt.transactionHash;
  console.log(`Staking transaction hash: ${stakingTxHash}\n`);

  await Staking.status(network, rewardsInstance, rewardContractAddress, lpTokenAddress, walletAddress);
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

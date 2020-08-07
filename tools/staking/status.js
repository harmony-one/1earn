// Args
const yargs = require('yargs');
const argv = yargs
    .option('network', {
        alias: 'n',
        description: 'Which network to mint tokens on',
        type: 'string',
        default: 'testnet'
    })
    .option('gov', {
      alias: 'g',
      description: 'The contract address for the governance token (HFI)',
      type: 'string'
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
    .help()
    .alias('help', 'h')
    .argv;

const govTokenAddress = argv.gov;
const lpTokenAddress = argv.lp;
const rewardContractAddress = argv.rewards

if (govTokenAddress == null || govTokenAddress == '') {
  console.log('You must supply a gov token contract address using --gov CONTRACT_ADDRESS or -g CONTRACT_ADDRESS!');
  process.exit(0);
}

if (lpTokenAddress == null || lpTokenAddress == '') {
  console.log('You must supply a lp token contract address using --lp CONTRACT_ADDRESS or -l CONTRACT_ADDRESS!');
  process.exit(0);
}

if (rewardContractAddress == null || rewardContractAddress == '') {
  console.log('You must supply a rewards contract address using --rewards CONTRACT_ADDRESS or -r CONTRACT_ADDRESS!');
  process.exit(0);
}

// Libs
const web3 = require('web3');
const Staking = require('./staking');
const Network = require("../network");
const { getAddress } = require("@harmony-js/crypto");

// Vars
const network = new Network(argv.network);

let govTokenContract = network.loadContract('../build/contracts/HFI.json', govTokenAddress, 'tester');
let govTokenInstance = govTokenContract.methods;

let lpTokenContract = network.loadContract('../build/contracts/HCRV.json', lpTokenAddress, 'tester');
let lpTokenInstance = lpTokenContract.methods;

let rewardsContract = network.loadContract('../build/contracts/YearnRewards.json', rewardContractAddress, 'tester');
let rewardsInstance = rewardsContract.methods;

const walletAddress = govTokenContract.wallet.signer.address;
const walletAddressBech32 = getAddress(walletAddress).bech32;

async function status() {
  await tokenStatus('gov', govTokenInstance, govTokenAddress, walletAddress);
  await tokenStatus('lp', lpTokenInstance, lpTokenAddress, walletAddress);
  await Staking.status(network, rewardsInstance, rewardContractAddress, lpTokenAddress, walletAddress);
}

async function tokenStatus(type, instance, address, walletAddress) {
  let tokenTotal = await instance.totalSupply().call(network.gasOptions());
  console.log(`Current total supply of the ${type} token is: ${web3.utils.fromWei(tokenTotal)}`);

  let balance = await instance.balanceOf(walletAddress).call(network.gasOptions());
  console.log(`Balance of ${type} token ${address} for address ${walletAddressBech32} / ${walletAddress} is: ${web3.utils.fromWei(balance)}\n`);
}

status()
  .then(() => {
    process.exit(0);
  })
  .catch(function(err){
    console.log(err);
    process.exit(0);
  });

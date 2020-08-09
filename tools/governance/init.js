// Args
const yargs = require('yargs');
const argv = yargs
    .option('network', {
      alias: 'n',
      description: 'Which network to use',
      type: 'string',
      default: 'testnet'
    })
    .option('contract', {
      alias: 'c',
      description: 'The governance contract address',
      type: 'string'
    })
    .option('token', {
      alias: 't',
      description: 'The contract address for the token you want to use as rewards for the rewards contract (in our case: 1CRV)',
      type: 'string'
    })
    .option('amount', {
      alias: 'a',
      description: 'The amount of tokens to initialize rewards with',
      type: 'string',
      default: '1000000'
    })
    .help()
    .alias('help', 'h')
    .argv;

const rewardsContractAddress = argv.contract;
const tokenAddress = argv.token;

if (argv.contract == null || argv.contract == '') {
  console.log('You must supply a contract address using --contract CONTRACT_ADDRESS or -c CONTRACT_ADDRESS!');
  process.exit(0);
}

if (argv.token == null || argv.token == '') {
  console.log('You must supply a token contract address using --token CONTRACT_ADDRESS or -t CONTRACT_ADDRESS!');
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

const rewardsContract = network.loadContract('../build/contracts/YearnGovernance.json', rewardsContractAddress, 'deployer');
const rewardsInstance = rewardsContract.methods;

const tokenContract = network.loadContract(`../build/contracts/HCRV.json`, tokenAddress, 'deployer');
const tokenInstance = tokenContract.methods;

const ownerAddress = rewardsContract.wallet.signer.address;

async function init() {
  console.log(`Attempting to transfer ${argv.amount} HCRV tokens to governance/rewards contract address ${rewardsContractAddress} ...`);
  let transferResult = await tokenInstance.transfer(rewardsContractAddress, amount).send(network.gasOptions());
  let transferResultTxHash = transferResult.transaction.receipt.transactionHash;
  console.log(`Sent ${argv.amount} HCRV tokens to rewards contract address ${rewardsContractAddress} - tx hash: ${transferResultTxHash}\n`);

  let balanceOf = await tokenInstance.balanceOf(rewardsContractAddress).call(network.gasOptions());
  console.log(`HCRV balance for contract address ${rewardsContractAddress} is: ${web3.utils.fromWei(balanceOf)}\n`);

  console.log(`Attempting to setRewardDistribution to address ${ownerAddress} ...`);
  let distributionResult = await rewardsInstance.setRewardDistribution(ownerAddress).send(network.gasOptions());
  console.log(`setRewardDistribution has been configured with address ${ownerAddress}\n`);

  console.log(`Attempting to notifyRewardAmount with amount ${argv.amount} ...`);
  let rewardAmountResult = await rewardsInstance.notifyRewardAmount(amount).send(network.gasOptions());
  console.log(`notifyRewardAmount has been configured with amount ${argv.amount}\n`);
}

async function status() {
  let lastTimeRewardApplicable = await rewardsInstance.lastTimeRewardApplicable().call(network.gasOptions());
  let lastTimeRewardApplicableDate = new Date(lastTimeRewardApplicable * 1000);
  console.log(`lastTimeRewardApplicable: ${lastTimeRewardApplicableDate.toLocaleString()}`);

  let rewardPerToken = await rewardsInstance.rewardPerToken().call(network.gasOptions());
  console.log(`rewardPerToken: ${rewardPerToken}`);

  let totalSupply = await rewardsInstance.totalSupply().call(network.gasOptions());
  console.log(`totalSupply: ${totalSupply}`);

  let periodFinish = await rewardsInstance.periodFinish().call(network.gasOptions());
  let periodFinishDate = new Date(periodFinish * 1000);
  console.log(`periodFinish: ${periodFinishDate.toLocaleString()}`);

  let rewardRate = await rewardsInstance.rewardRate().call(network.gasOptions());
  console.log(`rewardRate: ${web3.utils.fromWei(rewardRate)} tokens per second`);

  let lastUpdateTime = await rewardsInstance.lastUpdateTime().call(network.gasOptions());
  let lastUpdateTimeDate = new Date(lastUpdateTime * 1000);
  console.log(`lastUpdateTime: ${lastUpdateTimeDate.toLocaleString()}`);

  let rewardPerTokenStored = await rewardsInstance.rewardPerTokenStored().call(network.gasOptions());
  console.log(`rewardPerTokenStored: ${rewardPerTokenStored}`);
}

init()
  .then(() => {
    status().then(() => {
      process.exit(0);
    })
  })
  .catch(function(err){
    console.log(err);
    process.exit(0);
  });

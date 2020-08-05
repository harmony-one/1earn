// Args
const yargs = require('yargs');
const argv = yargs
    .option('network', {
        alias: 'n',
        description: 'Which network to mint tokens on',
        type: 'string',
        default: 'testnet'
    })
    .option('contract', {
      alias: 'c',
      description: 'The contract address',
      type: 'string'
    })
    .option('amount', {
      alias: 'a',
      description: 'The amount of tokens to mint',
      type: 'string'
    })
    .help()
    .alias('help', 'h')
    .argv;

if (argv.contract == null || argv.contract == '') {
  console.log('You must supply a contract address using --contract CONTRACT_ADDRESS or -c CONTRACT_ADDRESS!');
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

const contract = network.loadContract('../build/contracts/YearnRewards.json', argv.contract);
const instance = contract.methods;
const ownerAddress = contract.wallet.signer.address;

async function init() {
  console.log(`Attempting to setRewardDistribution to address ${ownerAddress} ...`)
  let distributionResult = await instance.setRewardDistribution(ownerAddress).send(network.gasOptions());
  console.log(`setRewardDistribution has been configured with address ${ownerAddress}\n`);

  console.log(`Attempting to notifyRewardAmount with amount ${argv.amount} ...`);
  let rewardAmountResult = await instance.notifyRewardAmount(amount).send(network.gasOptions());
  console.log(`notifyRewardAmount has been configured with amount ${argv.amount}\n`);
}

async function status() {
  let lastTimeRewardApplicable = await instance.lastTimeRewardApplicable().call(network.gasOptions());
  let lastTimeRewardApplicableDate = new Date(lastTimeRewardApplicable * 1000);
  console.log(`lastTimeRewardApplicable: ${lastTimeRewardApplicableDate.toLocaleString()}`);

  let rewardPerToken = await instance.rewardPerToken().call(network.gasOptions());
  console.log(`rewardPerToken: ${rewardPerToken}`);

  let totalSupply = await instance.totalSupply().call(network.gasOptions());
  console.log(`totalSupply: ${totalSupply}`);

  let periodFinish = await instance.periodFinish().call(network.gasOptions());
  let periodFinishDate = new Date(periodFinish * 1000);
  console.log(`periodFinish: ${periodFinishDate.toLocaleString()}`);

  let rewardRate = await instance.rewardRate().call(network.gasOptions());
  console.log(`rewardRate: ${web3.utils.fromWei(rewardRate)} tokens per second`);

  let lastUpdateTime = await instance.lastUpdateTime().call(network.gasOptions());
  let lastUpdateTimeDate = new Date(lastUpdateTime * 1000);
  console.log(`lastUpdateTime: ${lastUpdateTimeDate.toLocaleString()}`);

  let rewardPerTokenStored = await instance.rewardPerTokenStored().call(network.gasOptions());
  console.log(`rewardPerTokenStored: ${rewardPerTokenStored}`);
}

async function additionalInfo() {
  let ownerAddress = await instance.owner().call(network.gasOptions());
  console.log(`owner: ${ownerAddress}`);

  let governanceTokenAddress = await instance.governanceToken().call(network.gasOptions());
  console.log(`governanceToken: ${governanceTokenAddress}`);

  let lpTokenAddress = await instance.lpToken().call(network.gasOptions());
  console.log(`lpToken: ${lpTokenAddress}`);
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

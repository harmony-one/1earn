// Args
const yargs = require('yargs');
const argv = yargs
  .option('contract', {
    alias: 'c',
    description: 'The governance contract address',
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

const OneEarnGovernance = artifacts.require("OneEarnGovernance");
const OneFI = artifacts.require("OneFI");
const OneCRV = artifacts.require("OneCRV");

const D = console.log;

let govInstance
let govAddress
let tokenInstance
let tokenAddress

let walletAddress;
//OneEarnGovernance.currentProvider.addresses[0];

function argvCheck() {
  if (argv.amount == null || argv.amount == '')
    throw 'You must supply the amount of tokens to mint using --amount AMOUNT or -a AMOUNT! Amount is a normal number - not wei';
  govAddress = argv.contract ? argv.contract : OneEarnGovernance.address;
  if (!govAddress)
    throw 'You must supply a contract address using --contract CONTRACT_ADDRESS or -c CONTRACT_ADDRESS!';
}

async function init() {
  argvCheck();
  walletAddress = (await web3.eth.getAccounts())[0];
  govInstance = await OneEarnGovernance.at(govAddress);
  tokenAddress = await govInstance.rewardToken();
  tokenInstance = await OneCRV.at(tokenAddress);

  const ownerAddress = walletAddress;

  console.log(`Attempting to transfer ${argv.amount} 1CRV tokens to governance/rewards contract address ${govAddress} ...`);
  const amount = web3.utils.toWei(argv.amount);
  const transferResult = await tokenInstance.transfer(govAddress, amount);
  const transferResultTxHash = transferResult.tx;
  console.log(`Sent ${argv.amount} 1CRV tokens to rewards contract address ${govAddress} - tx hash: ${transferResultTxHash}\n`);

  let balanceOf = await tokenInstance.balanceOf(govAddress);
  console.log(`1CRV balance for contract address ${govAddress} is: ${web3.utils.fromWei(balanceOf)}\n`);

  console.log(`Attempting to setRewardDistribution to address ${ownerAddress} ...`);
  const distributionResult = await govInstance.setRewardDistribution(ownerAddress);
  console.log(`setRewardDistribution has been configured with address ${ownerAddress}\n`);

  console.log(`Attempting to notifyRewardAmount with amount ${argv.amount} ...`);
  const rewardAmountResult = await govInstance.notifyRewardAmount(amount);
  console.log(`notifyRewardAmount has been configured with amount ${argv.amount}\n`);
}

async function status() {
  let lastTimeRewardApplicable = await govInstance.lastTimeRewardApplicable();
  let lastTimeRewardApplicableDate = new Date(lastTimeRewardApplicable * 1000);
  console.log(`lastTimeRewardApplicable: ${lastTimeRewardApplicableDate.toLocaleString()}`);

  let rewardPerToken = await govInstance.rewardPerToken();
  console.log(`rewardPerToken: ${rewardPerToken}`);

  let totalSupply = await govInstance.totalSupply();
  console.log(`totalSupply: ${totalSupply}`);

  let periodFinish = await govInstance.periodFinish();
  let periodFinishDate = new Date(periodFinish * 1000);
  console.log(`periodFinish: ${periodFinishDate.toLocaleString()}`);

  let rewardRate = await govInstance.rewardRate();
  console.log(`rewardRate: ${web3.utils.fromWei(rewardRate)} tokens per second`);

  let lastUpdateTime = await govInstance.lastUpdateTime();
  let lastUpdateTimeDate = new Date(lastUpdateTime * 1000);
  console.log(`lastUpdateTime: ${lastUpdateTimeDate.toLocaleString()}`);

  let rewardPerTokenStored = await govInstance.rewardPerTokenStored();
  console.log(`rewardPerTokenStored: ${rewardPerTokenStored}`);
}

module.exports = function (result) {
  return init()
    .then(status)
    .then(result).catch(result);
}

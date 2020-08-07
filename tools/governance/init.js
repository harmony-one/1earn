const yargs = require('yargs');
const argv = yargs
    .option('contract', {
        alias: 'c',
        description: 'The governance contract address',
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


const YearnGovernance = artifacts.require("YearnGovernance");
const HFI = artifacts.require("HFI");
const HCRV = artifacts.require("HCRV");

const D = console.log;

let govInstance
let govAddress
let tokenInstance
let tokenAddress


const walletAddress = YearnGovernance.currentProvider.addresses[0];

function argvCheck() {
    if (argv.amount == null || argv.amount == '')
        throw 'You must supply the amount of tokens to mint using --amount AMOUNT or -a AMOUNT! Amount is a normal number - not wei';
    govAddress = argv.contract ? argv.contract : YearnGovernance.address;
    if (!govAddress)
        throw 'You must supply a contract address using --contract CONTRACT_ADDRESS or -c CONTRACT_ADDRESS!';

}

async function init() {
    argvCheck();
    govInstance = await YearnGovernance.at(govAddress);
    tokenAddress = await govInstance.HFI.call();
    tokenInstance = await HFI.at(tokenAddress);

    await govInstance.setRewardDistribution(walletAddress);
    console.log(`setRewardDistribution has been configured with address ${walletAddress}`);
    
    const amount = web3.utils.toWei(argv.amount);
    await govInstance.notifyRewardAmount(amount);
    console.log(`notifyRewardAmount has been configured with amount ${argv.amount}`);
}

const web3 = require('web3');

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
    console.log(`rewardRate: ${rewardRate}`);
  
    let lastUpdateTime = await govInstance.lastUpdateTime();
    let lastUpdateTimeDate = new Date(lastUpdateTime * 1000);
    console.log(`lastUpdateTime: ${lastUpdateTimeDate.toLocaleString()}`);
  
    let rewardPerTokenStored = await govInstance.rewardPerTokenStored();
    console.log(`rewardPerTokenStored: ${rewardPerTokenStored}`);
  
    let hfiAddress = await govInstance.HFI();
    console.log(`hfiToken: ${hfiAddress}`);
    let hcrvAddress = await govInstance.hCRV();
    console.log(`hCRVToken: ${hcrvAddress}`);
}

module.exports = function (result) {
    return init()
        .then(status)
        .then(result).catch(result);
}

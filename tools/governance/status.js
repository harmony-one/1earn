const yargs = require('yargs');
const argv = yargs
    .option('contract', {
        alias: 'c',
        description: 'The contract address',
        type: 'string'
    })
    .option('start', {
        alias: 's',
        description: 'The start of proposal ID to display',
        type: 'string'
    })
    .option('amount', {
        alias: 'a',
        description: 'The amount of proposal to display',
        type: 'string'
    })
    .help()
    .alias('help', 'h')
    .argv;


const OneEarnGovernance = artifacts.require("OneEarnGovernance");
const OneFI = artifacts.require("OneFI");
const OneCRV = artifacts.require("OneCRV");

const { fromBech32, toBech32 } = require("@harmony-js/crypto");

const D = console.log;

let govInstance
let govAddress
let tokenInstance
let tokenAddress

//const Web3 = require("web3");
let walletAddress;
//OneEarnGovernance.currentProvider.addresses[0];

function argvCheck() {
    govAddress = argv.contract ? argv.contract : OneEarnGovernance.address;
    if (!govAddress)
        throw 'You must supply a contract address using --contract CONTRACT_ADDRESS or -c CONTRACT_ADDRESS!';
}


async function init() {
    argvCheck();
    walletAddress = (await web3.eth.getAccounts())[0];
    govInstance = await OneEarnGovernance.at(govAddress);
    //tokenAddress = await govInstance.lpToken();
    //tokenInstance = await OneFI.at(tokenAddress);
}

async function tokenStatus() {
}

function short(msg){
    if(msg.length > 10)
        return `${msg.slice(0,4)}..${msg.slice(-4)}`;
    return msg;
}

async function propose() {
    let proposalCount = await govInstance.proposalCount();
    console.log(`proposalCount: ${proposalCount.toString()}`)
    let voteLock = await govInstance.voteLock(walletAddress);
    console.log(`voteLock of ${walletAddress}: ${voteLock.toString()}`)

    let start = parseInt(argv.start);
    let amount = parseInt(argv.amount);
    if(isNaN(start)) start = 0;
    if(isNaN(amount)) amount = 1;
    const proposals = [];
    for(let i = 0; i < amount; i++){
        const proposalID = start + i;
        if(proposalID >= proposalCount) break;
        const proposal = await govInstance.proposals(proposalID);
        proposals.push({
            id: proposal.id.toString(),
            proposer: short(toBech32(proposal.proposer)),
            executor: short(toBech32(proposal.executor)),
            hash: short(proposal.hash),
            totalAgree: proposal.totalForVotes.toString(),
            totalAgainst: proposal.totalAgainstVotes.toString(),
            startBlockNo: proposal.start.toString(),
            endBlockNo: proposal.end.toString(),
        });
    }
    console.table(proposals);
}

module.exports = function (result) {
    return init()
        .then(tokenStatus)
        .then(propose)
        .then(result).catch(result);
}

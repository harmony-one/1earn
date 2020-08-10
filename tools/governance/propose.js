const yargs = require('yargs');
const argv = yargs
    .option('contract', {
        alias: 'c',
        description: 'The contract address',
        type: 'string'
    })
    .option('executor', {
        alias: 'e',
        description: 'The executor address of propose',
        type: 'string'
    })
    .option('hash', {
        alias: 'H',
        description: 'The hash field of propose',
        type: 'string'
    })
    .option('register', {
        alias: 'r',
        description: 'do register befor propose',
        type: 'bool'
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

let walletAddress// = OneEarnGovernance.currentProvider.addresses[0];

function argvCheck() {
    govAddress = argv.contract ? argv.contract : OneEarnGovernance.address;
    if (!govAddress)
        throw 'You must supply a contract address using --contract CONTRACT_ADDRESS or -c CONTRACT_ADDRESS!';
    if (argv.executor == null)
        throw 'You must supply a executor address, using --executor CONTRACT_EXECUTOR or -e CONTRACT_EXECUTOR'
    if (argv.hash == null)
        throw 'You must supply a hash, using --hash HASH or -H HASH'
}


async function init() {
    argvCheck();
    walletAddress = (await web3.eth.getAccounts())[0];
    govInstance = await OneEarnGovernance.at(govAddress);
    //tokenAddress = await govInstance.lpToken();
    //tokenInstance = await OneFI.at(tokenAddress);
}

//const web3 = require('web3');

async function tokenStatus() {
    console.log(`OneFI token address: ${tokenAddress}`);
    let total = await tokenInstance.totalSupply();
    console.log(`Current total supply of the hfi token is: ${web3.utils.fromWei(total)}`);

    let balance = await tokenInstance.balanceOf(walletAddress);
    console.log(`Balance of hfi token ${tokenAddress} for address ${walletAddress} is: ${web3.utils.fromWei(balance)}\n`);
}

async function propose() {
    console.log('before proposal:');
    let proposalCount = await govInstance.proposalCount();
    console.log(`\t proposalCount: ${proposalCount.toString()}`)
    let voteLock = await govInstance.voteLock(walletAddress);
    console.log(`\t voteLock of ${walletAddress}: ${voteLock.toString()}`)

    console.log('doing a proposal...')
    const proposeResult = await govInstance.propose(argv.executor, argv.hash);
    console.log(`Propose transaction hash: ${proposeResult.tx}\n`);

    console.log('after a proposal:');
    proposalCount = await govInstance.proposalCount();
    console.log(`\t proposalCount: ${proposalCount.toString()}`)
    voteLock = await govInstance.voteLock(walletAddress);
    console.log(`\t voteLock of ${walletAddress}: ${voteLock.toString()}`)

    const proposal = await govInstance.proposals(proposalCount - 1);
    console.log(`proposal(${proposalCount - 1}):`);
    console.table({
        id: proposal.id.toString(),
        proposer: toBech32(proposal.proposer),
        executor: toBech32(proposal.executor),
        hash: proposal.hash,
        totalAgree: proposal.totalForVotes.toString(),
        totalAgainst: proposal.totalAgainstVotes.toString(),
        startBlockNo: proposal.start.toString(),
        endBlockNo: proposal.end.toString(),
    });
}

module.exports = function (result) {
    return init()
        //.then(tokenStatus)
        .then(propose)
        .then(result).catch(result);
}

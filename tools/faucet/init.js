// Args
const yargs = require('yargs');
const argv = yargs
    .option('network', {
        alias: 'n',
        description: 'Which network to use',
        type: 'string',
        default: 'testnet'
    })
    .option('lp', {
      alias: 'l',
      description: 'The contract address for the liquidity provider token (hCRV)',
      type: 'string'
    })
    .option('contract', {
      alias: 'c',
      description: 'The faucet contract address',
      type: 'string'
    })
    .option('amount', {
      alias: 'a',
      description: 'The amount of tokens to send to the faucet',
      type: 'string'
    })
    .help()
    .alias('help', 'h')
    .argv;

const lpTokenAddress = argv.lp;
const faucetContractAddress = argv.contract;

if (lpTokenAddress == null || lpTokenAddress == '') {
  console.log('You must supply a lp token contract address using --lp CONTRACT_ADDRESS or -l CONTRACT_ADDRESS!');
  process.exit(0);
}

if (faucetContractAddress == null || faucetContractAddress == '') {
  console.log('You must supply the faucet contract address using --contract CONTRACT_ADDRESS or -c CONTRACT_ADDRESS!');
  process.exit(0);
}

if (argv.amount == null || argv.amount == '') {
  console.log('You must supply the amount of tokens to mint using --amount AMOUNT or -a AMOUNT! Amount is a normal number - not wei');
  process.exit(0);
}

// Libs
const web3 = require('web3');
const Network = require("../network.js");
const { getAddress } = require("@harmony-js/crypto");

// Vars
const network = new Network(argv.network);
const amount = web3.utils.toWei(argv.amount);

const lpTokenContract = network.loadContract(`../build/contracts/HCRV.json`, lpTokenAddress, 'deployer');
const lpTokenInstance = lpTokenContract.methods;

const faucetContract = network.loadContract(`../build/contracts/HRC20Faucet.json`, faucetContractAddress, 'deployer');
const faucetInstance = faucetContract.methods;

const walletAddress = lpTokenContract.wallet.signer.address;
const walletAddressBech32 = getAddress(walletAddress).bech32;

async function status() {
  let balanceOf = await lpTokenInstance.balanceOf(walletAddress).call(network.gasOptions());
  console.log(`hCRV (${lpTokenAddress}) balance for address ${walletAddress} / ${walletAddressBech32} is: ${web3.utils.fromWei(balanceOf)}\n`);

  let balance = await faucetInstance.balance().call(network.gasOptions());
  console.log(`The current balance of hCRV (${lpTokenAddress}) tokens in the faucet is: ${web3.utils.fromWei(balance)}`);
}

async function topup() {
  console.log(`Attempting to topup the hCRV faucet (${faucetContractAddress}) with ${argv.amount} tokens...`)
  let tx = await lpTokenInstance.transfer(faucetContractAddress, amount).send(network.gasOptions());
  let txHash = tx.transaction.receipt.transactionHash;
  console.log(`Faucet topup tx hash: ${txHash}\n`);
}

status()
  .then(() => {
    topup().then(() => {
      status().then(() => {
        process.exit(0);
      })
    })
  })
  .catch(function(err){
    console.log(err);
    process.exit(0);
  });

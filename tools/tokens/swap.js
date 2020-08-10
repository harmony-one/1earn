// Args
const yargs = require('yargs');
const argv = yargs
    .option('network', {
      alias: 'n',
      description: 'Which network to mint tokens on',
      type: 'string',
      default: 'testnet'
    })
    .option('token', {
      alias: 't',
      description: 'The WONE token contract address',
      type: 'string'
    })
    .option('amount', {
      alias: 'a',
      description: 'The amount of ONE tokens to swap for WONE',
      type: 'string'
    })
    .help()
    .alias('help', 'h')
    .argv;

let tokenAddress = argv.token;
let amountString = argv.amount;

if (tokenAddress == null || tokenAddress == '') {
  console.log('You must supply a token using --token TOKEN_NAME or -t TOKEN_NAME!');
  process.exit(0);
}

if (amountString == null || amountString == '') {
  console.log('You must supply the amount of ONE to swap for WONE using --amount AMOUNT or -a AMOUNT! Amount is a normal number - not wei');
  process.exit(0);
}

// Libs
const web3 = require('web3');
const Network = require("../network.js");
const { fromBech32, toBech32 } = require("@harmony-js/crypto");
const { hexToNumber} = require('@harmony-js/utils');

// Vars
const network = new Network(argv.network);
const amount = web3.utils.toWei(amountString);

const tokenContract = network.loadContract(`../build/contracts/WONE.json`, tokenAddress, 'tester');
const tokenInstance = tokenContract.methods;
const oneTokenAddress = toBech32(tokenAddress);

const walletAddress = tokenContract.wallet.signer.address;
const oneWalletAddress = toBech32(walletAddress);

async function display() {
  let total = await tokenInstance.totalSupply().call(network.gasOptions());
  let formattedTotal = web3.utils.fromWei(total);
  console.log(`Current total supply for the WONE token (address: ${oneTokenAddress} / ${tokenAddress}) is: ${formattedTotal}\n`);

  console.log(`Checking ONE balance for address: ${oneWalletAddress} (${walletAddress})`);
  let res = await network.hmy.blockchain.getBalance({address: oneWalletAddress});
  let balance = hexToNumber(res.result);
  console.log(`ONE Balance for address ${oneWalletAddress} (${walletAddress}) is now: ${web3.utils.fromWei(balance)} ONE\n`);

  let balanceOf = await tokenInstance.balanceOf(walletAddress).call(network.gasOptions());
  console.log(`wONE Balance for address ${oneWalletAddress} (${walletAddress}) is now: ${web3.utils.fromWei(balanceOf)} wONE\n`);
}

async function swapTo() {
  console.log(`Attempting to swap ${amountString} ONE for wONE token(s)...`);
  let result = await tokenInstance.depositAndApprove(walletAddress, amount).send({value: amount, ...network.gasOptions()});
  let txHash = result.transaction.receipt.transactionHash;
  console.log(`Swapped ${amountString} ONE for wONE token(s), tx hash: ${txHash}\n`);
}

async function swapFrom() {
  console.log(`\nSwapping back to ONE again - just to make sure everything works as expected...\n`);

  console.log(`Attempting to swap ${amountString} wONE token(s) for ONE...`);
  let result = await tokenInstance.withdrawAndTransfer(amount, walletAddress).send(network.gasOptions());
  let txHash = result.transaction.receipt.transactionHash;
  console.log(`Swapped ${amountString} wONE token(s) for ONE, tx hash: ${txHash}\n`);
}

display()
  .then(() => {
    swapTo().then(() => {
      display().then(() => {
        swapFrom().then(() => {
          display().then(() => {
            process.exit(0);
          });
        })
      })
    })
  })
  .catch(function(err){
    console.log(err);
    process.exit(0);
  });

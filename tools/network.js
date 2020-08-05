'use strict';

const web3 = require('web3');
require("dotenv").config();
const { Harmony } = require("@harmony-js/core");
const { ChainID, ChainType } = require("@harmony-js/utils");

module.exports = class Network {
  constructor(network) {
    this.hmy = null;
    this.privateKey = null;
    this.setNetwork(network);
    this.gasPrice = process.env.GAS_PRICE;
    this.gasLimit = process.env.GAS_LIMIT;
  }

  setNetwork(network) {
    this.network = network.toLowerCase();

    switch (this.network) {
      case 'testnet':
        console.log('Using the testnet network...\n');
        this.hmy = new Harmony(
          // let's assume we deploy smart contract to this end-point URL
          "https://api.s0.b.hmny.io",
          {
            chainType: ChainType.Harmony,
            chainId: ChainID.HmyTestnet,
          }
        );
        this.privateKey = process.env[`${this.network.toUpperCase()}_PRIVATE_KEY`];
        break;
      
      case 'mainnet':
        console.log('Using the mainnet network...\n');
        this.hmy = new Harmony(
          // let's assume we deploy smart contract to this end-point URL
          "https://api.s0.t.hmny.io",
          {
            chainType: ChainType.Harmony,
            chainId: ChainID.HmyMainnet,
          }
        );
        this.privateKey = process.env[`${this.network.toUpperCase()}_PRIVATE_KEY`];
        break;
      
      default:
        console.log('Please enter a valid network - testnet or mainnet.');
        throw new Error('NetworkRequired');
      }
  }

  gasOptions() {
    return {
      gasPrice: this.gasPrice,
      gasLimit: this.gasLimit,
    }
  }

  loadContract(path, address) {
    const contractJson = require(path);
    const contract = this.hmy.contracts.createContract(contractJson.abi, address);
    contract.wallet.addByPrivateKey(this.privateKey);
    return contract;
  }

};

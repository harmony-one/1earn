# HFI - Fork of YFI on Harmony
This repository contains smart contracts and build instructions for porting [YFI](https://yearn.finance)'s governance smart contracts to [Harmony](http://harmony.one) for Harmony's #DeFi Hackathon during week 32.

A lot of components - e.g. yCRV - will currently be mocked to ensure a MVP can be created.

### Requirements 

* nodejs 
* truffle
* solidity (solc)

## Installation instructions
```
./scripts/install.sh
```

Set up your .env file:
```
cp .env-example .env
```
Update .env to include the private keys for the deployer wallets you want to use.

## Compilation
```
./scripts/build.sh
```

## Deployment
**NOTE:** Truffle deployments currently require that you have NodeJS v12 (and not latest v14) installed due to some package incompatibilities.

Testnet:
```
truffle migrate --reset --network testnet
```

Mainnet:
```
truffle migrate --reset --network mainnet
```

## Interaction/testing

To simplify testing of the contracts, it's advisable to set bash variables for the various tokens and contracts involved in the system.

After you've deployed with e.g. `truffle migrate --reset --network testnet` store the resulting addresses of the contracts using e.g:
```
hfi=0xAEc013B67205D47A0685d9E3cE387248a4c35488; hcrv=0x71c2461B6127639866dCD23f5460CDEf85D82152; rewards=0x65f22d3D8b3D9824AdBC30026304FE936d587266
```

Then when you interact with the various tools, just use the bash variable where a contract address is expected.

## Tools

### Tokens

#### Minting
tools/tokens/mint.js - mints new tokens for a given token & contract

```
node tools/tokens/mint.js --network NETWORK --amount AMOUNT --token TOKEN --contract CONTRACT
```

E.g. for HFI & hCRV:

```
node tools/tokens/mint.js --network testnet --amount 1000 --token HFI --contract $hfi
node tools/tokens/mint.js --network testnet --amount 1000 --token hCRV --contract $hcrv
```

#### Faucet
tools/faucet/init.js - initialize a HRC20 token faucet (in our case - a faucet for hCRV) for a given token with the specified amount of funds
```
node tools/faucet/init.js --network testnet --token $hcrv --contract $faucet --amount 10000000
```

tools/faucet/fund.js - fund an account using the HRC20 faucet (hCRV tokens):
```
node tools/faucet/fund.js --network testnet --token $hcrv --contract $faucet
```

### Rewards

#### Contract initialization
To initialize the rewards system (so that people staking their hCRV will start earning HFI rewards) you need to run `tools/rewards/init.js`:

```
node tools/rewards/init.js --network testnet --contract $rewards --amount 10000
```

This will initialize the rewards contract and make it possible for stakers to earn HFI rewards for 1 week from the time of initialization.

#### Staking

##### stake.js
tools/staking/stake.js - will start staking hCRV tokens with [the rewards contract](contracts/rewards/YearnRewards.sol).

```
node tools/staking/stake.js --network testnet --lp $hcrv --rewards $rewards --amount 10000
```

##### status.js
tools/staking/status.js - will show status for the current staking to [the rewards contract](contracts/rewards/YearnRewards.sol).

```
node tools/staking/status.js --network testnet --gov $hfi --lp $hcrv --rewards $rewards
```

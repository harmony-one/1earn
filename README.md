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

After you've deployed with e.g. `truffle migrate --reset --network testnet` the deploy script will output a line of bash variables containing all contract addresses, e.g:
```
hfi=0x3Ac8E1ad4450FA8aCcc780a71bA8c378eE9429B1; hcrv=0x710B540E36028b0f8B84B88B5541257D516DE891; faucet=0x2F318989eB2ebd143aeb09f0B73E49726F2C63aC; rewards=0x9eEEfd308DA51944c1dc8A84E8750D7Aea823f1F
```

Copy that line and paste it into your terminal and hit enter.

You can now copy & paste the tool examples in this README to interact with the various interaction tools in this repo.

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
node tools/faucet/init.js --network testnet --token $hcrv --contract $faucet --amount 100000
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

### Governance

#### Contract initialization
To initialize the governance system (so that people staking their HFI will start earning hCRV rewards) you need to run `tools/governance/init.js`:

```
cd tools/governance
./run.sh init.js --amount 10000
```

This will initialize the rewards contract and make it possible for stakers to earn HFI rewards for 1 week from the time of initialization.

#### Staking
tools/governance/stake.js - will start staking HFI tokens with [the governance contract](contracts/rewards/YearnGovernance.sol).

```
cd tools/governance
./run.sh stake.js --amount 1
```

#### Propose
tools/governance/propose.js - will start a proposing with [the governance contract](contracts/rewards/YearnGovernance.sol). Before do that, you need to stake HFI, if you haven't. 

```
cd tools/governance
./run.sh propose.js
```

This will display the proposal ID in the end.


##### status.js
tools/governance/status.js - will show status of the current proposals with [the governance contract](contracts/rewards/YearnGovernance.sol).

```
cd tools/governance
./run.sh status.js --start=0 --amount=5
```

#### Vote
tools/governance/vote.js - VoteFor or VoteAgainst a proposal by Propose. You need to provide the proposal ID by `--id=ProposalID`.

```shell
cd tools/governance
# vote for
./run.sh vote.js --id=0
# vote against
./run.sh vote.js --id=0 --against
```
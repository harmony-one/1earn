# 1earn.finance - Fork of YFI on Harmony
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

After you've deployed with e.g. `truffle migrate --reset --network testnet` the deploy script will output a line of bash env variables containing all contract addresses, e.g:
```
export NETWORK=testnet; export ONEFI=0xFD9d389f7462348F09170a0a4739Caa699423565; export ONECRV=0x63c2b8a55e8b27C604bD19794bB76d68154afb32; export WONE=0xf21df8E1Fa50C46857C7680377423E79ab95F814; export FAUCET=0x0450E78b146fdbae04dc6CBd07eEC8Bf45f65F1F; export RESTRICTEDFAUCET=0xe6f4E5d9F9C8590442A57876D40D0677A75bBCA7; export REWARDS=0x6C97d6aF8813721FF22A7f62Ef2Cf9B864EAc988; export GOVERNANCE=0x8A13383BDdc46Fd46b6130f96956C8e06A8cb637
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

E.g. for 1FI & 1CRV:

```
node tools/tokens/mint.js --network $NETWORK --token OneFI --contract $ONEFI --amount 10000
node tools/tokens/mint.js --network $NETWORK --token OneCRV --contract $ONECRV --amount 1000000
```

#### Swapping, ONE -> wONE
tools/tokens/swap.js - swap ONE for WONE
```
node tools/tokens/swap.js --network $NETWORK --token $WONE --amount 1
```

#### Faucet
##### Normal faucet
tools/faucet/init.js - initialize a HRC20 token faucet (in our case - a faucet for 1CRV) for a given token with the specified amount of funds
```
node tools/faucet/init.js --network $NETWORK --token $ONECRV --contract $FAUCET --amount 100000
```

tools/faucet/fund.js - fund an account using the HRC20 faucet (1CRV tokens):
```
node tools/faucet/fund.js --network $NETWORK --token $ONECRV --contract $FAUCET
```

##### Restricted faucet
The restricted faucet will only allow one funding request - all subsequent funding requests will be denied.

tools/faucet/init.js - initialize a HRC20 token faucet (in our case - a faucet for 1CRV) for a given token with the specified amount of funds
```
node tools/faucet/init.js --network $NETWORK --token $ONECRV --contract $RESTRICTEDFAUCET --amount 100000
```

tools/faucet/fund.js - fund an account using the HRC20 faucet (1CRV tokens):
```
node tools/faucet/fund.js --network $NETWORK --token $ONECRV --contract $RESTRICTEDFAUCET
```

### Rewards

#### Contract initialization
To initialize the rewards system (so that people staking their 1CRV will start earning 1FI rewards) you need to run `tools/rewards/init.js`:

```
node tools/rewards/init.js --network $NETWORK --token $ONEFI --contract $REWARDS --amount 10000
```

This will initialize the rewards contract and make it possible for stakers to earn 1FI rewards for 1 week from the time of initialization.

#### Staking

##### stake.js
tools/staking/stake.js - will start staking 1CRV tokens with [the rewards contract](contracts/rewards/OneEarnRewards.sol).

```
node tools/staking/stake.js --network $NETWORK --lp $ONECRV --rewards $REWARDS --amount 10000
```

##### status.js
tools/staking/status.js - will show status for the current staking to [the rewards contract](contracts/rewards/OneEarnRewards.sol).

```
node tools/staking/status.js --network $NETWORK --gov $ONEFI --lp $ONECRV --rewards $REWARDS
```

##### claim.js
tools/staking/claim.js - claim staking rewards from [the rewards contract](contracts/rewards/OneEarnRewards.sol).

```
node tools/staking/claim.js --network $NETWORK --gov $ONEFI --lp $ONECRV --rewards $REWARDS
```

### Governance

#### Contract initialization
To initialize the governance system (so that people staking their 1FI will start earning 1CRV rewards) you need to run `tools/governance/init.js`:

```
node tools/governance/init.js --network $NETWORK --token $ONECRV --contract $GOVERNANCE --amount 1000000
```

This will initialize the rewards contract and make it possible for stakers to earn 1FI rewards for 1 week from the time of initialization.

#### Staking
tools/governance/stake.js - will start staking 1FI tokens with [the governance contract](contracts/rewards/OneEarnGovernance.sol).

```
cd tools/governance
./run.sh stake.js --amount 1
```

#### Propose
tools/governance/propose.js - will start a proposing with [the governance contract](contracts/rewards/OneEarnGovernance.sol). Before do that, you need to stake 1FI, if you haven't. 

```
cd tools/governance
./run.sh propose.js
```

This will display the proposal ID in the end.


##### status.js
tools/governance/status.js - will show status of the current proposals with [the governance contract](contracts/rewards/OneEarnGovernance.sol).

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

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

Truffle Develop:
1. start Truffle Develop
```
truffle develop
```
2. deploy contract
```
truffle migrate --reset --network develop
```

## Interaction/testing

To simplify testing of the contracts, it's advisable to set bash variables for the various tokens and contracts involved in the system.

After you've deployed with e.g. `truffle migrate --reset --network testnet` the deploy script will output a line of bash variables containing all contract addresses, e.g:
```
network=testnet; onefi=0x39A239327aB82ED6A26C89F771B96882956570A0; onecrv=0x26E4a10625608928e16A59479C96b0Dcbdec3C95; faucet=0x5d171c65b6eb883F0D04d9f718A9E0908DEFF741; rewards=0x5c2BfcC1f7Cceb06aF497E101aF8f17011e8Ae0D; governance=0xD58b7A022b20EddB42Bb63f337CD59A871e86447
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
node tools/tokens/mint.js --network $network --amount 1000 --token OneFI --contract $onefi
node tools/tokens/mint.js --network $network --amount 1000 --token OneCRV --contract $onecrv
```

#### Faucet
tools/faucet/init.js - initialize a HRC20 token faucet (in our case - a faucet for 1CRV) for a given token with the specified amount of funds
```
node tools/faucet/init.js --network $network --token $onecrv --contract $faucet --amount 100000
```

tools/faucet/fund.js - fund an account using the HRC20 faucet (1CRV tokens):
```
node tools/faucet/fund.js --network $network --token $onecrv --contract $faucet
```

### Rewards

#### Contract initialization
To initialize the rewards system (so that people staking their 1CRV will start earning 1FI rewards) you need to run `tools/rewards/init.js`:

```
node tools/rewards/init.js --network $network --token $onefi --contract $rewards --amount 10000
```

This will initialize the rewards contract and make it possible for stakers to earn 1FI rewards for 1 week from the time of initialization.

#### Staking

##### stake.js
tools/staking/stake.js - will start staking 1CRV tokens with [the rewards contract](contracts/rewards/OneEarnRewards.sol).

```
node tools/staking/stake.js --network $network --lp $onecrv --rewards $rewards --amount 10000
```

##### status.js
tools/staking/status.js - will show status for the current staking to [the rewards contract](contracts/rewards/OneEarnRewards.sol).

```
node tools/staking/status.js --network $network --gov $onefi --lp $onecrv --rewards $rewards
```

##### claim.js
tools/staking/claim.js - claim staking rewards from [the rewards contract](contracts/rewards/OneEarnRewards.sol).

```
node tools/staking/claim.js --network $network --gov $onefi --lp $onecrv --rewards $rewards
```

### Governance

#### Contract initialization
To initialize the governance system (so that people staking their 1FI will start earning 1CRV rewards) you need to run `tools/governance/init.js`:

```
cd tools/governance
network=testnet ./run.sh init.js --amount 1000000
```

This will initialize the rewards contract and make it possible for stakers to earn 1FI rewards for 1 week from the time of initialization.

#### Staking
tools/governance/stake.js - will start staking 1FI tokens with [the governance contract](contracts/rewards/OneEarnGovernance.sol).

```
cd tools/governance
network=testnet ./run.sh stake.js --amount 1
```

#### Propose
tools/governance/propose.js - will start a proposing with [the governance contract](contracts/rewards/OneEarnGovernance.sol). Before do that, you need to stake 1FI, if you haven't. 

```
cd tools/governance
network=testnet  ./run.sh propose.js
```

This will display the proposal ID in the end.


#### Status
tools/governance/status.js - will show status of the current proposals with [the governance contract](contracts/rewards/OneEarnGovernance.sol).

```
cd tools/governance
network=testnet ./run.sh status.js --start=0 --amount=5
```

#### Vote
tools/governance/vote.js - VoteFor or VoteAgainst a proposal by Propose. You need to provide the proposal ID by `--id=ProposalID`.

```shell
cd tools/governance
# vote for
network=testnet ./run.sh vote.js --id=0
# vote against
network=testnet ./run.sh vote.js --id=0 --against
```

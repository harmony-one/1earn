#!/usr/bin/env bash

oneFIInitialSupply=90000
oneCRVInitialSupply=10000000
faucetAmount=1000000
restrictedFaucetAmount=1000000
rewardsAmount=100000
governanceRewardsAmount=1000000

echo ""
echo "--------------------------------------------------------------------------------------------------------------"
echo "Initializng all contracts..."
echo "--------------------------------------------------------------------------------------------------------------"
echo ""

echo ""
echo "--------------------------------------------------------------------------------------------------------------"
echo "Minting OneFi tokens..."
node tools/tokens/mint.js --network $NETWORK --token OneFI --contract $ONEFI --amount $oneFIInitialSupply
echo "--------------------------------------------------------------------------------------------------------------"
echo ""

#echo ""
#echo "--------------------------------------------------------------------------------------------------------------"
#echo "Minting OneCRV tokens..."
#node tools/tokens/mint.js --network $NETWORK --token OneCRV --contract $ONECRV --amount $oneCRVInitialSupply
#echo "--------------------------------------------------------------------------------------------------------------"
#echo ""

echo ""
echo "--------------------------------------------------------------------------------------------------------------"
echo "Initializing OneCRV regular faucet..."
node tools/faucet/init.js --network $NETWORK --token $ONECRV --contract $FAUCET --amount $faucetAmount
echo "--------------------------------------------------------------------------------------------------------------"
echo ""

#echo ""
#echo "--------------------------------------------------------------------------------------------------------------"
#echo "Initializing OneCRV restricted faucet..."
#node tools/faucet/init.js --network $NETWORK --token $ONECRV --contract $RESTRICTEDFAUCET --amount $restrictedFaucetAmount
#echo "--------------------------------------------------------------------------------------------------------------"
#echo ""

echo ""
echo "--------------------------------------------------------------------------------------------------------------"
echo "Initializing OneFI rewards..."
node tools/rewards/init.js --network $NETWORK --token $ONEFI --contract $REWARDS --amount $rewardsAmount
echo "--------------------------------------------------------------------------------------------------------------"
echo ""

echo ""
echo "--------------------------------------------------------------------------------------------------------------"
echo "Initializing OneCRV rewards..."
node tools/governance/init.js --network $NETWORK --token $ONECRV --contract $GOVERNANCE --amount $governanceRewardsAmount
echo "--------------------------------------------------------------------------------------------------------------"
echo ""

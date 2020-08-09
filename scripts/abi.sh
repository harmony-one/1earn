#!/usr/bin/env bash
rm -rf build/abi
mkdir -p build/abi

contracts=(
ERC20
HRC20Faucet
OneCRV
OneEarnGovernance
OneEarnRewards
OneFI
WONE
)

for contract in "${contracts[@]}"; do
  cat build/contracts/${contract}.json | jq -c '.abi' > build/abi/${contract}.json
done

cd build/abi

tar -czvf abi.tar.gz *.json


#!/usr/bin/env bash
rm -rf build/bundle.tar.gz

cd build/contracts
tar -czvf bundle.tar.gz ERC20.json HRC20Faucet.json OneCRV.json OneEarnGovernance.json OneEarnRewards.json OneFI.json
mv bundle.tar.gz ../

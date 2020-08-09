#!/usr/bin/env bash
network=$1
if [ -z "$network" ]; then
  network="testnet"
fi

reset=$2
if [ ! -z "$reset" ]; then
  reset="--reset"
fi

echo "Deploying using truffle - network: ${network}, reset: ${reset}"
truffle migrate --network $network --skip-dry-run $reset

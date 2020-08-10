if [ $# -eq 0 ];then
    echo "example:"
    echo "./run.sh stake.js -a 1"
    echo "./run.sh propose.js"
    echo "./run.sh vote.js -i 0"
    echo "./run.sh stake.js -h"
    exit -1
fi

if [ -z $network ];then
    network="develop"
fi

truffle --network=$network exec $@

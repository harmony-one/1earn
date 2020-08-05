pragma solidity >=0.4.21 <0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";

interface Gov {
    function setGovernance(address) external;
}

contract TimelockGovernance {
    using SafeMath for uint;

    uint public period = 17280; // voting period in blocks ~ 17280 3 days for 15s/block
    // TODO: set to e.g. 51840 due to 5s block time on Harmony to match 3 day voting lock
    address public governance;
    address public newGovernance;
    uint public newGovernanceUpdatable;
    address public target;
    address public newTargetGovernance;
    uint public newTargetGovernanceUpdatable;

    constructor(address _multisig, address _target) public {
        governance = _multisig;
        newGovernance = governance;
        target = _target;
        newTargetGovernance = address(this);
    }

    function setThisGovernance(address _governance) external {
        require(governance == msg.sender);
        newGovernanceUpdatable = period.add(block.number);
        newGovernance = _governance;
    }

    function updateThisGovernance() external {
        require(newGovernanceUpdatable < block.number, "<block.number");
        governance = newGovernance;
    }

    function setTargetGovernance(address _governance) external {
        require(governance == msg.sender);
        newTargetGovernanceUpdatable = period.add(block.number);
        newTargetGovernance = _governance;
    }

    function updateTargetGovernance() external {
        require(newTargetGovernanceUpdatable < block.number, "<block.number");
        Gov(target).setGovernance(newTargetGovernance);
    }
}

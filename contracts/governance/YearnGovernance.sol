pragma solidity >=0.4.21 <0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./GovTokenWrapper.sol";
import "../rewards/IRewardDistributionRecipient.sol";

contract YearnGovernance is GovTokenWrapper, IRewardDistributionRecipient {

    /* Fee collection for any other token */

    function seize(IERC20 _token, uint amount) external {
        require(msg.sender == governance, "!governance");
        require(_token != yfi, "yfi");
        require(_token != vote, "yfi");
        _token.safeTransfer(governance, amount);
    }

    /* Fees breaker, to protect withdraws if anything ever goes wrong */

    bool public breaker = false;

    function setBreaker(bool _breaker) external {
        require(msg.sender == governance, "!governance");
        breaker = _breaker;
    }

    /* Modifications for proposals */

    mapping(address => uint) public voteLock; // period that your sake it locked to keep it for voting

    struct Proposal {
        uint id;
        address proposer;
        mapping(address => uint) forVotes;
        mapping(address => uint) againstVotes;
        uint totalForVotes;
        uint totalAgainstVotes;
        uint start; // block start;
        uint end; // start + period
    }

    mapping (uint => Proposal) public proposals;
    uint public proposalCount;
    uint public period = 17280; // voting period in blocks ~ 17280 3 days for 15s/block
    uint public lock = 17280; // vote lock in blocks ~ 17280 3 days for 15s/block
    uint public minimum = 1e18;
    bool public config = true;


    address public governance;

    function setGovernance(address _governance) public {
        require(msg.sender == governance, "!governance");
        governance = _governance;
    }

    function setMinimum(uint _minimum) public {
        require(msg.sender == governance, "!governance");
        minimum = _minimum;
    }

    function setPeriod(uint _period) public {
        require(msg.sender == governance, "!governance");
        period = _period;
    }

    function setLock(uint _lock) public {
        require(msg.sender == governance, "!governance");
        lock = _lock;
    }

    function initialize() public {
        require(config == true, "!config");
        config = false;
        governance = 0xFEB4acf3df3cDEA7399794D0869ef76A6EfAff52;
    }

    function propose() public {
        require(balanceOf(msg.sender) > minimum, "<minimum");
        proposals[proposalCount++] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            totalForVotes: 0,
            totalAgainstVotes: 0,
            start: block.number,
            end: period.add(block.number)
        });

        voteLock[msg.sender] = lock.add(block.number);
    }

    function voteFor(uint id) public {
        require(proposals[id].start < block.number , "<start");
        require(proposals[id].end > block.number , ">end");
        uint votes = balanceOf(msg.sender).sub(proposals[id].forVotes[msg.sender]);
        proposals[id].totalForVotes = proposals[id].totalForVotes.add(votes);
        proposals[id].forVotes[msg.sender] = balanceOf(msg.sender);

        voteLock[msg.sender] = lock.add(block.number);
    }

    function voteAgainst(uint id) public {
        require(proposals[id].start < block.number , "<start");
        require(proposals[id].end > block.number , ">end");
        uint votes = balanceOf(msg.sender).sub(proposals[id].againstVotes[msg.sender]);
        proposals[id].totalAgainstVotes = proposals[id].totalAgainstVotes.add(votes);
        proposals[id].againstVotes[msg.sender] = balanceOf(msg.sender);

        voteLock[msg.sender] = lock.add(block.number);
    }

    /* Default rewards contract */

    // Original yfi token address: 0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e
    IERC20 public yfi = IERC20(0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e); // TODO: replace with HFI contract address

    uint256 public constant DURATION = 7 days;

    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return Math.min(block.timestamp, periodFinish);
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply() == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored.add(
                lastTimeRewardApplicable()
                    .sub(lastUpdateTime)
                    .mul(rewardRate)
                    .mul(1e18)
                    .div(totalSupply())
            );
    }

    function earned(address account) public view returns (uint256) {
        return
            balanceOf(account)
                .mul(rewardPerToken().sub(userRewardPerTokenPaid[account]))
                .div(1e18)
                .add(rewards[account]);
    }

    // stake visibility is public as overriding LPTokenWrapper's stake() function
    function stake(uint256 amount) public updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        super.stake(amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        if (breaker == false) {
            require(voteLock[msg.sender] < block.number,"!locked");
        }
        super.withdraw(amount);
        emit Withdrawn(msg.sender, amount);
    }

    function exit() external {
        withdraw(balanceOf(msg.sender));
        getReward();
    }

    function getReward() public updateReward(msg.sender) {
        uint256 reward = earned(msg.sender);
        if (reward > 0) {
            rewards[msg.sender] = 0;
            yfi.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function notifyRewardAmount(uint256 reward)
        external
        onlyRewardDistribution
        updateReward(address(0))
    {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward.div(DURATION);
        } else {
            uint256 remaining = periodFinish.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = reward.add(leftover).div(DURATION);
        }
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp.add(DURATION);
        emit RewardAdded(reward);
    }
}
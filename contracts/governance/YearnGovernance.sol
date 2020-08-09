pragma solidity >=0.4.21 <0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "../rewards/LPTokenWrapper.sol";
import "../rewards/IRewardDistributionRecipient.sol";

interface Executor {
    function execute(uint, uint, uint, uint) external;
}

contract YearnGovernance is LPTokenWrapper, IRewardDistributionRecipient {
  
  IERC20 public rewardToken;

  constructor(address _lpToken, address _rewardToken, uint256 _proposalCount) public LPTokenWrapper(_lpToken) {
    require(_rewardToken != address(0), "YearnRewards: can't set the governance token address to the zero address");
    rewardToken = IERC20(_rewardToken);
    governance = msg.sender;
    initialize(_proposalCount);
  }

    /* Fee collection for any other token */
    
    function seize(IERC20 _token, uint amount) external {
        require(msg.sender == governance, "!governance");
        require(_token != lpToken, "lpToken");
        require(_token != rewardToken, "rewardToken");
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
        address executor;
        string hash;
        uint totalVotesAvailable;
        uint quorum;
        uint quorumRequired;
        bool open;
    }
    
    mapping (uint => Proposal) public proposals;
    uint public proposalCount;
    uint public period = 17280; // 1 day on Harmony, 1 block = 5s - original: voting period in blocks ~ 17280 3 days for 15s/block
    uint public lock = 17280; // 1 day on Harmony, 1 block = 5s - original: vote lock in blocks ~ 17280 3 days for 15s/block
    uint public minimum = 0; //Enable creating proposals without having voted before - kinda chicken & egg problem when minimum >= 0 w/0 previous votes - default: 1e18;
    uint public quorum = 2000;
    bool public config = true;
    
    
    address public governance;
    
    function setGovernance(address _governance) public {
        require(msg.sender == governance, "!governance");
        governance = _governance;
    }
    
    function setQuorum(uint _quorum) public {
        require(msg.sender == governance, "!governance");
        quorum = _quorum;
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
    
    function initialize(uint id) public {
        require(config == true, "!config");
        config = false;
        proposalCount = id;
        //governance = 0xFEB4acf3df3cDEA7399794D0869ef76A6EfAff52;
    }
    
    event NewProposal(uint id, address creator, uint start, uint duration, address executor);
    event Vote(uint indexed id, address indexed voter, bool vote, uint weight);
    
    function propose(address executor, string memory hash) public {
        require(votesOf(msg.sender) >= minimum, "<minimum");
        proposals[proposalCount++] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            totalForVotes: 0,
            totalAgainstVotes: 0,
            start: block.number,
            end: period.add(block.number),
            executor: executor,
            hash: hash,
            totalVotesAvailable: totalVotes,
            quorum: 0,
            quorumRequired: quorum,
            open: true
        });
        
        emit NewProposal(proposalCount, msg.sender, block.number, period, executor);
        voteLock[msg.sender] = lock.add(block.number);
    }
    
    function execute(uint id) public {
        (uint _for, uint _against, uint _quorum) = getStats(id);
        require(proposals[id].quorumRequired < _quorum, "!quorum");
        require(proposals[id].end < block.number , "!end");
        if (proposals[id].open == true) {
            tallyVotes(id);
        }
        Executor(proposals[id].executor).execute(id, _for, _against, _quorum);
    }
    
    function getStats(uint id) public view returns (uint _for, uint _against, uint _quorum) {
        _for = proposals[id].totalForVotes;
        _against = proposals[id].totalAgainstVotes;
        
        uint _total = _for.add(_against);
        _for = _for.mul(10000).div(_total);
        _against = _against.mul(10000).div(_total);
        
        _quorum = _total.mul(10000).div(proposals[id].totalVotesAvailable);
    }
    
    event ProposalFinished(uint indexed id, uint _for, uint _against, bool quorumReached);
    
    function tallyVotes(uint id) public {
        require(proposals[id].open == true, "!open");
        require(proposals[id].end < block.number, "!end");
        
        (uint _for, uint _against,) = getStats(id);
        bool _quorum = false;
        if (proposals[id].quorum >= proposals[id].quorumRequired) {
            _quorum = true;
        }
        proposals[id].open = false;
        emit ProposalFinished(id, _for, _against, _quorum);
    }
    
    function votesOf(address voter) public view returns (uint) {
        return votes[voter];
    }
    
    uint public totalVotes;
    mapping(address => uint) public votes;
    event RegisterVoter(address voter, uint votes, uint totalVotes);
    event RevokeVoter(address voter, uint votes, uint totalVotes);
    
    function register() public {
        require(voters[msg.sender] == false, "voter");
        voters[msg.sender] = true;
        votes[msg.sender] = balanceOf(msg.sender);
        totalVotes = totalVotes.add(votes[msg.sender]);
        emit RegisterVoter(msg.sender, votes[msg.sender], totalVotes);
    }
    
    
    function revoke() public {
        require(voters[msg.sender] == true, "!voter");
        voters[msg.sender] = false;
        if (totalVotes < votes[msg.sender]) {
            //edge case, should be impossible, but this is defi
            totalVotes = 0;
        } else {
            totalVotes = totalVotes.sub(votes[msg.sender]);
        }
        emit RevokeVoter(msg.sender, votes[msg.sender], totalVotes);
        votes[msg.sender] = 0;
    }
    
    mapping(address => bool) public voters;
    
    function voteFor(uint id) public {
        require(proposals[id].start < block.number , "<start");
        require(proposals[id].end > block.number , ">end");
        
        uint _against = proposals[id].againstVotes[msg.sender];
        if (_against > 0) {
            proposals[id].totalAgainstVotes = proposals[id].totalAgainstVotes.sub(_against);
            proposals[id].againstVotes[msg.sender] = 0;
        }
        
        uint vote = votesOf(msg.sender).sub(proposals[id].forVotes[msg.sender]);
        proposals[id].totalForVotes = proposals[id].totalForVotes.add(vote);
        proposals[id].forVotes[msg.sender] = votesOf(msg.sender);
        
        proposals[id].totalVotesAvailable = totalVotes;
        uint _votes = proposals[id].totalForVotes.add(proposals[id].totalAgainstVotes);
        proposals[id].quorum = _votes.mul(10000).div(totalVotes);
        
        voteLock[msg.sender] = lock.add(block.number);
        
        emit Vote(id, msg.sender, true, vote);
    }
    
    function voteAgainst(uint id) public {
        require(proposals[id].start < block.number , "<start");
        require(proposals[id].end > block.number , ">end");
        
        uint _for = proposals[id].forVotes[msg.sender];
        if (_for > 0) {
            proposals[id].totalForVotes = proposals[id].totalForVotes.sub(_for);
            proposals[id].forVotes[msg.sender] = 0;
        }
        
        uint vote = votesOf(msg.sender).sub(proposals[id].againstVotes[msg.sender]);
        proposals[id].totalAgainstVotes = proposals[id].totalAgainstVotes.add(vote);
        proposals[id].againstVotes[msg.sender] = votesOf(msg.sender);
        
        proposals[id].totalVotesAvailable = totalVotes;
        uint _votes = proposals[id].totalForVotes.add(proposals[id].totalAgainstVotes);
        proposals[id].quorum = _votes.mul(10000).div(totalVotes);
        
        voteLock[msg.sender] = lock.add(block.number);
        
        emit Vote(id, msg.sender, false, vote);
    }
    
    /* Default rewards contract */
    
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
        if (voters[msg.sender] == true) {
            votes[msg.sender] = votes[msg.sender].add(amount);
            totalVotes = totalVotes.add(amount);
        }
        super.stake(amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        if (voters[msg.sender] == true) {
            votes[msg.sender] = votes[msg.sender].sub(amount);
            totalVotes = totalVotes.sub(amount);
        }
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
        if (breaker == false) {
            require(voteLock[msg.sender] > block.number,"!voted");
        }
        uint256 reward = earned(msg.sender);
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
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
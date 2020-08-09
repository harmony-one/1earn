pragma solidity >=0.4.21 <0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract LPTokenWrapper {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public lpToken;

    constructor(address _lpToken) public {
        require(_lpToken != address(0), "LPTokenWrapper: can't set the lp token address to the zero address");
        lpToken = IERC20(_lpToken);
    }

    // Original yCRV token address: 0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8
    //IERC20 public lpToken = IERC20(0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8); // Change this to the LP token address - in our case: 1CRV

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function stake(uint256 amount) public {
        _totalSupply = _totalSupply.add(amount);
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        lpToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) public {
        _totalSupply = _totalSupply.sub(amount);
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        lpToken.safeTransfer(msg.sender, amount);
    }
}

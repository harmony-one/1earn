pragma solidity >=0.4.21 <0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract GovTokenWrapper {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Original yfi token address: 0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e
    IERC20 public HFI = IERC20(0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e); // TODO: replace with HFI contract address

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
        HFI.safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) public {
        _totalSupply = _totalSupply.sub(amount);
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        HFI.safeTransfer(msg.sender, amount);
    }
}

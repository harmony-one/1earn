pragma solidity >=0.4.21 <0.6.0;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { UnlimitedAllowanceToken } from "./UnlimitedAllowanceToken.sol";

contract WONE is UnlimitedAllowanceToken {
  using SafeMath for uint256;

  /* ============ Constants ============ */

  string constant public name = "Wrapped ONE"; // solium-disable-line uppercase
  string constant public symbol = "wONE"; // solium-disable-line uppercase
  uint256 constant public decimals = 18; // solium-disable-line uppercase

  /* ============ Events ============ */

  event Deposit(address indexed dest, uint256 amount);
  event Withdrawal(address indexed src, uint256 amount);

  /* ============ Constructor ============ */

  constructor () public { }

  /* ============ Public functions ============ */

  /**
   * @dev Fallback function can be used to buy tokens by proxying the call to deposit()
   */
  function() external payable {
    deposit();
  }

  /* ============ New functionality ============ */

  /**
   * Buys tokens with Ether, exchanging them 1:1 and sets the spender allowance
   *
   * @param _spender          Spender address for the allowance
   * @param _allowance        Allowance amount
   */
  function depositAndApprove(address _spender, uint256 _allowance) public payable returns (bool) {
    deposit();
    approve(_spender, _allowance);
    return true;
  }

  /**
   * Withdraws from msg.sender's balance and transfers to a target address instead of msg.sender
   *
   * @param _amount           Amount to withdraw
   * @param _target           Address to send the withdrawn ETH
   */
  function withdrawAndTransfer(uint256 _amount, address payable _target) public returns (bool) {
    require(balances[msg.sender] >= _amount, "Insufficient user balance");
    require(_target != address(0), "Invalid target address");

    balances[msg.sender] = balances[msg.sender].sub(_amount);
    totalSupply = totalSupply.sub(_amount);
    _target.transfer(_amount);

    emit Withdrawal(msg.sender, _amount);
    return true;
  }

  /* ============ Standard WETH functionality ============ */

  function deposit() public payable returns (bool) {
    balances[msg.sender] = balances[msg.sender].add(msg.value);
    totalSupply = totalSupply.add(msg.value);
    emit Deposit(msg.sender, msg.value);
    return true;
  }

  function withdraw(uint256 _amount) public returns (bool) {
    require(balances[msg.sender] >= _amount, "Insufficient user balance");

    balances[msg.sender] = balances[msg.sender].sub(_amount);
    totalSupply = totalSupply.sub(_amount);
    msg.sender.transfer(_amount);

    emit Withdrawal(msg.sender, _amount);
    return true;
  }
}
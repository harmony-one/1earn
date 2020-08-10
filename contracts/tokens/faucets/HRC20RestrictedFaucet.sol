pragma solidity >=0.4.21 <0.6.0;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract HRC20RestrictedFaucet is Ownable {
  IERC20 public token;

  uint256 public amount;
  mapping(address => bool) private fundingStatus;

  event funded(uint256 _amount);
  
  constructor(address _token, uint256 _amount) public {
    require(_token != address(0), "HRC20RestrictedFaucet: can't set the token address to the zero address");
    token = IERC20(_token);
    amount = _amount;
  }

  function fund(address _to) public {
    uint256 currentBlock = block.number;
    require(!fundingStatus[_to], "HRC20RestrictedFaucet: Address has already been funded");
    require(balance() > amount, "HRC20RestrictedFaucet: Not enough token funds in the faucet");
    fundingStatus[_to] = true;
    token.transfer(address(uint160(_to)), amount);
    emit funded(amount);
  }

  function balance() public view returns (uint256) {
    return token.balanceOf(address(this));
  }

  function setAmount(uint256 _amount) public onlyOwner {
    amount = _amount;
  }

}

//SPDX-License-Identifier: LGPL-3.0
pragma solidity 0.8.20;

import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import '@openzeppelin/contracts/utils/introspection/ERC165.sol';
import '@openzeppelin/contracts/access/manager/AccessManaged.sol';
import './RahatToken.sol';
import '../libraries/AbstractTokenActions.sol';
import '../interfaces/IRahatProject.sol';
import '../interfaces/IRahatTreasury.sol';

/// @title Treasury contract to manage Rahat tokens and generate tokens
/// @author Rumsan Associates
/// @notice You can use this contract to manage Rahat tokens
contract RahatTreasury is AbstractTokenActions, ERC165, AccessManaged {
  using EnumerableSet for EnumerableSet.AddressSet;

  event TokenCreated(address indexed tokenAddress);
  event TokenMintedAndApproved(
    address indexed tokenAddress,
    address indexed approveAddress,
    uint256 amount
  );
  event TokenMintedAndSent(
    address indexed tokenAddress,
    address indexed receiverAddress,
    uint256 amount
  );

  /// @notice All the supply is allocated to this contract
  /// @dev deploys AidToken and Rahat contract by sending supply to this contract

  bytes4 public constant IID_RAHAT_TREASURY = type(IRahatTreasury).interfaceId;
  EnumerableSet.AddressSet private tokens;

  constructor(address _manager) AccessManaged(_manager) {}

  function getTokens() public view returns (address[] memory) {
    address[] memory _tokens = new address[](tokens.length());
    for (uint256 i = 0; i < tokens.length(); i++) {
      _tokens[i] = tokens.at(i);
    }
    return _tokens;
  }

  //#region Token function
  function createToken(
    string memory _name,
    string memory _symbol,
    string memory _description,
    uint8 decimals,
    uint256 _initialSupply,
    address _to,
    address _manager
  ) public returns (address) {
    RahatToken _token = new RahatToken(
      _name,
      _symbol,
      _description,
      decimals,
      _initialSupply,
      _to,
      _manager
    );
    address _tokenAddress = address(_token);
    tokens.add(_tokenAddress);
    emit TokenCreated(_tokenAddress);
    return _tokenAddress;
  }

  function mintToken(address _token, uint256 _amount) public {
    RahatToken(_token).mint(address(this), _amount);
  }

  function mintTokenAndApprove(
    address _token,
    address _approveAddress,
    uint256 _amount
  ) public {
    require(_token != address(0), 'token address cannot be zero');
    require(_approveAddress != address(0), 'approve address cannot be zero');
    require(_amount > 0, 'amount cannot be zero');

    RahatToken token = RahatToken(_token);
    token.mint(address(this), _amount);
    token.approve(_approveAddress, _amount);
    emit TokenMintedAndApproved(_token, _approveAddress, _amount);
  }

  function mintTokenAndSend(
    address _token,
    address _receiver,
    uint256 _amount
  ) public {
    require(_token != address(0), 'token address cannot be zero');
    require(_receiver != address(0), 'approve address cannot be zero');
    require(_amount > 0, 'amount cannot be zero');

    RahatToken token = RahatToken(_token);
    token.mint(address(this), _amount);
    token.transfer(_receiver, _amount);
    emit TokenMintedAndApproved(_token, _receiver, _amount);
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override returns (bool) {
    return
      interfaceId == IID_RAHAT_TREASURY || super.supportsInterface(interfaceId);
  }

  //#endregion
}

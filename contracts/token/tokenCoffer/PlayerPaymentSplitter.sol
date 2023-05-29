//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/finance/PaymentSplitterUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "../../core/contract-upgradeable/interface/ITokenVault.sol";
import "../../core/contract-upgradeable/VersionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "../tokenCoffer/TokenCofferPaymentSplitter.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract PlayerPaymentSplitter is
Initializable,
AccessControlEnumerableUpgradeable,
PausableUpgradeable,
UUPSUpgradeable,
VersionUpgradeable
{
    event NewestGameCoefficient(address[] games, uint256[] coefficients);
    event TransferZOICToGame(
        address indexed game,
        uint256 coefficient,
        uint256 amount
    );
    event TransferZOICToPlayer(
        address indexed player,
        uint256 poof,
        uint256 amount
    );
    event NewestPlayerPoof(address[] players, uint256[] poofs);
    event WithDrawZOIC(address indexed player, uint256 amount);
    
    IERC20Upgradeable public tokenZOIC;
    address public gamePool;
    
    mapping(address => uint256) public playerAwarded;
    mapping(address => uint256) public playerWithdrawn;
    
    mapping(address => bool) private blockedList;
    
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant BALLOT_ROLE = keccak256("BALLOT_ROLE");
    bytes32 public constant SPONSOR_ROLE = keccak256("SPONSOR_ROLE");
    
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}
    
    function _version() internal pure virtual override returns (uint256) {
        return 1;
    }
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address token, address _gamePool) public initializer {
        
        __AccessControlEnumerable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __VersionUpgradeable_init();
        
        tokenZOIC = IERC20Upgradeable(token);
        gamePool = _gamePool;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(BALLOT_ROLE, msg.sender);
        _grantRole(SPONSOR_ROLE, msg.sender);
        
    }
    
    function _getGameCoefficient() internal returns (address[] memory, uint256[] memory, uint256){
        
        // get new game coefficient from ballot;
        
        address[] memory games = new address[](1);
        games[0] = 0x8e675b3B721af441E908aB2597C1BC283A0D1C4d;
        
        uint256[] memory coefficients = new uint256[](1);
        coefficients[0] = 50;
        
        uint256 totalCoefficient = 100;
        
        return (games, coefficients, totalCoefficient);
        
    }
    
    function _getPlayerPoof(address game) internal returns (address[] memory, uint256[] memory, uint256){
        
        // get player poof from another contract;
        
        address[] memory players = new address[](1);
        players[0] = 0x8e675b3B721af441E908aB2597C1BC283A0D1C4d;
        
        uint256[] memory poofs = new uint256[](1);
        poofs[0] = 50;
        
        uint256 totalPoof = 100;
        
        return (players, poofs, totalPoof);
        
    }
    
    function paymentSplit() public onlyRole(UPGRADER_ROLE) {
        
        // releasable amount of tokenZOIC
        // refreshes every cycle
        uint256 value = tokenZOIC.balanceOf(gamePool);
        
        (address[] memory games, uint256[] memory coefficients, uint256 totalCoefficient) = _getGameCoefficient();
        require(games.length == coefficients.length, "Invalid game coefficient");
        
        for (uint256 i = 0; i < games.length; i++) {
            
            // keep two decimal places
            uint256 coefficientWithScale = SafeMathUpgradeable.div(SafeMathUpgradeable.mul(coefficients[i], 10000), totalCoefficient);
            
            uint256 gameAward = SafeMathUpgradeable.div(SafeMathUpgradeable.mul(value, coefficientWithScale), 10000);
            emit TransferZOICToGame(games[i], coefficientWithScale, gameAward);
            
            (address[] memory players, uint256[] memory poofs, uint256 totalPoof) = _getPlayerPoof(games[i]);
            for (uint256 j = 0; j < players.length; j++) {
                
                // keep two decimal places
                uint256 poofWithScale = SafeMathUpgradeable.div(SafeMathUpgradeable.mul(poofs[j], 10000), totalPoof);
                uint256 playerAward = SafeMathUpgradeable.div(SafeMathUpgradeable.mul(gameAward, poofWithScale), 10000);
                
                playerAwarded[players[j]] = SafeMathUpgradeable.add(playerAwarded[players[j]], playerAward);
                emit TransferZOICToPlayer(players[j], poofWithScale, playerAward);
                
            }
            
        }
        
    }
    
    function releaseZOIC() public whenNotPaused {
        
        uint256 amount = playerAwarded[msg.sender];
        require(amount > 0, "No ZOIC");
        
        uint256 releasable = SafeMathUpgradeable.sub(playerAwarded[msg.sender], playerWithdrawn[msg.sender]);
        require(releasable > 0, "No ZOIC to withdraw");
        
        playerWithdrawn[msg.sender] = SafeMathUpgradeable.add(playerWithdrawn[msg.sender], releasable);
        
        ITokenVault(gamePool).withdrawERC20(tokenZOIC, msg.sender, releasable);
        
        emit WithDrawZOIC(msg.sender, amount);
        
    }
    
    function getZOICAward() public view returns (uint256) {
        
        require(!blockedList[msg.sender], "You are blocked");
        
        return playerAwarded[msg.sender];
        
    }
    
}

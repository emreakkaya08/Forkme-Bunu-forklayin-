// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./XYGameUSDT.sol";

contract USDTFaucet is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant FAUCET_ROLE = keccak256("FAUCET_ROLE");

    //event
    event Faucet(address indexed to, uint256 amount);

    /// token contract address
    XYGameUSDT public xygameUSDT;
    /// The amount of each claim
    uint256 public faucetAmount;
    /// The address that has been claimed => claim time
    mapping(address => uint256) public faucetTime;

    using SafeERC20Upgradeable for XYGameUSDT;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(XYGameUSDT _xygameUSDT) public initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(FAUCET_ROLE, msg.sender);

        xygameUSDT = _xygameUSDT;
        faucetAmount = 100 ether;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}

    /// @dev user claim faucet by self
    function claim() external {
        address _to = _msgSender();
        _claim(_to, faucetAmount);
    }

    /// @dev admin claim faucet to other
    function claimWithRole(address _to) external onlyRole(FAUCET_ROLE) {
        _claim(_to, faucetAmount);
    }

    /// @dev admin claim faucet to other
    function claimAmountWithRole(
        address _to,
        uint256 _amount
    ) external onlyRole(FAUCET_ROLE) {
        _claim(_to, _amount);
    }

    function _claim(
        address _to,
        uint256 _amount
    ) internal whenNotPaused whenNotReachedClaimTimeLimit(_to) {
        if (_to == address(0)) {
            revert("XYGameUSDTFaucet: claim to the zero address");
        }
        if (_amount == 0) {
            revert("XYGameUSDTFaucet: claim amount must be greater than zero");
        }

        //check if the balance is sufficient
        uint256 balance = xygameUSDT.balanceOf(address(this));
        if (balance < _amount) {
            revert("XYGameUSDTFaucet: faucet balance is not enough");
        }

        //record claim time
        faucetTime[_to] = block.timestamp;
        //faucet
        xygameUSDT.safeTransfer(_to, _amount);
        //trigger event
        emit Faucet(_to, _amount);
    }

    modifier whenNotReachedClaimTimeLimit(address _to) {
        //If it is less than one day, it cannot be claimed
        if (faucetTime[_to] + 1 days > block.timestamp) {
            revert(
                string(
                    abi.encodePacked(
                        "XYGameUSDTFaucet: faucetTime not reached, left time: ",
                        StringsUpgradeable.toString(
                            faucetTime[_to] + 1 days - block.timestamp
                        ),
                        " s"
                    )
                )
            );
        }

        _;
    }
}

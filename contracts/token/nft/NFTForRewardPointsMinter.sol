//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "../../core/contract-upgradeable/VersionUpgradeable.sol";
import "../../core/contract-upgradeable/interface/IERC721Ext.sol";

contract NFTForRewardPointsMinter is
    Initializable,
    ReentrancyGuardUpgradeable,
    AccessControlEnumerableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    VersionUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    event RPNFTMinted(
        address indexed tokenAddress,
        address indexed to,
        uint256 indexed tokenId,
        uint256 points
    );

    address private _pointsContract;
    mapping(address => uint256) private _pointLimits;

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

    function initialize(address pointsContract_) public initializer {
        __AccessControlEnumerable_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __VersionUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        _pointsContract = pointsContract_;
    }

    function addToken(
        address tokenAddress,
        uint256 pointLimit
    ) public onlyRole(ADMIN_ROLE) {
        require(tokenAddress != address(0), "token address cannot be 0");
        require(_pointLimits[tokenAddress] == 0, "token already supported");
        require(pointLimit > 0, "point limit must be greater than 0");

        _pointLimits[tokenAddress] = pointLimit;
    }

    function safeMint(
        address tokenAddress,
        address to,
        uint256 tokenId
    ) public whenNotPaused nonReentrant {
        require(_pointLimits[tokenAddress] > 0, "token not supported");

        IERC721Ext nft = IERC721Ext(tokenAddress);

        // todo get points from game contract
        // Contract pointsContract = Contract(_pointsContract);
        // require(
        //     pc.points(msg.sender) >= _pointLimits[tokenAddress],
        //     "insufficient points"
        // );
        // pointsContract.subPoints(msg.sender, _pointLimits[tokenAddress]);
        nft.safeMint(to, tokenId);

        emit RPNFTMinted(tokenAddress, to, tokenId, _pointLimits[tokenAddress]);
    }
}

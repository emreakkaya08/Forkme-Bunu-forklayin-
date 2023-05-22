// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.8.0) (finance/PaymentSplitter.sol)

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./GameCoffer.sol";

contract PaymentSplitterDailyUpgradeable is Initializable, ContextUpgradeable {
    event PayeeAdded(address account, uint256 shares);
    event PaymentReleased(address to, uint256 amount);
    event ERC20PaymentReleased(
        IERC20Upgradeable indexed token,
        address to,
        uint256 amount
    );
    event PaymentReceived(address from, uint256 amount);

    address tokenZOIC;
    address gameCoffer;

    uint256 private dailyReceived;
    uint256 private _totalShares;
    uint256 private _totalReleased;

    mapping(address => uint256) private _shares;
    mapping(address => uint256) private _released;
    address[] private _payees;

    mapping(IERC20Upgradeable => uint256) private _erc20TotalReleased;
    mapping(IERC20Upgradeable => mapping(address => uint256))
        private _erc20Released;

    function __PaymentSplitter_init(
        address[] memory payees,
        uint256[] memory shares_,
        address gameCoffer_,
        address tokenZOIC_
    ) internal onlyInitializing {
        __PaymentSplitter_init_unchained(
            payees,
            shares_,
            gameCoffer_,
            tokenZOIC_
        );
    }

    function __PaymentSplitter_init_unchained(
        address[] memory payees,
        uint256[] memory shares_,
        address gameCoffer_
    ) internal onlyInitializing {
        require(
            payees.length == shares_.length,
            "PaymentSplitter: payees and shares length mismatch"
        );
        require(payees.length > 0, "PaymentSplitter: no payees");
        require(
            gameCoffer_ != address(0),
            "PaymentSplitter: gameCoffer_ is the zero address"
        );

        for (uint256 i = 0; i < payees.length; i++) {
            _addPayee(payees[i], shares_[i]);
        }
        gameCoffer = gameCoffer_;
        tokenZOIC = tokenZOIC_;
    }

    function __UpdateGameCofficient(
        address[] memory payees,
        uint256[] memory shares_
    ) internal {
        require(
            payees.length == shares_.length,
            "PaymentSplitter: payees and shares length mismatch"
        );
        require(payees.length > 0, "PaymentSplitter: no payees");

        _payees = payees;

        _totalShares = 0;
        for (uint256 i = 0; i < payees.length; i++) {
            _shares[payees[i]] = shares_[i];
            _totalShares += shares_[i];
        }
    }

    function _releaseZOIC() internal {
        require(address(tokenZOIC).balance > 0, "PaymentSplitter: no balance");

        IERC20Upgradeable token = IERC20Upgradeable(tokenZOIC);

        for (uint256 i = 0; i < _payees.length; i++) {
            address account = _payees[i];
            uint256 payment = (address(this).balance * _shares[account]) /
                _totalShares;
            _totalReleased += payment;
            _released[account] += payment;
            SafeERC20Upgradeable.safeTransferFrom(
                token,
                gameCoffer,
                account,
                payment
            );
            emit PaymentReleased(account, payment);
        }
    }

    receive() external payable virtual {
        emit PaymentReceived(_msgSender(), msg.value);
    }

    function totalShares() public view returns (uint256) {
        return _totalShares;
    }

    function totalReleased() public view returns (uint256) {
        return _totalReleased;
    }

    function totalReleased(
        IERC20Upgradeable token
    ) public view returns (uint256) {
        return _erc20TotalReleased[token];
    }

    function shares(address account) public view returns (uint256) {
        return _shares[account];
    }

    function released(address account) public view returns (uint256) {
        return _released[account];
    }

    function released(
        IERC20Upgradeable token,
        address account
    ) public view returns (uint256) {
        return _erc20Released[token][account];
    }

    function payee(uint256 index) public view returns (address) {
        return _payees[index];
    }

    function _addPayee(address account, uint256 shares_) private {
        require(
            account != address(0),
            "PaymentSplitter: account is the zero address"
        );
        require(shares_ > 0, "PaymentSplitter: shares are 0");
        require(
            _shares[account] == 0,
            "PaymentSplitter: account already has shares"
        );

        _payees.push(account);
        _shares[account] = shares_;
        _totalShares = _totalShares + shares_;
        emit PayeeAdded(account, shares_);
    }

    uint256[43] private __gap;
}

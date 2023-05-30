// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {AddressUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "hardhat/console.sol";

contract VeTokenUpgradeable is
    Initializable,
    ContextUpgradeable,
    IERC20Upgradeable,
    IERC20MetadataUpgradeable
{
    using SafeERC20Upgradeable for IERC20MetadataUpgradeable;

    struct Point {
        uint256 bias; // total amount of veCRV that can be obtained
        uint256 slope; // amount of veCRV that can be obtained per second
        uint256 ts; // lock start time
        uint256 blk; // lock start block
    }

    struct LockedBalance {
        uint256 amount; // locked amount
        uint256 end; // lock end time, second
    }

    error Error_VeTokenUpgradeable__Require_Not_Contract();
    //  "VeToken: amount must be greater than zero"
    error Error_VeTokenUpgradeable__Require_Amount_Greater_Than_Zero();
    // "VeToken: already have a lock"
    error Error_VeTokenUpgradeable__Require_Already_Have_A_Lock();
    // "VeToken: unlock time must be greater than now"
    error Error_VeTokenUpgradeable__Require_Unlock_Time_Must_Be_Greater_Than_Now();
    //  "VeToken: no locked balance"
    error Error_VeTokenUpgradeable__Require_No_Locked_Balance();
    // "VeToken: locked balance is unlock"
    error Error_VeTokenUpgradeable__Require_Locked_Balance_Is_Unlock();
    // "VeToken: unlock time must be less than 4 year"
    error Error_VeTokenUpgradeable__Require_Unlock_Time_Must_Be_Less_Than_4_Year();
    // "VeToken: unlock time must be greater than current unlock time"
    error Error_VeTokenUpgradeable__Require_Unlock_Time_Must_Be_Greater_Than_Current_Unlock_Time();

    event Deposit(
        address indexed user,
        uint256 amount,
        uint256 locktime,
        uint256 operatorType,
        uint256 blkTime
    );

    event Withdraw(address indexed user, uint256 amount, uint256 blkTime);
    event Supply(uint256 preSupply, uint256 supply);

    uint256 public constant WEEK = 7 * 86400; // all future times are rounded by week
    uint256 public constant MAXTIME = 4 * 365 * 86400; // 4 years
    uint256 public constant MULTIPLIER = 1e18;

    uint256 public constant OPERATOR_TYPE_CREATE_LOCK = 0; // create lock
    uint256 public constant OPERATOR_TYPE_DEPOSIT = 1; // deposit
    uint256 public constant OPERATOR_TYPE_INCREASE_LOCK_AMOUNT = 2; // lock amount
    uint256 public constant OPERATOR_TYPE_INCREASE_UNLOCK_TIME = 3; // increase unlock time

    uint256 private _currentEpoch; // global pledge cycle
    Point[] private _pointHistory; // global pledge point

    mapping(address => LockedBalance) private _userLockedBalance; // locked amount
    mapping(address => Point[]) private _userPointHistory; // user pledge point
    mapping(address => uint256) private _userPointEpoch; //  user pledge cycle

    mapping(uint256 => uint256) private _slopeChanges; // time -> signed slope change

    string private _name; // token name
    string private _symbol; // token symbol
    uint8 private _decimals; // token decimals

    uint256 private _lockedTotalSupply; // users locked amount

    IERC20MetadataUpgradeable private _tokenERC20; // locked token address

    function __VeToken_init(
        IERC20MetadataUpgradeable tokenERC20_
    ) internal onlyInitializing {
        string memory name_ = string(
            abi.encodePacked("ve", tokenERC20_.name())
        );
        string memory symbol_ = string(
            abi.encodePacked("ve", tokenERC20_.symbol())
        );
        __VeToken_init_unchained(tokenERC20_, name_, symbol_);
    }

    function __VeToken_init_unchained(
        IERC20MetadataUpgradeable tokenERC20_,
        string memory name_,
        string memory symbol_
    ) internal onlyInitializing {
        _tokenERC20 = tokenERC20_;
        _name = name_;
        _symbol = symbol_;
        _decimals = tokenERC20_.decimals();
        _pointHistory.push(Point(0, 0, block.timestamp, block.number));
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual override returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function tokenERC20()
        public
        view
        virtual
        returns (IERC20MetadataUpgradeable)
    {
        return _tokenERC20;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless this function is
     * overridden;
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view virtual override returns (uint256) {
        return this.totalSupplyAtTime(block.timestamp);
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(
        address account
    ) public view virtual override returns (uint256) {
        return balanceOfAtTime(account, block.timestamp);
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return false;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(
        address owner,
        address spender
    ) public view virtual override returns (uint256) {
        //not allow transfer
        require(spender == address(0));
        require(owner == address(0));
        return 0;
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `amount` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(
        address spender,
        uint256 amount
    ) public virtual override returns (bool) {
        //not allow transfer
        require(spender == address(0));
        require(amount > 0);
        return false;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `amount`.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        //not allow transfer
        require(false);
        require(from == address(0));
        require(to == address(0));
        require(amount == 0);
        return false;
    }

    /**
     * @dev Moves `amount` of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {
        //not allow transfer
        require(false);
        require(from == address(0));
        require(to == address(0));
        require(amount == 0);
    }

    /// veToken specific functions

    /// @dev Returns the current epoch for the user.
    function getLastUserSlop() external view returns (uint256) {
        uint256 uepoch = _userPointEpoch[_msgSender()];
        return _userPointHistory[_msgSender()][uepoch].slope;
    }

    /// @dev Returns the current epoch for the user.
    function userPointHistoryTs(
        address account,
        uint256 epoch
    ) external view returns (uint256) {
        return _userPointHistory[account][epoch].ts;
    }

    /// @dev Returns the timestamp of the user's unlock time.
    function lockedEnd(address account) external view returns (uint256) {
        return _userLockedBalance[account].end;
    }

    function lockedBalanceOf(
        address account
    ) public view virtual returns (LockedBalance memory) {
        return _userLockedBalance[account];
    }

    function lockedTotalSupply() public view virtual returns (uint256) {
        return _lockedTotalSupply;
    }

    function balanceOfAtTime(
        address account,
        uint256 time
    ) public view virtual returns (uint256) {
        uint256 _epoch = _userPointEpoch[account];
        if (_epoch == 0) {
            return 0;
        } else {
            Point memory lastPoint = _userPointHistory[account][_epoch];
            require(lastPoint.ts <= time, "VeToken: time is not in the epoch");

            //the number of ve to be destroyed
            uint256 _destroyAmount = lastPoint.slope * (time - lastPoint.ts);
            if (_destroyAmount >= lastPoint.bias) {
                lastPoint.bias = 0;
            } else {
                lastPoint.bias -= _destroyAmount;
            }
            return lastPoint.bias;
        }
    }

    /**
     * @dev Returns the total supply at a given time.
     */
    function totalSupplyFromPoint(
        Point memory point,
        uint256 atTime
    ) internal view virtual returns (uint256) {
        Point memory lastPoint = Point(
            point.bias,
            point.slope,
            point.ts,
            point.blk
        );

        //t_i: uint256 = (last_point.ts / WEEK) * WEEK
        uint256 t_i = calculateUnlockTime(lastPoint.ts); //round to week
        for (uint256 i = 0; i < 255; i++) {
            t_i += WEEK;

            uint256 d_slope = 0;
            if (t_i > atTime) {
                t_i = atTime;
            } else {
                d_slope = _slopeChanges[t_i];
            }

            lastPoint.bias -= lastPoint.slope * (t_i - lastPoint.ts);
            if (t_i == atTime) {
                break;
            }

            lastPoint.slope += d_slope;
            lastPoint.ts = t_i;
        }

        return lastPoint.bias;
    }

    function totalSupplyAtTime(uint256 atTime) external view returns (uint256) {
        //  _epoch: uint256 = self.epoch
        uint256 _epoch = _currentEpoch;
        Point memory lastPoint = _pointHistory[_epoch];
        return totalSupplyFromPoint(lastPoint, atTime);
    }

    /// @dev Returns the timestamp of the current block. unlocked
    function calculateUnlockTime(
        uint256 unlockTime
    ) public pure returns (uint256) {
        return (unlockTime / WEEK) * WEEK;
    }

    function checkpoint() external virtual {
        _checkpoint(address(0), LockedBalance(0, 0), LockedBalance(0, 0));
    }

    function createLock(uint256 amount, uint256 unlockTime) external virtual {
        uint256 unlockTime_ = calculateUnlockTime(unlockTime); //round to week

        LockedBalance memory lockedBalance_ = _userLockedBalance[_msgSender()];
        if (amount == 0) {
            revert Error_VeTokenUpgradeable__Require_Amount_Greater_Than_Zero();
        }
        if (lockedBalance_.amount != 0) {
            revert Error_VeTokenUpgradeable__Require_Already_Have_A_Lock();
        }
        if (unlockTime_ < block.timestamp) {
            revert Error_VeTokenUpgradeable__Require_Unlock_Time_Must_Be_Greater_Than_Now();
        }

        if (unlockTime_ > block.timestamp + MAXTIME) {
            revert Error_VeTokenUpgradeable__Require_Unlock_Time_Must_Be_Less_Than_4_Year();
        }

        _deposit_for(
            _msgSender(),
            amount,
            unlockTime_,
            lockedBalance_,
            OPERATOR_TYPE_CREATE_LOCK
        );
    }

    function requireNotContract(address account) internal view {
        if (AddressUpgradeable.isContract(account)) {
            revert Error_VeTokenUpgradeable__Require_Not_Contract();
        }
    }

    function increaseAmount(uint256 amount) external virtual {
        requireNotContract(_msgSender());

        LockedBalance memory lockedBalance_ = _userLockedBalance[_msgSender()];
        if (amount == 0) {
            revert Error_VeTokenUpgradeable__Require_Amount_Greater_Than_Zero();
        }
        if (lockedBalance_.amount == 0) {
            revert Error_VeTokenUpgradeable__Require_No_Locked_Balance();
        }
        if (lockedBalance_.end <= block.timestamp) {
            revert Error_VeTokenUpgradeable__Require_Locked_Balance_Is_Unlock();
        }

        _deposit_for(
            _msgSender(),
            amount,
            0,
            lockedBalance_,
            OPERATOR_TYPE_INCREASE_LOCK_AMOUNT
        );
    }

    function increaseUnlockTime(uint256 unlockTime) external virtual {
        requireNotContract(_msgSender());
        uint256 unlockTime_ = calculateUnlockTime(unlockTime); //round to week

        LockedBalance memory lockedBalance_ = _userLockedBalance[_msgSender()];
        if (lockedBalance_.amount == 0) {
            revert Error_VeTokenUpgradeable__Require_No_Locked_Balance();
        }
        if (lockedBalance_.end <= block.timestamp) {
            revert Error_VeTokenUpgradeable__Require_Locked_Balance_Is_Unlock();
        }
        if (unlockTime_ <= block.timestamp) {
            revert Error_VeTokenUpgradeable__Require_Unlock_Time_Must_Be_Greater_Than_Current_Unlock_Time();
        }

        if (unlockTime_ > block.timestamp + MAXTIME) {
            revert Error_VeTokenUpgradeable__Require_Unlock_Time_Must_Be_Less_Than_4_Year();
        }

        _deposit_for(
            _msgSender(),
            0,
            unlockTime_,
            lockedBalance_,
            OPERATOR_TYPE_INCREASE_UNLOCK_TIME
        );
    }

    function withdraw() external virtual {
        LockedBalance memory lockedBalance_ = _userLockedBalance[_msgSender()];
        require(
            lockedBalance_.amount > 0,
            "VeToken: no locked balance to withdraw"
        );
        require(
            lockedBalance_.end <= block.timestamp,
            "VeToken: locked balance is not unlock"
        );

        uint256 amount = lockedBalance_.amount;
        lockedBalance_.amount = 0;
        lockedBalance_.end = 0;

        _userLockedBalance[_msgSender()] = lockedBalance_;
        //update supply
        uint256 supplyBefore = _lockedTotalSupply;
        _lockedTotalSupply -= amount;

        //todo: check point

        //transfer token
        if (amount > 0) {
            _tokenERC20.safeTransfer(_msgSender(), amount);
        }

        emit Withdraw(_msgSender(), amount, block.timestamp);

        emit Supply(supplyBefore, _lockedTotalSupply);
    }

    function _deposit_for(
        address account,
        uint256 amount,
        uint256 unlockTime,
        LockedBalance memory lockedBalance,
        uint256 operatorType
    ) internal virtual {
        LockedBalance memory lockedBalanceBefore_ = LockedBalance(
            lockedBalance.amount,
            lockedBalance.end
        );
        LockedBalance memory lockedBalance_ = lockedBalance;

        uint256 supplyBefore = _lockedTotalSupply;

        //update supply
        _lockedTotalSupply += amount;
        //update user locked balance
        lockedBalance_.amount += amount;
        if (unlockTime > 0) {
            lockedBalance_.end = unlockTime;
        }
        //update user locked balance
        _userLockedBalance[account] = lockedBalance_;

        //update user point
        _checkpoint(account, lockedBalanceBefore_, lockedBalance_);

        //transfer token
        if (amount > 0) {
            _tokenERC20.safeTransferFrom(_msgSender(), address(this), amount);
        }

        emit Deposit(
            account,
            amount,
            lockedBalance_.end,
            operatorType,
            block.timestamp
        );

        emit Supply(supplyBefore, _lockedTotalSupply);
    }

    function _checkpoint(
        address account,
        LockedBalance memory oldLocked,
        LockedBalance memory newLocked
    ) internal virtual {
        Point memory uOld = Point(0, 0, 0, 0);
        Point memory uNew = Point(0, 0, 0, 0);
        uint256 oldDslope = 0;
        uint256 newDslope = 0;
        uint256 _epoch = _currentEpoch;

        //process old locked balance
        if (account != address(0)) {
            //Calculate slopes and biases
            //Kept at zero when they have to
            if (oldLocked.end > block.timestamp && oldLocked.amount > 0) {
                uOld.slope = oldLocked.amount / MAXTIME;
                uOld.bias = uOld.slope * (oldLocked.end - block.timestamp);
            }
            if (newLocked.end > block.timestamp && newLocked.amount > 0) {
                uNew.slope = newLocked.amount / MAXTIME;
                uNew.bias = uNew.slope * (newLocked.end - block.timestamp);
            }
            //Read values of scheduled changes in the slope
            //old_locked.end can be in the past and in the future
            //new_locked.end can ONLY by in the FUTURE unless everything expired: than zeros
            oldDslope = _slopeChanges[oldLocked.end];
            if (newLocked.end != 0) {
                if (newLocked.end == oldLocked.end) {
                    newDslope = oldDslope;
                } else {
                    newDslope = _slopeChanges[newLocked.end];
                }
            }
        }

        Point memory lastPoint = Point(0, 0, block.timestamp, block.number);
        if (_epoch > 0) {
            lastPoint = _pointHistory[_epoch];
        }
        uint256 lastCheckpoint = lastPoint.ts;

        //initial_last_point is used for extrapolation to calculate block number
        // (approximately, for *At methods) and save them
        //as we cannot figure that out exactly from inside the contract
        Point memory initialLastPoint = lastPoint;
        uint256 blockSlope = 0; //dblock/dt
        if (block.timestamp > lastPoint.ts) {
            blockSlope =
                (MULTIPLIER * (block.number - lastPoint.blk)) /
                (block.timestamp - lastPoint.ts);
        }

        // If last point is already recorded in this block, slope=0
        // But that's ok b/c we know the block in such case

        // Go over weeks to fill history and calculate what the current point is
        uint256 t_i = (lastCheckpoint / WEEK) * WEEK;

        for (uint256 i = 0; i < 255; i++) {
            // Hopefully it won't happen that this won't get used in 5 years!
            // If it does, users will be able to withdraw but vote weight will be broken
            t_i += WEEK;

            uint256 d_slope = 0;
            if (t_i > block.timestamp) {
                t_i = block.timestamp;
            } else {
                d_slope = _slopeChanges[t_i];
            }

            lastPoint.bias -= lastPoint.slope * (t_i - lastCheckpoint);

            lastPoint.slope += d_slope;

            if (lastPoint.bias < 0) {
                lastPoint.bias = 0;
            }
            if (lastPoint.slope < 0) {
                lastPoint.slope = 0;
            }

            lastCheckpoint = t_i;
            lastPoint.ts = t_i;

            lastPoint.blk =
                initialLastPoint.blk +
                (blockSlope * (t_i - initialLastPoint.ts)) /
                MULTIPLIER;

            _epoch += 1;

            if (t_i == block.timestamp) {
                lastPoint.blk = block.number;
                break;
            } else {
                _increasePointHistory(_epoch, lastPoint);
                // _pointHistory[_epoch] = lastPoint;
            }
        }

        _currentEpoch = _epoch;
        // Now point_history is filled until t=now

        if (account != address(0)) {
            //If last point was in this block, the slope change has been applied already
            //But in such case we have 0 slope(s)
            lastPoint.slope += (uNew.slope - uOld.slope);
            lastPoint.bias += (uNew.bias - uOld.bias);

            if (lastPoint.slope < 0) {
                lastPoint.slope = 0;
            }
            if (lastPoint.bias < 0) {
                lastPoint.bias = 0;
            }
        }

        // Record the changed point into _pointHistory
        _increasePointHistory(_epoch, lastPoint);

        if (account != address(0)) {
            //Schedule the slope changes (slope is going down)
            //We subtract new_user_slope from [new_locked.end]
            //and add old_user_slope to [old_locked.end]
            if (oldLocked.end > block.timestamp) {
                //old_dslope was <something> - u_old.slope, so we cancel that
                oldDslope -= uOld.slope;
                if (newLocked.end == oldLocked.end) {
                    //It was a new deposit, not extension
                    oldDslope += uNew.slope;
                }
                _slopeChanges[oldLocked.end] = oldDslope;
            }

            if (newLocked.end > block.timestamp) {
                if (newLocked.end > oldLocked.end) {
                    //new_dslope was <something> + u_new.slope, so we cancel that
                    newDslope += uNew.slope;
                    _slopeChanges[newLocked.end] = newDslope;
                }
            }
        }

        // # Now handle user history
        uNew.ts = block.timestamp;
        uNew.blk = block.number;
        _increaseUserPointHistory(account, uNew);
    }

    function _increasePointHistory(uint256 _epoch, Point memory point) private {
        // Record the changed point into _pointHistory
        require(_epoch <= _pointHistory.length, "invariant");
        if (_epoch > _pointHistory.length - 1) {
            _pointHistory.push(point);
        } else {
            _pointHistory[_epoch] = point;
        }
    }

    function _increaseUserPointHistory(
        address account,
        Point memory point
    ) internal {
        uint256 user_epoch = _userPointEpoch[account] + 1;
        _userPointEpoch[account] = user_epoch;

        if (_userPointHistory[account].length == 0) {
            _userPointHistory[account].push(Point(0, 0, 0, 0));
        }
        require(user_epoch == _userPointHistory[account].length, "invariant");
        _userPointHistory[account].push(point);
    }

    function _findBlockEpoch(
        uint256 _block,
        uint256 maxEpoch
    ) internal view returns (uint256) {
        // Binary search
        uint256 _min = 0;
        uint256 _max = maxEpoch;
        for (uint256 i = 0; i < 128; i++) {
            //Will be always enough for 128-bit numbers
            if (_min >= _max) {
                break;
            }
            uint256 _mid = (_min + _max + 1) / 2;
            if (_pointHistory[_mid].blk <= _block) {
                _min = _mid;
            } else {
                _max = _mid - 1;
            }
        }
        return _min;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[45] private __gap;
}

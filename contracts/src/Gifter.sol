// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

struct Order {
    bytes32 key;
    uint8 protocol;
    address maker;
    address underlying;
    bool vault;
    bool exit;
    uint256 principal;
    uint256 premium;
    uint256 maturity;
    uint256 expiry;
}

struct Components {
    uint8 v;
    bytes32 r;
    bytes32 s;
}

interface ISwivel {
    function redeemZcToken(
        uint8 p,
        address u,
        uint256 m,
        uint256 a
    ) external returns (bool);

    function initiate(
        Order[] memory order,
        uint256[] memory amount,
        Components[] memory components
    ) external returns (bool);
}

contract Gifter {
    using SafeERC20 for IERC20;

    ISwivel public swivel;
    address public owner;

    constructor(address _swivelAddress) {
        swivel = ISwivel(_swivelAddress);
        owner = msg.sender;
    }

    // address is recipient address
    // string is maturity date
    // uint256 is amount
    mapping(address => mapping(uint256 => uint256)) public deposits;

    bool private locked;

    modifier noReentry() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    function deposit(
        Order[] memory order,
        uint256[] memory amount,
        Components[] memory signature,
        uint8 senderShare,
        address receiver,
        uint256 maturityDate
    ) public noReentry {
        IERC20 token = IERC20(0x07865c6E87B9F70255377e024ace6630C1Eaa37F);

        uint256 initialBalance = token.balanceOf(address(this));

        require(
            token.transferFrom(msg.sender, address(this), amount[0]),
            "Transfer failed"
        );
        token.approve(address(swivel), amount[0]);
        swivel.initiate(order, amount, signature); // Call the deposit function on Swivel

        uint256 finalBalance = token.balanceOf(address(this));
        require(
            finalBalance >= initialBalance,
            "Final balance is less than initial balance"
        );

        uint256 difference = finalBalance - initialBalance;
        if (difference > 0) {
            token.transfer(msg.sender, difference * senderShare);
            token.transfer(receiver, difference * (1 - senderShare));
        }

        // Store depositor
        deposits[msg.sender][maturityDate] = amount[0];
    }

    function withdraw(
        uint8 p,
        IERC20 _token,
        uint256 _maturityDate,
        address underlyingToken
    ) public noReentry {
        uint256 amount = deposits[msg.sender][_maturityDate];
        // require(amount > 0, "No deposit for the given maturity date");
        // require(block.timestamp >= stringToTimestamp(_maturityDate), "Maturity date has not been reached");

        uint256 initialBalance = _token.balanceOf(address(this));

        require(
            swivel.redeemZcToken(p, underlyingToken, _maturityDate, amount),
            "Failed to redeem ZcToken"
        );

        uint256 finalBalance = _token.balanceOf(address(this));
        require(
            finalBalance >= initialBalance,
            "Final balance is less than initial balance"
        );

        uint256 difference = finalBalance - initialBalance;
        if (difference > 0) {
            _token.transfer(msg.sender, difference);
            // Remove the deposit information
            delete deposits[msg.sender][_maturityDate];
        }
    }
}

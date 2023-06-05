// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

//import "openzeppelin-contracts/token/ERC20/ERC20.sol";
//import "openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

//import "./Swivel.sol"; // Import the Swivel contract

interface ISwivel {
    function deposit(
        uint8 p,
        address u,
        address c,
        uint256 a
    ) external returns (bool);

    function withdraw(
        uint8 p,
        address u,
        address c,
        uint256 a
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
    mapping(address => mapping(string => uint256)) public deposits;

    bool private locked;

    modifier noReentry() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    function deposit(
        uint8 p,
        IERC20 _token,
        uint256 _amount,
        uint256 _senderShare,
        address _receiver,
        string memory _maturityDate
    ) public noReentry {
        uint256 initialBalance = _token.balanceOf(address(this));

        require(
            _token.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        _token.approve(address(swivel), _amount);
        swivel.deposit(p, address(this), address(_token), _amount); // Call the deposit function on Swivel

        uint256 finalBalance = _token.balanceOf(address(this));
        require(
            finalBalance >= initialBalance,
            "Final balance is less than initial balance"
        );

        uint256 difference = finalBalance - initialBalance;
        if (difference > 0) {
            _token.transfer(msg.sender, difference * (_senderShare));
            _token.transfer(_receiver, difference * (1 - (_senderShare)));
        }

        //store depositor
        deposits[msg.sender][_maturityDate] = _amount;
    }

    function withdraw(
        uint8 p,
        IERC20 _token,
        string memory _maturityDate
    ) public noReentry {
        uint256 amount = deposits[msg.sender][_maturityDate];
        //require(amount > 0, "No deposit for the given maturity date");
        //require(block.timestamp >= stringToTimestamp(_maturityDate), "Maturity date has not been reached");

        uint256 initialBalance = _token.balanceOf(address(this));

        swivel.withdraw(p, address(this), address(_token), amount); // Call the withdraw function on Swivel

        uint256 finalBalance = _token.balanceOf(address(this));
        require(
            finalBalance >= initialBalance,
            "Final balance is less than initial balance"
        );

        uint256 difference = finalBalance - initialBalance;
        if (difference > 0) {
            _token.transfer(msg.sender, difference);
        }
        // Remove the deposit information
        delete deposits[msg.sender][_maturityDate];
    }
}

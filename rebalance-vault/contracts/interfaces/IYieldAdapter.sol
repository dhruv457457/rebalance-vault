// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IYieldAdapter {
    function deposit(address token, uint256 amount) external returns (uint256 sharesReceived);
    function withdraw(address token, uint256 amount) external returns (uint256 tokensReceived);
    function getBalance(address token) external view returns (uint256);
    function getYieldEarned(address token, uint256 totalDeposited) external view returns (uint256);
    function name() external pure returns (string memory);
}
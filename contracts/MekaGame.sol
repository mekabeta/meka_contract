// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./library/ABDKMathQuad.sol";

contract MekaGame is Ownable {
    using SafeMath for uint256;

    struct GamblerBet {
        address gambler;
        uint256 betAmount;
        uint256 shares;
    }

    // 平台收益地址
    address public feeReceiver;

    // 押注台，记录每个用户的押注金额
    mapping(address => uint256) public betTable;
    // 押单的所有用户
    address[] public betOdd;
    // 押双的所有用户
    address[] public betEven;
    // 某轮游戏周期内押单的所有资金总额
    uint256 public totalOddBetAmount;
    // 某轮游戏周期内押双的所有资金总额
    uint256 public totalEvenBetAmount;
    // 记录本轮期数
    uint256 public period;

    // 平台开奖费率，设置为两位小数，比如feeRate的值为1558，那么实际的费率为15.58%
    uint256 public feeRate;
    // 触发自动开奖的下注数量
    uint256 public triggerNum;
    // 奖励分红比例，设置为两位小数，比如bonusRate的值为3245，那么实际的费率为32.45%
    uint256 public bonusRate;

    // 邀请人的对应关系
    mapping(address => address) public invitorMap;
    // 分红周期内参与游戏的所有玩家
    address[] public gamblers;

    event Bet(uint256 indexed period, address indexed gambler, uint256 bet_amount);
    event AddBet(uint256 indexed period, address indexed gambler, uint256 bet_amount);
    event Lottery(uint256 indexed period, uint256 result);
    event Dividend(uint256 amount);

    constructor(address receiver) {
        feeRate = 1000;
        triggerNum = 3;
        bonusRate = 5000;
        feeReceiver = receiver;
    }

    /**
     * 如果在开奖前重复转账到此合约，下注金额将在原有基础上增加，
     * 而下注的赌注由第一次转账时决定
     */
    receive() external payable {
        if (msg.value > 0) {
            uint256 amount = msg.value;
            if (betTable[msg.sender] == 0) {
                betTable[msg.sender] = amount;
                bool isOdd = _isOddNum(amount);
                if (isOdd) {
                    betOdd.push(msg.sender);
                    totalOddBetAmount = totalOddBetAmount.add(amount);
                } else {
                    betEven.push(msg.sender);
                    totalEvenBetAmount = totalEvenBetAmount.add(amount);
                }
                emit Bet(period, msg.sender, amount);
            } else {
                betTable[msg.sender] += amount;
                if (_isBetOdd(msg.sender)) {
                    totalOddBetAmount = totalOddBetAmount.add(amount);
                } else {
                    totalEvenBetAmount = totalEvenBetAmount.add(amount);
                }
                emit AddBet(period, msg.sender, amount);
            }
            _addGamblers(msg.sender);

            // try to trigger lottery
            uint256 evenLen = betEven.length;
            uint256 oddLen = betOdd.length;
            if (evenLen > 0 && oddLen > 0 && evenLen.add(oddLen) >= triggerNum) {
                _triggerLottery();
            }
        }
    }

    function setFeeRate(uint256 rate) external onlyOwner {
        feeRate = rate;
    }

    function setTriggerNum(uint256 num) external onlyOwner {
        require(num > 0, "Must greater then 0");
        triggerNum = num;
    }

    function setBonusRate(uint256 rate) external onlyOwner {
        bonusRate = rate;
    }

    function setFeeReceiver(address receiver) external onlyOwner {
        feeReceiver = receiver;
    }

    function lottery() external onlyOwner {
        require(betOdd.length > 0, "Nobody bet odd");
        require(betEven.length > 0, "Nobody bet even");
        _triggerLottery();
    }

    function _triggerLottery() internal {
        uint rand = uint(keccak256(abi.encodePacked(blockhash(block.number - 1), msg.sender, totalOddBetAmount, totalEvenBetAmount, block.timestamp)));
        bool isOdd = rand.mod(2) == 0 ? false : true;
        uint256 bonus = 0;
        uint256 profit = 0;
        if (isOdd) {
            profit = _calFee(totalEvenBetAmount);
            bonus = totalEvenBetAmount.sub(profit);
            _transferBonus(bonus, totalOddBetAmount, betOdd);
        } else {
            profit = _calFee(totalOddBetAmount);
            bonus = totalOddBetAmount.sub(profit);
            _transferBonus(bonus, totalEvenBetAmount, betEven);
        }
        uint256 bonusAmt = _mulDiv(bonusRate, profit, 10000);
        _dividend(bonusAmt);
        payable(feeReceiver).transfer(address(this).balance);
        emit Lottery(period, isOdd ? 1 : 0);
        _nextPeriod();
    }

    function printBetAmount() public view returns (uint256, uint256, uint256) {
        return (period, totalOddBetAmount, totalEvenBetAmount);
    }

    function remainBetCnt() public view returns (uint256) {
        return triggerNum - betOdd.length - betEven.length;
    }

    function printBetTable(bool isOdd) public view returns (GamblerBet[] memory) {
        GamblerBet[] memory bets;
        if (isOdd) {
            bets = new GamblerBet[](betOdd.length);
            for (uint i = 0; i < betOdd.length; i++) {
                GamblerBet memory gamblerBet = GamblerBet({
                    gambler: betOdd[i],
                    betAmount: betTable[betOdd[i]],
                    shares: _mulDiv(betTable[betOdd[i]], 10000, totalOddBetAmount)
                });
                bets[i] = gamblerBet;
            }
        } else {
            bets = new GamblerBet[](betEven.length);
            for (uint i = 0; i < betEven.length; i++) {
                GamblerBet memory gamblerBet = GamblerBet({
                    gambler: betEven[i],
                    betAmount: betTable[betEven[i]],
                    shares: _mulDiv(betTable[betEven[i]], 10000, totalEvenBetAmount)
                });
                bets[i] = gamblerBet;
            }
        }
        return bets;
    }

    function _nextPeriod() internal {
        for (uint i = 0; i < betEven.length; i++) {
            delete betTable[betEven[i]];
        }
        for (uint i = 0; i < betOdd.length; i++) {
            delete betTable[betOdd[i]];
        }
        delete betEven;
        delete betOdd;
        delete gamblers;
        totalOddBetAmount = 0;
        totalEvenBetAmount = 0;
        period += 1;
    }

    function _transferBonus(uint256 bonus, uint256 amount, address[] memory winners) internal {
        for (uint i = 0; i < winners.length; i++) {
            address payable winner = payable(winners[i]);
            uint256 betMoney = betTable[winner];
            uint256 personalBonus = _mulDiv(betMoney, bonus, amount);
            personalBonus = personalBonus.add(betMoney);
            if (personalBonus != 0) {
                winner.transfer(personalBonus);
            }
        }
    }

    function _isBetOdd(address gambler) internal view returns (bool) {
        for (uint i = 0; i < betOdd.length; i++) {
            if (betOdd[i] == gambler) {
                return true;
            }
        }
        return false;
    }

    function _calFee(uint256 amount) internal view returns (uint256) {
        return _mulDiv(feeRate, amount, 10000);
    }

    function _isOddNum(uint256 num) internal pure returns (bool) {
        string memory strNum = Strings.toString(num);
        bytes memory strBytes = bytes(strNum);
        bytes1 c;
        if (strBytes.length == 1) {
            c = strBytes[0];
        } else {
            for(uint i = 0; i < strBytes.length; i++) {
                if (strBytes[i] == '0') {
                    c = strBytes[i-1];
                    break;
                }
            }
        }
        return (c == '0' 
                || c == '2' 
                || c == '4' 
                || c == '6' 
                || c == '8') ? false : true;
    }

    function _mulDiv (uint x, uint y, uint z) internal pure returns (uint) {
        return ABDKMathQuad.toUInt(
            ABDKMathQuad.div(
                ABDKMathQuad.mul(ABDKMathQuad.fromUInt(x), ABDKMathQuad.fromUInt(y)), 
                ABDKMathQuad.fromUInt(z)
            )
        );
    }

    function setInvitor(address invitor) external {
        require(invitorMap[msg.sender] == address(0), "already setted");
        require(msg.sender != invitor, "Can't set yourselft");
        invitorMap[msg.sender] = invitor;
    }

    function _addGamblers(address gambler) internal {
        address invitor = invitorMap[gambler];
        // 没有设置邀请者
        if (invitor != address(0)) {
            gamblers.push(gambler);
        }
    }

    function _dividend(uint256 amount) internal returns(uint256 amt) {
        uint256 totalBet = totalEvenBetAmount.add(totalOddBetAmount);
        for(uint i = 0; i < gamblers.length; i++) {
            address gambler = gamblers[i];
            uint256 shareAmt = _mulDiv(betTable[gambler], amount, totalBet);
            address invitor = invitorMap[gambler];
            if (invitor != address(0)) {
                amt += shareAmt;
                payable(invitor).transfer(shareAmt);
            }
        }
        
        emit Dividend(amount);
    }

}
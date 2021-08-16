// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.6.4;
pragma experimental ABIEncoderV2;

struct User {
    address a;
    string name;
    uint weeklyWins;
    bool valid;
}
/** 
 * @title Football
 * @dev The Soma Pizza Fanclub fantasy football league
 */
contract Football {
    uint constant entryFee = 0.035 ether;
    uint constant weeklyHighScore = 0.0062 ether;
    
    event Join(address indexed member);
    event Pay(address indexed member, uint amount);

    address payable private leagueManager;
    mapping(address => User) private members;
    address payable[] private membersArray;

    constructor() public {
        leagueManager = msg.sender;
    }
    
    function joinLeague(string memory name) public payable isNotInLeague(msg.sender) {
        require(msg.value == entryFee);
        members[msg.sender] = User(msg.sender, name, 0, true);
        membersArray.push(msg.sender);
        emit Join(msg.sender);
    }
    
    function payWeekly(address payable winner) public onlyManager isInLeague(winner) {
        winner.transfer(weeklyHighScore);
        members[winner].weeklyWins++;
        emit Pay(winner, weeklyHighScore);
    }
    
    function endSeason(address payable first, address payable second, address payable third) public onlyManager isInLeague(first) isInLeague(second) isInLeague(third) {
        uint thirdPayout = address(this).balance / 10;
        uint secondPayout = address(this).balance * 30 / 100;
        third.transfer(thirdPayout);
        second.transfer(secondPayout);
        // Pay the winner the rest and complete the contract.
        selfdestruct(first);
    }
    
    function numUsers() external view isInLeague(msg.sender) returns(uint) {
        return membersArray.length;
    }
    
    function getUser(uint index) external view isInLeague(msg.sender) returns(User memory)  {
        require(index < membersArray.length);
        address a = membersArray[index];
        require(members[a].valid);
        return members[a];
    }
    
    function destroy() public onlyManager {
        for (uint i=0; i<membersArray.length; i++) {
            membersArray[i].transfer(address(this).balance / membersArray.length);
        }
        selfdestruct(leagueManager);
    }
    
    modifier onlyManager {
        require(msg.sender == leagueManager);
        _;
    }
    
    modifier isInLeague(address addr) {
        require(members[addr].valid);
        _;
    }
    
    modifier isNotInLeague(address addr) {
        require(!members[addr].valid);
        _;
    }
    
    function isEmptyString(string memory s) private pure returns(bool) {
        bytes memory tempEmptyStringTest = bytes(s);
        return tempEmptyStringTest.length == 0;
    }
}

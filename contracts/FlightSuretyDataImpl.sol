// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "./FlightSuretyData.sol";
import "../node_modules/@openzeppelin/contracts/utils/Address.sol";

contract FlightSuretyDataImpl is FlightSuretyData {
    using Address for address;
    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational; // Blocks all state changes throughout the contract if false
    address private appContractAddress;
    bool private testingMode;

    struct Airline {
        string name; // name of airline
        mapping(address => bool) votes;
        uint16 numberOfVotes; // index to keep track of the votes
        bool isRegistered; // has the consensus of 50% of other registered airlines if at least 4 airlines are registered
        bool isFunded; // has paid 10 ether to contract owner and can participate in contract
    }

    mapping(address => Airline) private airlines;
    uint16 private registeredAirlineNum; // the maximum number of airliners can be active is 65535, should be fine. There are 5k airlines with ICAO codes currently
    struct InsuranceInfo {
        //passenger => ether
        mapping(address => uint256) insuredAmount;
        //passenger => ether, for record
        mapping(address => uint256) refundAmount;
        //passenger => bool, track is withdrawed
        mapping(address => bool) isRefunded;
        // eligible for passengers to claim fund
        bool payoutEligible;
    }
    mapping(bytes32 => InsuranceInfo) private insuranceList;

    struct Flight {
        string name;
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
        uint256 price; // assuming that the price of ticket is the same for all passengers, how I wished
    }
    mapping(bytes32 => Flight) private flights;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor(address initialAirlineAddress, string memory initialAirlineName)
    {
        operational = true;
        contractOwner = msg.sender;
        airlines[initialAirlineAddress].isRegistered = true;
        airlines[initialAirlineAddress].name = initialAirlineName;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
     * @dev Modifier that require authorised app contract to access
     */
    modifier requireAuthorizedAppContract() {
        require(appContractAddress == msg.sender, "Unauthorised access");
        _;
    }

    modifier requireFlightNotEmpty(bytes32 flightKey) {
        require(flights[flightKey].airline != address(0), "");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function setTestingMode(bool _testingMode) external requireIsOperational {
        testingMode = _testingMode;
    }

    function authorizeCaller(address _appContractAddress)
        external
        requireIsOperational
        requireContractOwner
    {
        require(
            _appContractAddress.isContract(),
            "Only app contract address is allowed"
        );
        appContractAddress = _appContractAddress;
    }

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function fundAirline(address airlineAddress)
        external
        requireAuthorizedAppContract
        requireIsOperational
    {
        airlines[airlineAddress].isFunded = true;
    }

    function airlineIsFunded(address airlineAddress)
        external
        view
        requireAuthorizedAppContract
        requireIsOperational
        returns (bool)
    {
        return airlines[airlineAddress].isFunded;
    }

    function airlineVoteDetail(
        address airlineAddress,
        address voterAirlineAddress
    )
        external
        view
        requireAuthorizedAppContract
        requireIsOperational
        returns (
            string memory name,
            bool hasVoted,
            uint16 numberOfVotes,
            bool isRegistered,
            uint16 totalRegisteredAirline
        )
    {
        name = airlines[airlineAddress].name;
        hasVoted = airlines[airlineAddress].votes[voterAirlineAddress];
        numberOfVotes = airlines[airlineAddress].numberOfVotes;
        isRegistered = airlines[airlineAddress].isRegistered;
        totalRegisteredAirline = registeredAirlineNum;
    }

    function airlineDetail(address airlineAddress)
        external
        view
        requireIsOperational
        returns (
            string memory name,
            uint16 numberOfVotes,
            bool isRegistered,
            uint16 totalRegisteredAirline
        )
    {
        name = airlines[airlineAddress].name;
        numberOfVotes = airlines[airlineAddress].numberOfVotes;
        isRegistered = airlines[airlineAddress].isRegistered;
        totalRegisteredAirline = registeredAirlineNum;
    }

    function updateAirline(
        string memory name,
        address airlineAddress,
        address voterAirlineAddress,
        uint16 numberOfVotes,
        bool isRegistered,
        uint16 numberOfRegisteredAirlines
    ) external requireAuthorizedAppContract requireIsOperational {
        airlines[airlineAddress].name = name;
        airlines[airlineAddress].votes[voterAirlineAddress] = true;
        airlines[airlineAddress].numberOfVotes = numberOfVotes;
        airlines[airlineAddress].isRegistered = isRegistered;
        registeredAirlineNum = numberOfRegisteredAirlines;
    }

    /**
     * @dev Add an airline for registration
     *      Can only be called from FlightSuretyApp contract
     */
    function registerAirline(address airlineAddress, string memory name)
        external
        requireAuthorizedAppContract
        requireIsOperational
    {
        airlines[airlineAddress].name = name;
    }

    function updateFlight(
        bytes32 flightKey,
        string memory name,
        address airlineAddress,
        uint256 timestamp,
        uint256 price
    ) external requireAuthorizedAppContract requireIsOperational {
        flights[flightKey].isRegistered = true;
        flights[flightKey].updatedTimestamp = timestamp;
        flights[flightKey].airline = airlineAddress;
        flights[flightKey].name = name;
        flights[flightKey].price = price;
    }

    function updateFlightStatus(
        bytes32 flightKey,
        uint8 statusCode,
        uint256 timestamp
    ) external requireAuthorizedAppContract requireIsOperational {
        flights[flightKey].updatedTimestamp = timestamp;
        flights[flightKey].statusCode = statusCode;
    }

    function toggleInsurancePayoutStatus(bytes32 flightKey)
        external
        requireAuthorizedAppContract
        requireIsOperational
        requireFlightNotEmpty(flightKey)
    {
        insuranceList[flightKey].payoutEligible = true;
    }

    function isFlightRegistered(bytes32 flightKey)
        external
        view
        requireAuthorizedAppContract
        requireIsOperational
        returns (bool)
    {
        return flights[flightKey].isRegistered;
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy() external payable {

    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees() external pure {

    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay() external pure {}

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund() public payable {}

    function getFlight(bytes32 flightKey)
        external
        view
        requireAuthorizedAppContract
        requireIsOperational
        returns (
            string memory name,
            bool isRegistered,
            uint8 statusCode,
            uint256 updatedTimestamp,
            address airline,
            uint256 ticketPrice
        )
    {
        name = flights[flightKey].name;
        isRegistered = flights[flightKey].isRegistered;
        statusCode = flights[flightKey].statusCode;
        updatedTimestamp = flights[flightKey].updatedTimestamp;
        airline = flights[flightKey].airline;
        ticketPrice = flights[flightKey].price;
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    fallback() external payable {
        fund();
    }
}

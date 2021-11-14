// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */

import "./FlightSuretyData.sol";

contract FlightSuretyApp {
    /*
     * NOTE: `SafeMath` is no longer needed starting with Solidity 0.8. The compiler
     * now has built in overflow checking.
     */
    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner; // Account used to deploy contract
    address payable private dataContractAddr;
    FlightSuretyData dataContract;

    /**
     * This is used on all state changing functions to pause the app contract in
     * the event there is an issue that needs to be fixed
     * see also requireIsOperational()
     * see also isOperational()
     */
    bool private operational;

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    modifier minFundAirlineValue() {
        require(msg.value >= 1 ether, "Amount of ether must be 1 ether");
        _;
    }

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        // Modify to call data contract's status
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    modifier requireFund() {
        // Modify to call data contract's status
        require(msg.value > 0, "Must contain funds");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireDifferentAirline(address airlineAddress) {
        require(
            msg.sender != airlineAddress,
            "Must be triggered by different airlines"
        );
        _;
    }

    modifier requireIsFunded() {
        require(
            dataContract.airlineIsFunded(msg.sender),
            "Must be funded to use the function"
        );
        _;
    }

    modifier requireInsuranceNotBought(bytes32 flightKey) {
        (, , bool isInsured, , ) = dataContract.getInsuranceClaimStatus(
            flightKey,
            msg.sender
        );
        require(!isInsured, "Already insured");
        _;
    }

    modifier requireIsNotFunded() {
        require(
            !dataContract.airlineIsFunded(msg.sender),
            "Airline is already funded"
        );
        _;
    }

    modifier requireFlightIsNotRegistered(bytes32 flightKey) {
        require(
            !dataContract.isFlightRegistered(flightKey),
            "Flight must not be registered before"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       EVENT                                        */
    /********************************************************************************************/

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
     * @dev Contract constructor
     */
    constructor(address dataContractAddress) {
        contractOwner = msg.sender;
        dataContract = FlightSuretyData(dataContractAddress);
        dataContractAddr = payable(dataContractAddress);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() external view returns (bool) {
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

    function voteAirline(address airlineAddress)
        external
        requireDifferentAirline(airlineAddress)
        requireIsOperational
        requireIsFunded
    {
        (
            string memory name,
            bool hasVoted,
            uint16 numberOfVotes,
            bool isRegistered,
            uint16 totalRegisteredAirlines
        ) = dataContract.airlineVoteDetail(airlineAddress, msg.sender);

        require(!isRegistered, "Airline is already registered in contract");
        require(!hasVoted, "Cannot vote twice for the same airline");
        require(
            totalRegisteredAirlines >= 5,
            "Must have at least 5 airlines to use this function"
        );
        bool newIsRegistered = false;
        uint16 newNumberOfVotes = numberOfVotes + 1;
        uint16 newNumberOfRegisteredAirlines = totalRegisteredAirlines;

        if ((newNumberOfVotes * 100) / totalRegisteredAirlines >= 50) {
            newIsRegistered = true;
            newNumberOfRegisteredAirlines = totalRegisteredAirlines + 1;
        }
        dataContract.updateAirline(
            name,
            airlineAddress,
            msg.sender,
            newNumberOfVotes,
            newIsRegistered,
            newNumberOfRegisteredAirlines
        );
    }

    function fundAirline()
        external
        payable
        requireIsOperational
        requireFund
        requireIsNotFunded
        minFundAirlineValue
    {
        address payable sender = payable(msg.sender);
        dataContract.fundAirline(msg.sender);

        dataContractAddr.transfer(10 ether);
        sender.transfer(msg.value - 10 ether); //refund
    }

    /**
     * @dev Add an airline to the registration queue
     *
     */
    function registerAirline(address airlineAddress, string memory airlineName)
        external
        requireDifferentAirline(airlineAddress)
        requireIsOperational
        requireIsFunded
        returns (
            bool registrationSuccessful,
            bool addedToQueue,
            uint16 totalActiveAirline
        )
    {
        (
            ,
            ,
            uint16 numberOfVotes,
            bool isRegistered,
            uint16 totalRegisteredAirlines
        ) = dataContract.airlineVoteDetail(airlineAddress, msg.sender);
        require(!isRegistered, "Airline is already registered in contract");
        require(numberOfVotes < 1, "Airline is already in registration queue");

        if (totalRegisteredAirlines < 5) {
            uint16 newTotalRegisteredAirlines = totalRegisteredAirlines + 1;
            dataContract.updateAirline(
                airlineName,
                airlineAddress,
                msg.sender,
                1,
                true,
                newTotalRegisteredAirlines
            );
            addedToQueue = false;
            registrationSuccessful = true;
            totalActiveAirline = newTotalRegisteredAirlines;
        } else {
            dataContract.updateAirline(
                airlineName,
                airlineAddress,
                msg.sender,
                1,
                false,
                totalRegisteredAirlines
            );
            addedToQueue = true;
            registrationSuccessful = false;
            totalActiveAirline = totalRegisteredAirlines;
        }
    }

    /**
     * @dev Register a future flight for insuring.
     *
     */
    function registerFlight(
        string memory flightNumber,
        uint256 timestamp,
        uint256 ticketPrice
    ) external requireIsFunded requireIsOperational {
        bytes32 flightKey = getFlightKey(msg.sender, flightNumber, timestamp);

        require(
            !dataContract.isFlightRegistered(flightKey),
            "Flight must not be registered before"
        );
        dataContract.updateFlight(
            flightKey,
            flightNumber,
            msg.sender,
            timestamp,
            ticketPrice
        );
    }

    /**
     * @dev Called after oracle has updated flight status
     *  determine if status will give the insurees a payout
     */
    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) internal requireIsOperational {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        (, bool isRegistered, uint8 _statusCode, , , ) = dataContract.getFlight(
            flightKey
        );
        require(isRegistered, "Flight is not registered");
        require(
            _statusCode != STATUS_CODE_UNKNOWN,
            "Flight & insurance status is already determined"
        );
        require(
            statusCode != STATUS_CODE_UNKNOWN,
            "New Flight status cannot be unknown"
        );
        dataContract.updateFlightStatus(flightKey, statusCode, timestamp);
        if (statusCode != STATUS_CODE_ON_TIME) {
            dataContract.toggleInsurancePayoutStatus(flightKey);
        }
    }

    function getFlight(
        address airlineAddress,
        string memory flight,
        uint256 timestamp
    )
        external
        view
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
        bytes32 flightKey = getFlightKey(airlineAddress, flight, timestamp);
        (
            name,
            isRegistered,
            statusCode,
            updatedTimestamp,
            airline,
            ticketPrice
        ) = dataContract.getFlight(flightKey);
    }

    function buyInsurance(
        address airlineAddress,
        string memory flight,
        uint256 timestamp
    ) external payable requireIsOperational requireFund {
        bytes32 flightKey = getFlightKey(airlineAddress, flight, timestamp);
        require(
            dataContract.isFlightRegistered(flightKey),
            "Flight must be registered"
        );

        (, , bool isInsured, , ) = dataContract.getInsuranceClaimStatus(
            flightKey,
            msg.sender
        );
        require(!isInsured, "Already insured");
        (, , , , , uint256 ticketPrice) = dataContract.getFlight(flightKey);
        uint256 insuredAmount = (ticketPrice * 3) / 2;
        dataContract.buyInsurance(flightKey, msg.sender, insuredAmount);
        if (msg.value > 1 ether) {
            //refund
            address payable senderAddress = payable(msg.sender);
            senderAddress.transfer(msg.value - 1 ether);
        }
    }

    function getInsurance(
        address airlineAddress,
        string memory flight,
        uint256 timestamp
    )
        external
        view
        requireIsOperational
        returns (bool payoutEligible, uint8 reason)
    {
        bytes32 flightKey = getFlightKey(airlineAddress, flight, timestamp);
        require(
            dataContract.isFlightRegistered(flightKey),
            "Flight must be registered"
        );
        (payoutEligible, reason) = dataContract.getInsurance(flightKey);
    }

    function getInsuranceClaimStatus(
        address airlineAddress,
        string memory flight,
        uint256 timestamp
    )
        external
        view
        requireIsOperational
        returns (
            bool payoutEligible,
            uint8 reason,
            bool isInsured,
            uint256 insuredAmount,
            bool isRefunded
        )
    {
        bytes32 flightKey = getFlightKey(airlineAddress, flight, timestamp);
        require(
            dataContract.isFlightRegistered(flightKey),
            "Flight must be registered"
        );
        (
            payoutEligible,
            reason,
            isInsured,
            insuredAmount,
            isRefunded
        ) = dataContract.getInsuranceClaimStatus(flightKey, msg.sender);
    }

    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp
    ) external {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );
        oracleResponses[key].requester = msg.sender;
        oracleResponses[key].isOpen = true;

        emit OracleRequest(index, airline, flight, timestamp);
    }

    // region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses; // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event OracleReport(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp
    );

    // Register an oracle with the contract
    function registerOracle() external payable {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function getMyIndexes() external view returns (uint8[3] memory) {
        require(
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint8 index,
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) external {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );
        require(
            oracleResponses[key].isOpen,
            "Flight or timestamp do not match oracle request"
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (
            oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES
        ) {
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account)
        internal
        returns (uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(blockhash(block.number - nonce++), account)
                )
            ) % maxValue
        );

        if (nonce > 250) {
            nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

    // endregion
}

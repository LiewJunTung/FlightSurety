// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

interface FlightSuretyData {
    function updateAirline(
        string memory name,
        address airlineAddress,
        address voterAirlineAddress,
        uint16 numberOfVotes,
        bool isRegistered,
        uint16 numberOfRegisteredAirlines
    ) external;

    function airlineVoteDetail(
        address airlineAddress,
        address voterAirlineAddress
    )
        external
        view
        returns (
            string memory name,
            bool hasVoted,
            uint16 numberOfVotes,
            bool isRegistered,
            uint16 totalRegisteredAirline
        );

    function airlineDetail(address airlineAddress)
        external
        view
        returns (
            string memory name,
            uint16 numberOfVotes,
            bool isRegistered,
            uint16 totalRegisteredAirline
        );

    function airlineIsFunded(address airlineAddress)
        external
        view
        returns (bool);

    function fundAirline(address airlineAddress) external;

    function updateFlightStatus(
        bytes32 flightKey,
        uint8 statusCode,
        uint256 timestamp
    ) external;

    function updateFlight(
        bytes32 flightKey,
        string memory name,
        address airlineAddress,
        uint256 timestamp,
        uint256 ticketPrice
    ) external;

    function getFlight(bytes32 flightKey)
        external
        view
        returns (
            string memory name,
            bool isRegistered,
            uint8 statusCode,
            uint256 updatedTimestamp,
            address airline,
            uint256 ticketPrice
        );

    function toggleInsurancePayoutStatus(bytes32 flightKey) external;

    function isFlightRegistered(bytes32 flightKey) external view returns (bool);

    function buyInsurance(
        bytes32 flightKey,
        address passenger,
        uint256 insuredAmount
    ) external;

    function getInsuranceClaimStatus(bytes32 flightKey, address passenger)
        external
        view
        returns (
            bool payoutEligible,
            uint8 reason,
            bool isInsured,
            uint256 insuredAmount,
            bool isRefunded
        );

    function getInsurance(bytes32 flightKey)
        external
        view
        returns (bool payoutEligible, uint8 reason);

    function creditInsurees(bytes32 flightKey, address passenger)
        external
        payable;
}

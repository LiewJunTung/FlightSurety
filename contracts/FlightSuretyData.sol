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

    function airlineDetail(address airlineAddress, address voterAirlineAddress)
        external
        view
        returns (
            string memory name,
            bool hasVoted,
            uint16 numberOfVotes,
            bool isRegistered,
            uint16 totalRegisteredAirline
        );

}

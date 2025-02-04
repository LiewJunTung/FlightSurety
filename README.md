# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)

# For Testing
1. Create a Ganache Workspace, 100 accounts with minimum ether of 10000. Make sure that the mnemonic is the same as in the truffle.js
1. Update truffle.js
1. Update testConfig.js
1. Update the contract owner in migrations/deploy_contracts
1. Open a terminal, run `truffle migrate --reset`
1. Open a terminal tab, run `npm run dapp`
1. Open a terminal tab, run `npm run server`

# Rubics
## Separation of Concerns, Operational Control and “Fail Fast”
| Criteria | Meets Specifications | Completed |
| --- | --- | --- |
| Smart Contract Seperation | Smart Contract code is separated into multiple contracts | ✅ |
| Dapp Created and Used for Contract Calls | 1) Passenger can purchase insurance for flight | ✅ |
| | 2) Trigger contract to request flight status update | 🚧 |
| Oracle Server Application | A server app has been created for simulating oracle behavior. Server can be launched with “npm run server” | |
| Operational status control is implemented in contracts | Students has implemented operational status control. | ✅ |
| Fail Fast Contract | Contract functions “fail fast” by having a majority of “require()” calls at the beginning of function body | |

## Airlines
| Criteria | Meets Specifications | Completed |
| --- | --- | --- |
| Airline Contract Initialization | First airline is registered when contract is deployed. | ✅ |
| Multiparty Consensus | Only existing airline may register a new airline until there are at least four airlines registered. Demonstrated either with Truffle test or by making call from client Dapp | ✅ |
| Multiparty Consensus | Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines. <br><br>Demonstrated either with Truffle test or by making call from client Dapp | ✅ |
| Airline Ante | Airline can be registered, but does not participate in contract until it submits funding of 10 ether (make sure it is not 10 wei) <br><br>Demonstrated either with Truffle test or by making call from client Dapp | ✅ |

## Passengers 
| Criteria | Meets Specifications | Completed |
| --- | --- | --- |
| Passenger Airline Choice | Passengers can choose from a fixed list of flight numbers and departures that are defined in the Dapp client <br><br> Your UI implementation should include: <br><br> Fields for Airline Address and Airline Name<br><br>Amount of funds to send/which airline to send to<br><br>Ability to purchase flight insurance for no more than 1 ether | ✅ |
| Passenger Payment | Passengers may pay up to 1 ether for purchasing flight insurance. | ✅ |
| Passenger Repayment | If flight is delayed due to airline fault, passenger receives credit of 1.5X the amount they paid | ✅ |
| Passenger Withdraw | Passenger can withdraw any funds owed to them as a result of receiving credit for insurance payout | |
| Insurance Payouts | Insurance payouts are not sent directly to passenger’s wallet | ✅ |

## Oracles (Server App)
| Criteria | Meets Specifications | Completed |
| --- | --- | --- |
| Functioning Oracle | Oracle functionality is implemented in the server app. | ✅ |
| Oracle Initialization | Upon startup, 20+ oracles are registered and their assigned indexes are persisted in memory | ✅ |
| Oracle Updates | Update flight status requests from client Dapp result in OracleRequest event emitted by Smart Contract that is captured by server (displays on console and handled in code) | ✅ |
| Oracle Functionality | Server will loop through all registered oracles, identify those oracles for which the OracleRequest event applies, and respond by calling into FlightSuretyApp contract with random status code of Unknown (0), On Time (10) or Late Airline (20), Late Weather (30), Late Technical (40), or Late Other (50) | ✅ |

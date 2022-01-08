const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyDataImpl = artifacts.require("FlightSuretyDataImpl");

const fs = require("fs");

module.exports = async function (deployer, network, accounts) {
  const airlines = [
    {address: accounts[1], name: "JT Air", flight: "ND1309", price: web3.utils.toWei("3", "ether")},
    {address: accounts[2],name: "Rac Air", flight: "AB123", price: web3.utils.toWei("2", "ether")},
    {address: accounts[3],name: "Uda Air", flight: "BC234", price: web3.utils.toWei("4", "ether")},
    {address: accounts[4],name: "V Air", flight: "CD345", price: web3.utils.toWei("3", "ether")},
  ]

  const ORACLE_CONTRACT_START_INDEX = 20;
  const TEST_ORACLES_COUNT = 20 + ORACLE_CONTRACT_START_INDEX;
  
  const firstAirline = airlines[0].address;
  const firstAirlineName = airlines[0].name;
  const initialFund = web3.utils.toWei("50", "ether");
  const oracleRegistrationFund = web3.utils.toWei("1", "ether");
  const flightTimestamp = 1637415493;

  await deployer.deploy(FlightSuretyDataImpl, firstAirline, firstAirlineName);
  const dataContract = await FlightSuretyDataImpl.deployed();
  const oraclesAddresses = accounts.slice(ORACLE_CONTRACT_START_INDEX, TEST_ORACLES_COUNT);

  const appContract = await deployer.deploy(
    FlightSuretyApp,
    FlightSuretyDataImpl.address
  );

  const oracleIndexes = {};
  for (let i  =  0; i < oraclesAddresses.length; i++) {
    const oracle = oraclesAddresses[i]
    console.log("ORACLE", oracle)
    oracleIndexes[oracle] = await appContract.registerOracle({
      from: oracle,
      value: oracleRegistrationFund,
    });
  }

  const config = {
    localhost: {
      url: "http://localhost:7545",
      dataAddress: FlightSuretyDataImpl.address,
      appAddress: FlightSuretyApp.address,
      oracleAddress: oraclesAddresses,
      oracleIndexes: oracleIndexes
    },
  };

  fs.writeFileSync(
    __dirname + "/../src/dapp/config.json",
    JSON.stringify(config, null, "\t"),
    "utf-8"
  );
  fs.writeFileSync(
    __dirname + "/../src/server/config.json",
    JSON.stringify(config, null, "\t"),
    "utf-8"
  );

  const authResult = await dataContract.authorizeCaller(
    FlightSuretyApp.address
  );
  console.log("Register App Contract", authResult);

  const fundResult = await dataContract.fund({ value: initialFund });
  console.log("Fund contract", fundResult);

  const fundAirlineResult = await appContract.fundAirline({
    from: firstAirline,
    value: initialFund,
  });
  console.log("Fund airline", fundAirlineResult);
  console.log(airlines)
  for(let i = 1; i < 4; i++){ 
    const airline = airlines[i]
    console.log(airline)
    const registerAirlineResult = await appContract.registerAirline(
      airline.address, airline.name, {from: firstAirline}
    )
    console.log("Register Airline result", registerAirlineResult)
    const fundNewAirlineResult = await appContract.fundAirline({
      from: airline.address,
      value: initialFund,
    });
    console.log("Funded airline", fundNewAirlineResult);
  }

  for(let i = 0; i < 4; i++) {
    const airline = airlines[i]
    const registerFlightResult = await appContract.registerFlight(
      airline.flight,
      flightTimestamp,
      airline.price,
      { from: airline.address }
    );
  
    console.log("Register Flight Result", registerFlightResult);
  }
};
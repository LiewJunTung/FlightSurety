var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyDataImpl");
var BigNumber = require("bignumber.js");

var Config = async function (accounts) {
  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 10;
  const STATUS_CODE_LATE_AIRLINE = 20;
  const STATUS_CODE_LATE_WEATHER = 30;
  const STATUS_CODE_LATE_TECHNICAL = 40;
  const STATUS_CODE_LATE_OTHER = 50;

  // These test addresses are useful when you need to add
  // multiple users in test scripts
  let testAddresses = [
    "0x97DD60A164f339ea60311DF0b98D583Bfaf65D96",
    "0xc1e85C1aDe59C0418bEdDB9B67d702931B1a6314",
    "0x2797022Ee5286B56875589E11E6b69FE4629740d",
    "0xdE2a8EA85ef25dc6cA0E275C74E67Abe93c41A5c",
    "0xB342163CF21B2FE3Ab0a632F5096487358B412d3",
    "0xd812bf5897A1EB1346B43A8d55B1192B0c108c04",
    "0x6AB62E7c97Dd013A18B84a8Ea5E02fDeb47bbdb0",
    "0xE49e0F63196F60Aa00d4Fe3Ba321872BdBc726E8",
    "0x3b3794b9d5348e388b90976b9D07Fd8588db138A",
  ];
  let passenger = "0x062D6C2a2bbf4a5a2FDD0fc844675b12B461A002";
  let firstAirlineName = "JT Air";
  let owner = accounts[0];
  let firstAirline = accounts[1];

  let flightSuretyData = await FlightSuretyData.new(
    firstAirline,
    firstAirlineName
  );
  let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

  let flight = "ND1309"; // Course number
  let timestamp = Math.floor(Date.now() / 1000);
  let initialFund = web3.utils.toWei("100", "ether");
  let price = 1;
  let ticketPrice = web3.utils.toWei("1", "ether");
  let insuredAmount = (price * 3) / 2;

  return {
    owner: owner,
    firstAirline: firstAirline,
    weiMultiple: new BigNumber(10).pow(18),
    testAddresses: testAddresses,
    flightSuretyData: flightSuretyData,
    flightSuretyApp: flightSuretyApp,
    flight: flight,
    timestamp: timestamp,
    initialFund,
    passenger,
    ticketPrice,
    insuredAmount,
    STATUS_CODE_UNKNOWN,
    STATUS_CODE_ON_TIME,
    STATUS_CODE_LATE_AIRLINE,
    STATUS_CODE_LATE_WEATHER,
    STATUS_CODE_LATE_TECHNICAL,
    STATUS_CODE_LATE_OTHER,
  };
};

module.exports = {
  Config: Config,
};

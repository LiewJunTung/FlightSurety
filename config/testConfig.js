
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyDataImpl");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        "0x21f557008F8313f21e40158a109C0fbE7F3A4281",
        "0xE6A40FdC9373e636A92cD98e928DdBD7Cd01f8df",
        "0xBd8D161a395d5CcfED3E8FFA915277B27eAbE3E5",
        "0x81b58f4e4f6302744031629909bF30ec10a40d5B",
        "0x16E86456e60DC663D7ABC946b805FDAFA3cDe946",
        "0x7bc78F65aAd184504cA599DBD67889d1F53c242b",
        "0xc10783D32116E459a58bAce3cB2Df44b1a5Aa821",
        "0x9c3E46ad113976243531b70B9B217723e382f155",
        "0xA1E54605f7bd385E109987fF69D4BF661e2929a3"
    ];

    let firstAirlineName = "JT Air";
    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new(firstAirline, firstAirlineName);
    let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

    let flight = 'ND1309'; // Course number
    let timestamp = Math.floor(Date.now() / 1000);
    let ticketPrice = web3.utils.toWei("20", "ether")

    return {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp,
        flight: flight,
        timestamp: timestamp,
        ticketPrice,
    }
}

module.exports = {
    Config: Config
};
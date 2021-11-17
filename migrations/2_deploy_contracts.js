const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyDataImpl = artifacts.require("FlightSuretyDataImpl");

const fs = require('fs');

module.exports = function(deployer) {

    let firstAirline = '0xc1e85C1aDe59C0418bEdDB9B67d702931B1a6314';
    let firstAirlineName = 'JT Air';
    deployer.deploy(FlightSuretyDataImpl, firstAirline, firstAirlineName)
    .then(() => {
        return deployer.deploy(FlightSuretyApp, FlightSuretyDataImpl.address)
                .then(() => {
                    let config = {
                        localhost: {
                            url: 'http://localhost:7545',
                            dataAddress: FlightSuretyDataImpl.address,
                            appAddress: FlightSuretyApp.address
                        }
                    }
                    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                });
    });
}
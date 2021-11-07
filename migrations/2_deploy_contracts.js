const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyDataImpl = artifacts.require("FlightSuretyDataImpl");
const fs = require('fs');

module.exports = function(deployer) {

    let firstAirline = '0xE6A40FdC9373e636A92cD98e928DdBD7Cd01f8df';
    let firstAirlineName = 'JT Air';
    deployer.deploy(FlightSuretyDataImpl, firstAirline, firstAirlineName)
    .then(() => {

        return deployer.deploy(FlightSuretyApp, FlightSuretyDataImpl.address)
                .then(() => {
                    let config = {
                        localhost: {
                            url: 'http://localhost:8545',
                            dataAddress: FlightSuretyDataImpl.address,
                            appAddress: FlightSuretyApp.address
                        }
                    }
                    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                });
    });
}
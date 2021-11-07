var Test = require("../config/testConfig.js");
var BigNumber = require("bignumber.js");
const truffleAssert = require("truffle-assertions");

contract("Flight Surety Tests", async (accounts) => {
  var config;
  before("setup contract", async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(
      config.flightSuretyApp.address
    );
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {
    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
    // Ensure that access is denied for non-Contract Owner account
    const result = await config.flightSuretyData.setOperatingStatus(false, {
      from: config.testAddresses[3],
    });

    assert.equal(
      result.receipt.name,
      "RuntimeError",
      "Access not restricted to Contract Owner"
    );
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
    // Ensure that access is allowed for Contract Owner account

    const result = await config.flightSuretyData.setOperatingStatus(false);
    assert.notExists(
      result.receipt.name,
      "Access not restricted to Contract Owner"
    );
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
    await config.flightSuretyData.setOperatingStatus(false);

    const result = await config.flightSuretyData.setTestingMode(true);

    assert.equal(
      result.receipt.name,
      "RuntimeError",
      "Access not blocked for requireIsOperational"
    );

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true);
  });

  it("(airline) cannot register an Airline using registerAirline() if it is not funded", async () => {
    await config.flightSuretyApp.setOperatingStatus(true);
    // ARRANGE
    let newAirline = accounts[2];
    let newAirlineName = "SG Airline";

    // ACT

    let registerResult = await config.flightSuretyApp.registerAirline(
      newAirline,
      newAirlineName,
      {
        from: config.firstAirline,
      }
    );

    // ASSERT
    assert.exists(
      registerResult.receipt.name,
      "Airline should not be able to register another airline if it hasn't provided funding"
    );
  });

  describe("(airline) registration", async () => {
    it(" can register an Airline using registerAirline() if it is funded", async () => {
      const firstAirline = config.firstAirline;

      // ARRANGE
      const initialBalance = await web3.eth.getBalance(firstAirline);

      await config.flightSuretyApp.fundAirline({
        from: firstAirline,
        value: web3.utils.toWei("30", "ether"),
      });

      const laterBalance = await web3.eth.getBalance(firstAirline);
      const afterRefunded =
        web3.utils.fromWei(initialBalance) - web3.utils.fromWei(laterBalance);

      assert.equal(parseInt(afterRefunded), 10, "is not refunded");
    });

    it("when number of (airline) is lower than 5, an airline can register airline", async () => {
      for (let index = 2; index < 7; index++) {
        const newAirline = accounts[index];
        const newAirlineName = `Airline ${index}`;
        await config.flightSuretyApp.registerAirline(
          newAirline,
          newAirlineName,
          {
            from: accounts[index - 1],
          }
        );
        
        const airlineDetail = await config.flightSuretyData.airlineDetail.call(newAirline)

        assert.isTrue(
            airlineDetail.isRegistered,
          "Airline should be able to register airline after funded"
        );
        // ARRANGE
        console.log("FUNDING", newAirlineName);
        const initialBalance = await web3.eth.getBalance(newAirline);

        await config.flightSuretyApp.fundAirline({
          from: newAirline,
          value: web3.utils.toWei("30", "ether"),
        });

        const laterBalance = await web3.eth.getBalance(newAirline);
        const afterRefunded =
          web3.utils.fromWei(initialBalance) - web3.utils.fromWei(laterBalance);

        assert.equal(parseInt(afterRefunded), 10, "is not refunded");
      }

      const newAirline = accounts[7];
      const newAirlineName = `Airline 7`;
      
      await config.flightSuretyApp.registerAirline(
        newAirline,
        newAirlineName,
        {
          from: accounts[6],
        }
      );

      const airlineDetail = await config.flightSuretyData.airlineDetail.call(newAirline)
      
      assert.isNotTrue(
        airlineDetail.isRegistered,
        "Airline should not be able to register airline directly after there are 5 or more funded airlines"
      );
      console.log(airlineDetail)
    });

    
    it("when number of (airline) is equal or bigger than 5, will need at least 50 percent of airline to vote", async () => {
        const newAirline = accounts[7];
        let numberOfVotes = 1;
        for (let index = 3; index < 7; index++) {
            const voteAirlineResult = await config.flightSuretyApp.voteAirline(newAirline, {from: accounts[index]});
            ++numberOfVotes;
            const airlineDetail = await config.flightSuretyData.airlineDetail.call(newAirline)
           
            // console.log(airlineDetail)
            if (airlineDetail.isRegistered){
                break
            }
            assert.equal(
                airlineDetail.numberOfVotes.toNumber(),
                numberOfVotes,
                "Airline should not be able to register airline directly after there are 5 or more funded airlines"
              );
        }
    });
    
  });
});

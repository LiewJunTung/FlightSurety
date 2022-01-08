import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";
import express from "express";
import { Resolver } from "webpack";

let config = Config["localhost"];
let oracleAddresses = config.oracleAddress;
const oracleIndexes = {};
let web3 = new Web3(
  new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
);
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(
  FlightSuretyApp.abi,
  config.appAddress
);
console.log("-----");
console.log(oracleAddresses);
// flightSuretyApp.methods.registrationFee().call({from: oracleAddresses[0]})
flightSuretyApp.methods
  .registrationFee()
  .call({ from: oracleAddresses[0] }, (error, fee) => {
    if (error) {
      console.error(error);
    } else {
      for (let index = 0; index < oracleAddresses.length; index++) {
        const oracleAddress = oracleAddresses[index];
        flightSuretyApp.methods.registerOracle().send(
          {
            from: oracleAddress,
            value: fee,
            gas: 1000000,
          },
          (error, result) => {
            if (error) {
              console.error(error);
            } else {
              // console.log(result);
              flightSuretyApp.methods.getMyIndexes().call(
                {
                  from: oracleAddress,
                },
                (error, indexes) => {
                  if (error) {
                    console.error(error);
                  } else {
                    console.log("indexes")
                    oracleIndexes[oracleAddress] = indexes;
                    console.log(oracleIndexes);
                  }
                }
              );
              // get the index
            }
          }
        );
      }
    }
  });

// flightSuretyApp.events.OracleRequest(
//   {
//     fromBlock: 0,
//   },
//   function (error, event) {
//     if (error) console.log(error);
//     console.log(event);
//   }
// );

const app = express();
app.get("/api", (req, res) => {
  res.send({
    message: "An API for use with your Dapp!",
  });
});

export default app;

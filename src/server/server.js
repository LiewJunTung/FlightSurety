import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";
import express from "express";
import cors from "cors";
import timeout from 'connect-timeout'
import { Resolver } from "webpack";

const STATUS_CODE_UNKNOWN = "0";
const STATUS_CODE_ON_TIME = "10";
const STATUS_CODE_LATE_AIRLINE = "20";
const STATUS_CODE_LATE_WEATHER = "30";
const STATUS_CODE_LATE_TECHNICAL = "40";
const STATUS_CODE_LATE_OTHER = "50";
const statusCodes = [
  STATUS_CODE_UNKNOWN,
  STATUS_CODE_ON_TIME,
  STATUS_CODE_LATE_AIRLINE,
  STATUS_CODE_LATE_WEATHER,
  STATUS_CODE_LATE_TECHNICAL,
  STATUS_CODE_LATE_OTHER,
];
const statusCodeStatusStringMap = {
  "0": "Unknown",
  "10": "On Time",
  "20": "Late Airline",
  "30": "Late Weather",
  "40": "Late Technical Issue",
  "50": "Other"
}

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
                    oracleIndexes[oracleAddress] = indexes;
                    console.log("INDEXES", oracleAddress, indexes);
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


function submitOracleResponse(
  oracleAddress,
  index,
  airline,
  flight,
  timestamp,
  status
) {
  return new Promise((resolve, reject) => {
    flightSuretyApp.once("OracleReport", (error, event) => {
      if (error) { reject(error) }
      else {
        resolve(event);
      }
      
    });
    flightSuretyApp.methods
      .submitOracleResponse(index, airline, flight, timestamp, status)
      .send({ from: oracleAddress, gas: 1000000 }, (error, result) => {
        if (error) {
          reject(error);
        }
      });
  });
}

async function listenForOracleRequest() {
  return new Promise((resolve, reject) => {
    flightSuretyApp.once("OracleRequest", (error, event) => {
      if (error) {
        reject(error);
        return;
      }
      let oracleRequest = event.returnValues;
      resolve(oracleRequest);
    });
  });
}

async function listenForOracleReport() {
  return new Promise((resolve, reject) => {
    flightSuretyApp.once("OracleReport", (error, event) => {
      if (error) { reject(error) }
      else {
        console.log("OracleReport", "event: ", event)
        resolve(event);
      }
      
    });
  });
}

async function listenForFlightStatusInfo() {
  return new Promise((resolve, reject) => {
    flightSuretyApp.once("FlightStatusInfo", (error, event) => {
      if (error) { reject(error) }
      else {
        console.log("FlightStatusInfo", "event: ", event)
        resolve(event);
      }
      
    });
  });
}

async function fetchFlightStatus(airlineAddress, flightNumber, timestamp) {
  let status = statusCodes[Math.floor(Math.random() * statusCodes.length)];
  let successCount = 0;
   const oracleRequest = await flightStatusRequest(
        airlineAddress,
        flightNumber,
        timestamp
      );
  while (successCount < 3) {
    for (let i = 0; i < oracleAddresses.length; i++) {
      const selectedOracleAddress = oracleAddresses[i];
      let flightStatusPromise
      const hasIndex = oracleIndexes[selectedOracleAddress].includes(oracleRequest.index)
      console.log(oracleIndexes[selectedOracleAddress], "==", oracleRequest.index, hasIndex)
      if (hasIndex) {
        successCount++;
        let oracleResponsePromise = listenForOracleReport();
        flightStatusPromise = listenForFlightStatusInfo();
        await submitOracleResponse(
          selectedOracleAddress,
          oracleRequest.index,
          oracleRequest.airline,
          oracleRequest.flight,
          oracleRequest.timestamp,
          status
        );
         
        await oracleResponsePromise;
        console.log("SUCCESS!!", successCount);
       
      } else {
        console.log("ERROR: KEY NOT FOUND -> SKIP!");
      }
      if (successCount >= 3) {
        await flightStatusPromise;
        console.log("DONE!!", status);
        return status;
      }
    }
  }
}

async function flightStatusRequest(
  airlineAddress,
  flightNumber,
  timestamp
) {
  return new Promise((resolve, reject) => {
    flightSuretyApp.once("OracleRequest", (error, event) => {
      if (error) reject(error);
      else {
        resolve(event.returnValues);
      }
    });
    flightSuretyApp.methods
      .fetchFlightStatus(airlineAddress, flightNumber, timestamp)
      .send({ from: '0x30024e46C7162F8835933D09b8851225F6b268b1' }, (error, result) => {
        if (error) {
          reject(error);
        }
      });
  });
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/oracles-index", (req, res) => {
  res.json(oracleIndexes);
});

app.post("/api", async (req, res) => {
  const flightNumber = req.body.flightNumber;
  const airlineAddress = req.body.airlineAddress;
  const timestamp = req.body.timestamp;
  if (flightNumber) {
    // await flightStatus()
    try {
      const status = await fetchFlightStatus(
        airlineAddress,
        flightNumber,
        timestamp
      );
      const response = { "result": statusCodeStatusStringMap[status], status }
      console.log("returning", response)
      res.send(response);
    } catch (e) {
      console.log("error", e)
      res.status(402).send({ message: e });
    }
  } else {
    res.status(404).send({ message: "flight not found" });
  }
});

export default app;

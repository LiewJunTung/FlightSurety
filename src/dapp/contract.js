import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";

export default class Contract {
  constructor(network, callback) {
    let config = Config[network];
    this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress
    );

    this.flightTimestamp = 1637415493;
    this.initialize(callback);
    this.owner = null;
    this.airlines = [];
    this.passengers = [];
    this.purchasedFlight = {};

  }

  initialize(callback) {
    this.web3.eth.getAccounts((error, accts) => {
      this.owner = accts[0];

      let counter = 11;

      this.airlines.push(
        ...[
          { address: accts[1], name: "JT Air", flight: "ND1309" },
          { address: accts[2], name: "Rac Air", flight: "AB123" },
          { address: accts[3], name: "Uda Air", flight: "BC234" },
          { address: accts[4], name: "V Air", flight: "CD345" },
        ]
      );

      while (this.passengers.length < 10) {
        this.passengers.push(accts[counter++]);
      }

      callback();
    });
  }

  buyTicket() {
    let self = this;
    self.flightSuretyApp.methods;
  }

  async getFlightInfo(airlineInfo) {
    return new Promise((resolve, reject) => {
      console.log(
        "AIRLINE ",
        airlineInfo.address,
        airlineInfo.flight,
        this.flightTimestamp
      );
      this.flightSuretyApp.methods
        .getFlight(
          airlineInfo.address,
          airlineInfo.flight,
          this.flightTimestamp
        )
        .call({ from: this.passengers[0] }, (error, result) => {
          resolve(result);
        });
    });
  }

  async buyInsurance(airlineFlightInfo){

    return new Promise((resolve, reject) => {
      this.flightSuretyApp.methods
        .buyInsurance(
          airlineFlightInfo.address,
          airlineFlightInfo.flight,
          this.flightTimestamp,
        ).send(
          { from: this.passengers[0], value: this.web3.utils.toWei("1") , gas:3000000},
          (error, result) => {
            if (error) {
              console.error(error)
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
    })
  }

  checkPurchaseFlight(airlineFlightInfo){
    console.log("flight", this.purchasedFlight, this.purchasedFlight[this.passengers[0]]?.flight)
     return !this.purchasedFlight[this.passengers[0]]?.includes(airlineFlightInfo);
  }

  async buyTicket(airlineFlightInfo) {
    const flightInfo = await this.getFlightInfo(airlineFlightInfo);

    return new Promise((resolve, reject) => {
      const purchaseFlightHistory = this.purchasedFlight[this.passengers[0]];
      if (purchaseFlightHistory) {
        const customerPurchaseHistory = purchaseFlightHistory.filter(
          (i) =>
            i.address == airlineFlightInfo.address &&
            i.flight == airlineFlightInfo.flight &&
            i.flightTimestamp == airlineFlightInfo.timestamp
        );
        if (customerPurchaseHistory.length > 0) {
          reject("Flight has already been purchased")
          return
        }
      }
      console.log(
        "Buy Ticket ",
        airlineFlightInfo.address,
        airlineFlightInfo.flight,
        this.flightTimestamp,
        flightInfo
      );

      let ticketPrice = flightInfo.ticketPrice;
      console.log("ticket", ticketPrice)
     
      this.flightSuretyApp.methods
        .buyFlight(
          airlineFlightInfo.address,
          airlineFlightInfo.flight,
          this.flightTimestamp,
        ).send(
          { from: this.passengers[0], value: ticketPrice },
          (error, result) => {
            if (error) {
              console.error(error)
              reject(error);
            } else {
              if (purchaseFlightHistory) {
                this.purchasedFlight[this.passengers[0]].push(
                  airlineFlightInfo
                );
              } else {
                this.purchasedFlight[this.passengers[0]] = [airlineFlightInfo];
              }
              resolve(result);
            }
          }
        );
    });
  }

  displayPrice(price) {
    return this.web3.utils.fromWei(price);
  }

  isOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods
      .isOperational()
      .call({ from: self.owner }, callback);
  }

  fetchFlightStatus(flight) {
    const flightInfo = this.airlines.find((info) => info.flight == flight)

    let self = this;
    let payload = {
      airline: flightInfo.address,
      flight: flight,
      timestamp: this.flightTimestamp,
    };

    return new Promise((resolve, reject) => {
      self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: self.passengers[0] }, (error, result) => {
        if (error) {
          console.error(error)
          reject(error);
        } else {
          resolve(result);
        }
      });
    })
    
    
  }
}

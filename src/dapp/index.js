import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;

  let contract = new Contract("localhost", () => {
    // Read transaction
    contract.isOperational((error, result) => {
      console.log(error, result);
      display("Operational Status", "Check if contract is operational", [
        { label: "Operational Status", error: error, value: result },
      ]);
      addFlight();
    });
    var app = new Vue({
      el: "#app",
      data: {
        oracleFlightNumber: "",
        flights: [],
        airlines: contract.airlines,
        currentAirline: contract.airlines[0],
        flightPrice: "",
        showButton: false,
        flightStatus: "",
        showClaimInsuranceButton: false,
        claimInsuranceButtonText: "",
        isRefunded: false,
        isLoading: false,
      },
      mounted: function () {
        this.checkStatus();
      },
      methods: {
        submitOracle: async function () {
            try {
                this.isLoading = true
                await contract.fetchFlightStatus(this.oracleFlightNumber)
                await this.checkStatus();
                this.isLoading = false
            } catch (e) {
                alert(e.message)
            }
        },
        checkStatus: async function() {
          
          const result = await this.displayPrice();
          switch (result.statusCode) {
            case "0": this.flightStatus = ""; break;
            case "10": this.flightStatus = "ON TIME"; break;
            case "20": this.flightStatus = "LATE AIRLINE"; break;
            case "30": this.flightStatus = "LATE WEATHER"; break;
            case "40": this.flightStatus = "LATE TECHNICAL"; break;
            case "50": this.flightStatus = "LATE OTHER"; break;
          }
          let insuredResponse = await contract.checkInsuranceClaim(this.currentAirline)
          this.isRefunded = insuredResponse.isRefunded
          const isInsured = insuredResponse.isInsured
          const payoutEligible = insuredResponse.payoutEligible
          // const isPayoutEligible = insuredResponse.
          // this.showClaimInsuranceButton = insuredResponse
          console.log(insuredResponse)
          this.showClaimInsuranceButton = isInsured && payoutEligible
          if (isInsured && payoutEligible) {
            if (this.isRefunded){
              this.claimInsuranceButtonText = "Refunded"
            } else {
              this.claimInsuranceButtonText = "Click for refund"
            }
          }
          this.showButton = contract.checkPurchaseFlight(this.currentAirline) && result.statusCode == "0";
        
        },
        selectAirline: async function (airline) {
          this.currentAirline = airline;
          await this.checkStatus();
        },
        isAirlineSelected: function (airline) {
          return this.currentAirline == airline;
        },
        claimInsurance: async function() {
          this.isLoading = true
          try {
            console.log(this.currentAirline)
            await contract.claimInsurance(this.currentAirline)
            await this.checkStatus();
          } catch (e) {
            console.error(e)
          }
          this.isLoading = false
        },
        checkPurchaseFlight: function (airline) {
          const result = contract.checkPurchaseFlight(airline);
          console.log("-->", result);
          return result;
        },
        buyTicket: async function () {
          this.isLoading = true;
          try {
            let isConfirmed = confirm(
              `Flight ${this.currentAirline.flight} (${this.currentAirline.name}) for ${this.flightPrice} Ether?`
            );
            if (!isConfirmed) {
              return;
            }
            await contract.buyTicket(this.currentAirline, false);

            alert(
              `Flight ${this.currentAirline.flight} (${this.currentAirline.name}) bought: ${this.flightPrice} Ether`
            );
            await this.checkStatus();
            let confirmation = confirm(`Buy insurance for 1 Ether?`);
            if (!confirmation) {
              return;
            }

            await contract.buyInsurance(this.currentAirline);
            alert(
              `Insurance for Flight ${this.currentAirline.flight} (${this.currentAirline.name}) bought: 1 Ether`
            );
          } catch (e) {
            alert(e.message);
          }
          this.isLoading = false;
        },
        displayPrice: async function () {
          let result = await contract.getFlightInfo(this.currentAirline);

          console.log(result);
          this.flightPrice = contract.displayPrice(result.ticketPrice); // contract.displayPrice(this.currentAirline.price)
          return result;
        },
      },
    });
  });
})();

function addFlight() {
  DOM.elid("flight-choice").appendChild(
    DOM.div({
      className: "list-group-item list-group-item-action",
    }).appendChild(DOM.h2({ className: "mb-1" }, "Upcoming Flight"))
  );
  // DOM.elid("flight-choice").add(`
  // <a href="#" class="list-group-item list-group-item-action">
  //     <div class="d-flex w-100 justify-content-between">
  //         <h5 class="mb-1">Upcoming Flight</h5>
  //         <small>3 days ago</small>
  //     </div>
  //     <p class="mb-1">Some placeholder content in a paragraph.</p>
  //     <btn class="btn btn-primary" id="buy-flight">Buy Flight</btn>
  //     </a>
  // `)
}

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  let section = DOM.section();
  section.appendChild(DOM.h2(title));
  section.appendChild(DOM.h5(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({ className: "row" }));
    row.appendChild(DOM.div({ className: "col-sm-4 field" }, result.label));
    row.appendChild(
      DOM.div(
        { className: "col-sm-8 field-value" },
        result.error ? String(result.error) : String(result.value)
      )
    );
    section.appendChild(row);
  });
  displayDiv.append(section);
}

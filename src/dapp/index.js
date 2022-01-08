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
      },
      mounted: function () {
        this.displayPrice();
        this.showButton = contract.checkPurchaseFlight(this.currentAirline);
      },
      methods: {
        submitOracle: async function () {
            try {
                const result = await contract.fetchFlightStatus(this.oracleFlightNumber)
                alert(result);
            } catch (e) {
                alert(e.message)
            }
        },
        selectAirline: async function (airline) {
          this.currentAirline = airline;
          await this.displayPrice();
          this.showButton = contract.checkPurchaseFlight(this.currentAirline);
        },
        isAirlineSelected: function (airline) {
          return this.currentAirline == airline;
        },
        checkPurchaseFlight: function (airline) {
          const result = contract.checkPurchaseFlight(airline);
          console.log("-->", result);
          return result;
        },
        buyTicket: async function () {
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
            this.showButton = contract.checkPurchaseFlight(this.currentAirline);
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
        },
        displayPrice: async function () {
          let result = await contract.getFlightInfo(this.currentAirline);

          console.log(result);
          this.flightPrice = contract.displayPrice(result.ticketPrice); // contract.displayPrice(this.currentAirline.price)
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

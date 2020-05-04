// Using the following object to figure out which section is active
const Navigator = {
  previousActiveSection: -1,
  activeSection: 0,
  maxSolvableSection: 6,
  solvedSections: {
    0: false,
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
  },
};

// Using this object to store the users' selection
const Selection = {
  carType: "small car",
  percentHighway: 0.5,
  environmentLevel: 1,
  WD: "either",
  priceMin: 0,
  priceMax: 100000,
}

// some setup stuffs
function onLoaded() {
  // collapse all the sections
  Array.from(Array(Navigator.maxSolvableSection).keys()).forEach(v => collapseSection(v));
  // update the view
  updateView();
  getResults();
}
window.addEventListener("load", onLoaded);

function setNextSection() {
  setActiveSection(Navigator.activeSection + 1);
}

function setActiveSection(sectionId) {
  // set the current section as solved if we move up
  if (Navigator.activeSection < sectionId) {
    makeSolved(Navigator.activeSection);
  }

  // find the maximum solved section
  const maxSolved = Object.keys(Navigator.solvedSections)
                          .filter(k => Navigator.solvedSections[k])
                          .map(k => parseInt(k))
                          .reduce((a, b) => Math.max(a, b));

  // we should be able to answer the next section, but not any above that
  // this allows to go back to previous sections as well
  const maxAllowed = Math.min(maxSolved + 1, Navigator.maxSolvableSection);
  if (parseInt(sectionId) > maxAllowed) {
    // TODO: signal to user that they can't do this.
    return;
  }

  // update the sections, then update the views
  Navigator.previousActiveSection = Navigator.activeSection;
  Navigator.activeSection = parseInt(sectionId);
  updateView();
}

function makeSolved(sectionId) {
  if (!Navigator.solvedSections[sectionId]) {
    const section = document.querySelectorAll(".section")[sectionId];
    const smallView = section.children[0];
    smallView.classList.add("section-small-view-solved");
  }
  Navigator.solvedSections[sectionId] = true;
}

function updateView() {
  if (Navigator.previousActiveSection >= 0) {
    collapseSection(Navigator.previousActiveSection);
  }

  if (Navigator.activeSection < Navigator.maxSolvableSection) {
    expandSection(Navigator.activeSection);
  }

  // this is now we're displaying results
  if (Navigator.activeSection === Navigator.maxSolvableSection) {
    // TODO: do something if needed
  }
}

/**
 * get the small view and large view; then display and hide them accordingly
 */
function collapseSection(sectionId) {
  const section = document.querySelectorAll(".section")[sectionId];
  const smallView = section.children[0];
  smallView.style.display = "block";
  const largeView = section.children[1];
  largeView.style.display = "none";
  const nextButton = section.children[2];
  nextButton.style.display = "none";
}

/**
 * get the small view and large view; then hide and display them accordingly
 */
function expandSection(sectionId) {
  const section = document.querySelectorAll(".section")[sectionId];
  const smallView = section.children[0];
  smallView.style.display = "none";
  const largeView = section.children[1];
  largeView.style.display = "block";
  const nextButton = section.children[2];
  nextButton.style.display = "block";
}


// Functions used for when things are updated in the app
function updateCarType(type){
  Selection.carType = type;
  getResults();
}

function updateWheelDrive(wd){
  Selection.WD = wd;
  getResults();
}

function updateMin(price){
  Selection.priceMin = parseInt(price);
  getResults();
}

function updateMax(price){
  Selection.priceMax = parseInt(price);
  getResults();
}

function updateEnvironmentCare(level){
  Selection.environmentLevel = parseInt(level);
  getResults();
}

function updateHighwayPercentage(newPercentage){
  Selection.percentHighway = parseInt(newPercentage) / 100;
  getResults();
}

function getResults() {
    // filter the car type
    let filteredResults = Data.data.filter(car => (
      car["Veh Class"] === Selection.carType
      && car["price"] >= Selection.priceMin
      && car["price"] <= Selection.priceMax
      && (car["Air Pollution Score"] + car["Greenhouse Gas Score"]) / 2 >= Selection.environmentLevel
    ));

    // filter the wheel drives
    if (Selection.WD !== "either") {
      filteredResults = filteredResults.filter(car => car["Drive"] === Selection.WD)
    }

    // get user's mpg and sort by it
    filteredResults.map(car => car["mpg"] = calculateMPG(car));
    filteredResults.sort(function(a, b) {
      if (a["mpg"] < b["mpg"]) return 1;
      if (a["mpg"] > b["mpg"]) return -1;
      return 0;
    });

    function makeCarPrice(price) {
      return ` - <span class="CSS-car-price">$${price}</span>`;
    }

    //We can change this based on what we want to show
    let topResults = filteredResults.slice(0,10)
                                    .map(car => car["Model"] + " - " + car["mpg"] + "MPG" + makeCarPrice(car["price"]));

    let resultingString = "";
    let maxVal = 0;
    let minVal = 1000;
    for (let i = 0; i < filteredResults.length; i++){
      let mpg = filteredResults[i]["mpg"];
      if (mpg > maxVal){
        maxVal = mpg;
      }
      if (mpg < minVal){
        minVal = mpg;
      }
    }
    const sectionHeight = 4 * maxVal;
    for(let i = 0; i < topResults.length; i++){
      const blockHeight = (maxVal - filteredResults[i]["mpg"]) * 4
      resultingString += `<div class='carResult' style='height: ${sectionHeight}px'>
        <span class='carInfo' style='top: ${blockHeight}px'>${topResults[i]}</span>
      </div>`;
    }
    document.getElementById("topVehicles").innerHTML = resultingString;
    console.log(filteredResults);
}

function calculateMPG(car){
  const pctCity = (1-Selection.percentHighway);
  const pctHighway = Selection.percentHighway;
  const carFuels = car["Fuel"].split("/").map(s => s.toLowerCase());

  // We need to take into account cars that are both gasoline and electric
  // So, we take the average of the two if applicable, and take just one if not.
  let mpg = 0;
  let count = 0;
  if (carFuels.includes("electricity")) {
    mpg += parseInt(car["Electric City MPG"]) * pctCity + parseInt(car["Electric Hwy MPG"]) * pctHighway;
    count += 1;
  }
  if (carFuels.includes("gasoline")) {
    mpg += parseInt(car["Fuel City MPG"]) * pctCity + parseInt(car["Fuel Hwy MPG"]) * pctHighway;
    count += 1;
  }
  return mpg / count;
}

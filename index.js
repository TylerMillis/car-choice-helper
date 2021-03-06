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

const CYAN_T020 = "rgba(0, 255, 255, 0.2)";
const AVG_CO2 = 385.32302685109846;

// Using this object to store the users' selection
const Selection = {
  carType: "small car",
  percentHighway: 0.5,
  environmentLevel: 1,
  WD: "either",
  priceMin: 0,
  priceMax: 100000,
}

const SVMap = {
  environment: { 1: "do not care", 4: "somewhat care", 7: "care" },
};

// some setup stuffs
function onLoaded() {
  // collapse all the sections
  Array.from(Array(Navigator.maxSolvableSection).keys()).forEach(v => collapseSection(v));
  // update the view
  updateView();
  getResults();
  slowScrollToHeight(0);
  window.addEventListener("resize", getResults);
  window.addEventListener("resize", updateView);
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
  // update the previous section if it's solved
  if (Navigator.solvedSections[Navigator.activeSection]) {
    updateSectionSmallView(Navigator.activeSection);
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

function updateSectionSmallView(sectionId) {
  switch (sectionId) {
    case 1:
      // Highway vs. City
      document.querySelector("#sv-highway").innerText = (Selection.percentHighway * 100) + "%";
      document.querySelector("#sv-city").innerText = ((1 - Selection.percentHighway) * 100) + "%";
      break;
    case 2:
      // Environment Level
      document.querySelector("#sv-env-footprint").innerText = SVMap.environment[Selection.environmentLevel];
      break;
    case 3:
      // Car size
      document.querySelector("#sv-car-size").innerText = Selection.carType;
      break;
    case 4:
      // Wheel drive
      document.querySelector("#sv-wd").innerText = Selection.WD;
      break;
    case 5:
      // Price
      document.querySelector("#sv-min-price").innerText = "$" + Selection.priceMin;
      document.querySelector("#sv-max-price").innerText = "$" + Selection.priceMax;
      break;
    default:
      break;
  }
}

function updateView() {
  if (Navigator.previousActiveSection >= 0) {
    collapseSection(Navigator.previousActiveSection);
  }

  if (Navigator.activeSection < Navigator.maxSolvableSection) {
    expandSection(Navigator.activeSection);
  } else {
    // this is now we're displaying results
    const height = document.querySelector("#CSS-result-separator").offsetTop;
    slowScrollToHeight(height);
  }
}

function slowScrollToHeight(height) {
  const delta = 12, timeDelta = 2;
  const currentHeight = window.scrollY;
  let scrollF = null;
  if (currentHeight < height) {
    scrollF = () => {
      window.scrollTo(0, Math.min(currentHeight + delta, height));
      slowScrollToHeight(height);
    };
  } else if (currentHeight > height) {
    scrollF = () => {
      window.scrollTo(0, Math.max(currentHeight - delta, height));
      slowScrollToHeight(height);
    };
  } else {
    return;
  }
  setTimeout(scrollF, timeDelta);
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
  section.style.minHeight = null;
  section.style.backgroundColor = null;
}

/**
 * get the small view and large view; then hide and display them accordingly
 */
function expandSection(sectionId) {
  const allSections = document.querySelectorAll(".section")
  const section = allSections[sectionId];
  const smallView = section.children[0];
  smallView.style.display = "none";
  const largeView = section.children[1];
  largeView.style.display = "block";
  const nextButton = section.children[2];
  nextButton.style.display = "block";

  // set the height of the expanded section such that all the sections
  // take up all the heights. sum of the sizes of the small views
  // (because they may have different sizes).
  const svHeight = Array.from(Array(Navigator.maxSolvableSection).keys())
                        .filter(k => k !== sectionId)
                        .map(k => allSections[k].clientHeight)
                        .reduce((a, b) => a + b);
  const titleHeight = allSections[0].offsetTop;
  const desiredHeight = window.innerHeight - (svHeight) - (titleHeight);
  section.style.minHeight = desiredHeight + "px";
  section.style.backgroundColor = CYAN_T020;
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
    filteredResults = filteredResults.filter(car => car["Drive"] === Selection.WD);
  }

  // get user's mpg and sort by it
  filteredResults.map(car => car["mpg"] = calculateMPG(car));
  filteredResults.sort(function (a, b) {
    if (a["mpg"] < b["mpg"]) {
      return 1;
    }
    if (a["mpg"] > b["mpg"]) {
      return -1;
    }
    return 0;
  });

  function round(x) {
    return Math.round(x * 100) / 100;
  }

  // We can change this based on what we want to show
  const topPicks = 10;
  const topResultsData = filteredResults.slice(0, topPicks).map((el, index) => {
    return {
      co2_delta: round(((el["Comb CO2"] - AVG_CO2)/AVG_CO2) * 100),
      mpg: el["mpg"],
      model: el["Model"],
      rank: index + 1,
      price: el["price"],
    };
  });
  updateBarGraph(topResultsData);
  displayQuickResults(filteredResults);
}

function updateBarGraph(topResultsData) {
  console.log(topResultsData);

  // first remove all the previous ones
  const container = d3.select("div#topVehicles");
  container.selectAll("span").remove();

  if (topResultsData.length === 0) {
    displayNoResultsOnContainer(container, "ms");
  }

  const minMpg = topResultsData.map(d => d.mpg).reduce((a, b) => Math.min(a,b));
  const maxMpg = topResultsData.map(d => d.mpg).reduce((a, b) => Math.max(a,b));
  const mpgRange = (maxMpg - minMpg);
  const lowPct = 10;
  const highPct = 95 - lowPct;

  function co2Qualifier(value) {
    console.log(value);
    if (value < 0) {
      return "<span style='color: rgb(30, 170, 50); font-weight: 900;'>less</span>";
    }
    if (value === 0) {
      console.error("NOT SUPPOSED TO HAPPEN. co2Qualifier should not be 0");
    }
    return "<span style='color: rgb(170, 50, 30); font-weight: 900;'>more</span>";
  }

  function mpgBarColor(d) {
    const projectedValue = (lowPct + (((d.mpg - minMpg)/mpgRange) * (100-lowPct)))/100;
    const lowestBlue = 25;
    const highestBlue = 175;
    const blue = (projectedValue * (highestBlue - lowestBlue)) + lowestBlue;
    return `rgb(65, 40, ${blue})`;
  }

  function enterFxn(enter) {
    const carObj = enter.append("span");
    carObj.attr("class", "ms-result");

    const carObjInit = carObj.append("span");
    carObjInit.attr("class", "ms-result-init");

    const modelObj = carObjInit.append("span");
    modelObj.attr("class", "ms-model");
    modelObj.text(d => `${d.model}`);

    const priceObj = carObjInit.append("span");
    priceObj.attr("class", "ms-price");
    priceObj.text(d => `$${d.price}`);

    const co2Obj = carObjInit.append("span");
    co2Obj.attr("class", "ms-co2");
    co2Obj.html(d => `Emits ${Math.abs(d.co2_delta)}% ${co2Qualifier(d.co2_delta)} CO2 than the average car`);


    carObjInit.on("click", (d) => window.open(googleLink(d["model"]), "_blank"));


    const barObj = carObj.append("span");
    barObj.attr("class", "ms-bar");
    const barObjInit = barObj.append("span");
    barObjInit.attr("class", "ms-bar-init");
    barObjInit.style("width", d => (lowPct + (((d.mpg - minMpg)/mpgRange) * highPct)) + "%");
    barObjInit.style("background-color", d => mpgBarColor(d));
    barObjInit.text("-");

    const rankObj = barObjInit.append("span");
    rankObj.attr("class", "ms-rank");
    rankObj.text(d => `${d.mpg} MPG`);

  }
  container.selectAll("span")
           .data(topResultsData)
           .join(
             enterFxn,
             update => update,
             exit => exit.remove(),
           );
  return;
  // %=====================================================================
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
  if (carFuels.includes("hydrogen")) {
    mpg += parseInt(car["Fuel City MPG"]) * pctCity + parseInt(car["Fuel Hwy MPG"]) * pctHighway;
    count += 1;
  }
  return mpg / count;
}

function displayQuickResults(results) {
  const container = d3.select("#side-results div")
  container.selectAll("span").remove();

  if (results.length === 0) {
    displayNoResultsOnContainer(container, "sr");
    return;
  }

  function enterFxn(enter) {
    const carObject = enter.append("span");
    carObject.attr("class", "sr-result");

    const rankObj = carObject.append("span");
    rankObj.attr("class", "sr-rank");
    rankObj.text((d, i) => `${i + 1}`);

    const modelObj = carObject.append("span");
    modelObj.attr("class", "sr-model");
    modelObj.text(d => `${d["Model"]}`);

    carObject.on("click", (d) => window.open(googleLink(d["Model"]), "_blank"))
  }
  container.selectAll("span")
           .data(results)
           .join(
             enterFxn,
             update => update,
             exit => exit.remove(),
           );
}

function displayNoResultsOnContainer(container, pre_class) {
  const header = container.selectAll("span").data([1]).join("span");
  header.attr("class", `${pre_class}-no-result`);
  header.text("No results :(");
}

function googleLink(s) {
  return "http://www.google.com/search?q=" + s;
}
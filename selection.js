const Selection = {
  carType: "small car",
  percentHighway: 0.5,
  environmentLevel: 1,
  WD: "either",
  priceMin: 0,
  priceMax: 100000,
}

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
      const blockHeight = (maxVal - filteredResults[i]["mpg"]) * 4;
      let url = "http://www.google.com/search?q=" + filteredResults[i]["Model"].replace(" ","+");
      console.log(url);
      resultingString += `<div class='carResult' style='height: ${sectionHeight}px'>
        <span class='carInfo' style='top: ${blockHeight}px'><a target="_blank" href="${url}">${topResults[i]}</a></span>
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

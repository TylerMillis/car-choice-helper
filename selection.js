var carType = "small car";
var percentHighway = 0.5;
var environmentLevel = 1;
var WD = "either";
var priceMin = 0;
var priceMax = 100000;

function updateCarType(type){
    carType = type;
    getResults();
}

function updateWheelDrive(wd){
    WD = wd;
    getResults();
}

function updateMin(price){
    priceMin = parseInt(price);
    getResults();
}

function updateMax(price){
    priceMax = parseInt(price);
    getResults();
}

function updateEnvironmentCare(level){
    environmentLevel = parseInt(level);
    getResults();
}

function updateHighwayPercentage(newPercentage){
    percentHighway = parseInt(newPercentage) / 100;
    console.log(percentHighway);
    getResults();
}

function getResults(){

    let filteredResults = Data.data.filter(car => car["Veh Class"] === carType &&
    car["price"] >= priceMin &&
        car["price"] <= priceMax &&
        (car["Air Pollution Score"] + car["Greenhouse Gas Score"]) / 2 >= environmentLevel);

    if(WD !== "either"){
        filteredResults = filteredResults.filter(car => car["Drive"] == WD)
    }

    //Get user's mpg and sort by it
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
    for(let i = 0; i < filteredResults.length; i++){
        let mpg = filteredResults[i]["mpg"];
        if(mpg > maxVal){
            maxVal = mpg;
        }
        if(mpg < minVal){
            minVal = mpg;
        }
    }
    for(let i = 0; i < topResults.length; i++){
        resultingString += "<div class='carResult' style='height: " + maxVal * 4 + "px'><span class='carInfo' style='top: " + (maxVal -filteredResults[i]["mpg"]) * 4 + "px'>" + topResults[i] + "</span></div>";
    }

    document.getElementById("topVehicles").innerHTML = resultingString;//"<li>" + topResults.join("</li><li>") + "</div>";
    console.log(filteredResults);
}

function calculateMPG(car){
    if(car["Electric City MPG"]){
        return parseInt(car["Electric City MPG"] * (1 - percentHighway) + car["Electric Hwy MPG"] * percentHighway);
    } else {
        return parseInt(car["Fuel City MPG"] * (1 - percentHighway) + car["Fuel Hwy MPG"] * percentHighway);
    }
}

const Graphing = {I: {}};

// Which elemens are we putting these graphs on
Graphing.nodes = {
  cyl_ghg: "#graph-cyl-ghg svg",
};

Graphing.graph_cyl_ghg = function() {
  nv.addGraph(Graphing.I.cylinders_to_ghg_score);
}

window.addEventListener("load", Graphing.graph_cyl_ghg);

////
//// All the graphing functions below
////

// From: http://nvd3.org/examples/scatter.html
Graphing.I.cylinders_to_ghg_score = function() {
  var chart = nv.models.scatterChart()
                .showDistX(true)
                .showDistY(true)
                .transitionDuration(350)
                .color(d3.scale.category10().range());

  //Configure how the tooltip looks.
  chart.tooltipContent(function(key) {
      return '<h3>' + key + '</h3>';
  });

  //Axis settings
  chart.xAxis.tickFormat(d3.format('.02f'));
  chart.yAxis.tickFormat(d3.format('.02f'));

  //We want to show shapes other than circles.
  chart.scatter.onlyCircles(false);

  const rawData = ChartData.average_cylinders_to_ghg_score;
  // the data must have the following form:
  //   Map<key: string, values: Array[Point]>
  //   Point = Map<shape: Shape, size: number, x: number, y: number>
  //   Shape = Union["circle", "cross", "triangle-up", "triangle-down", diamond", "square"]
  // The function sizeMap is supposed to make sizes work instead
  // of huge numbers.
  const maxSize = rawData.reduce((a,b) => Math.max(a, b));
  function sizeMap(v) {
    return 1.5 * (v / maxSize);
  }
  const data = {
    key: "",
    values: rawData.map(d => ({
      x: d["average-number-of-cylinders"],
      y: d["greenhouse-gas-score"],
      size: sizeMap(d["50th-percentile-of-price"])
    })),
  }

  d3.select(Graphing.nodes.cyl_ghg)
      .datum(data)
      .call(chart);

  nv.utils.windowResize(chart.update);

  return chart;
}

var idSelect1 = d3.select("#selDataset1");
var idSelect2 = d3.select("#selDataset2");
var sunburts1 = d3.select("#sunburst1");
var sunburst2 = d3.select("#sunburst2");
var idSelect3 = d3.select("#selDataset3");
var d3Sunburst = d3.select("#d3Sunburst");
// create a function to reset divs to prepare for new data
function resetData() {

  // ----------------------------------
  // CLEAR THE DATA
  // ----------------------------------

  sunburts1.html("");
  sunburst2.html("");
  d3Sunburst.html("");

}; // close resetData()

// ----------------------------------------------------------------------------
function init() {
      // reset any previous charts
      resetData();
      // get the first dataset name from the list
      var  firstData= idSelect1.property("value")

      // get the second dataset names from the list
      var  secondData= idSelect2.property("value")

      d3.select('#label1')
      .text('Plot: ' + firstData);
      d3.select('#label2')
      .text('Plot: ' + secondData);
      var api1 = "api/sunburst_crime_data"
      var api2 = "api/sunburst_school_data"
      // plot charts with initial county names
      plotCharts1(api1);
      plotCharts2(api2);
}

// --------------------------------------------------------------------------
function plotCharts1(api1){
  d3.csv(api1, function(err, rows){
    if (err) throw err;
    function unpack(rows, key) {
  return rows.map(function(row) { return row[key]; });
  }
  
  // console.log(unpack(rows, 'value'));
  var data = [
    {
      type: "sunburst",
      maxdepth: 2,
      ids: unpack(rows, 'id'),
      labels: unpack(rows, 'label'),
      parents: unpack(rows, 'parent'),
      values: unpack(rows, 'value')
    }
  ];
  
  var layout = {
  margin: {l: 0, r: 0, b: 0, t:0},
  width: 650,
  height: 600,
  sunburstcolorway:[
    "#636efa","#EF553B","#00cc96","#ab63fa","#19d3f3",
    "#e763fa", "#FECB52","#FFA15A","#FF6692","#B6E880"
  ],
  extendsunburstcolorway: true
  };
  
  
  Plotly.newPlot('sunburst1', data, layout, {showSendToCloud: true});
  });
}

// ----------------------------------------------------------------------------
function plotCharts2(api2){
  d3.csv(api2, function(err, rows){
    if (err) throw err;
    function unpack(rows, key) {
  return rows.map(function(row) { return row[key]; });
  }
  
  // console.log(unpack(rows, 'value'));
  var data = [
    {
      type: "sunburst",
      maxdepth: 2,
      ids: unpack(rows, 'id'),
      labels: unpack(rows, 'label'),
      parents: unpack(rows, 'parent'),
      values: unpack(rows, 'value')
    }
  ];
  
  var layout = {
  margin: {l: 0, r: 0, b: 0, t:0},
  width: 620,
  height: 600,
  sunburstcolorway:[
    "#636efa","#EF553B","#00cc96","#ab63fa","#19d3f3",
    "#e763fa", "#FECB52","#FFA15A","#FF6692","#B6E880"
  ],
  extendsunburstcolorway: true
  };
    
  Plotly.newPlot('sunburst2', data, layout, {showSendToCloud: true});
  });


}

// ----------------------------------------------------------------------
function optionChanged1(data) {

  // reset the data
  // resetData();


  // get the first dataset name from the list
  var  firstData= data

  d3.select('#label1')
  .text('Plot: ' + firstData);

  if (firstData == "NJ Crime"){
    var api1 = "api/sunburst_crime_data"
  } else if (firstData == "NJ School"){
    var api1 = "api/sunburst_school_data"
  } else if (firstData == "NJ Tax"){
    var api1 = "api/sunburst_tax_data"
  } else if (firstData == "NJ Poverty"){
    var api1 = "api/sunburst_poverty_data"
  } else if (firstData == "NJ Household Income"){
    var api1 = "api/sunburst_hi_data"
  } else{
    var api1 = "api/sunburst_pop_data"
  };


  // plot the charts for this id
  plotCharts1(api1);


} // close optionChanged function

// -------------------------------------------------------------------
function optionChanged2(data) {

  // reset the data
  // resetData();

  // get the second dataset names from the list
  var  secondData= data

  d3.select('#label2')
  .text('Plot: ' + secondData);

  if (secondData == "NJ Crime"){
    var api2 = "api/sunburst_crime_data"
  } else if (secondData == "NJ School"){
    var api2 = "api/sunburst_school_data"
  } else if (secondData == "NJ Tax"){
    var api2 = "api/sunburst_tax_data"
  } else if (secondData == "NJ Poverty"){
    var api2 = "api/sunburst_poverty_data"
  } else if (secondData == "NJ Household Income"){
    var api2 = "api/sunburst_hi_data"
  } else{
    var api2 = "api/sunburst_pop_data"
  };

  // plot the charts for this id
  plotCharts2(api2);


} // close optionChanged function

// call the init() function for default data
init();


// ------------------------------------------------------------------------------
function roundUp(num, precision) {
  precision = Math.pow(10, precision)
  return Math.ceil(num * precision) / precision
}
function length(obj) {
  return Object.keys(obj).length;
}


function init1() {
  // reset any previous charts
  d3Sunburst.html("");
  d3.select("#tooltip").remove();
  // get the first dataset name from the list
  var  firstd3Data= idSelect3.property("value")

  d3.select('#label3')
  .text('Sunburst by d3: ' + firstd3Data);

  var api = "api/d3_sunburst_schools"
  // plot charts with initial county names
  d3Charts(api);
}


//  School d3 zoomable sunburst 
//  Source : http://bl.ocks.org/vgrocha/1580af34e56ee6224d33



function d3Charts(api){
  var margin = {top: 350, right: 650, bottom: 350, left: 650},
      radius = Math.min(margin.top, margin.right, margin.bottom, margin.left) - 10;

  function filter_min_arc_size_text(d, i) {return (d.dx*d.depth*radius/3)>14}; 

  var hue = d3.scale.category10();

  var luminance = d3.scale.sqrt()
      .domain([0, 1e6])
      .clamp(true)
      .range([90, 0]);

  var svg = d3.select("#d3Sunburst").append("svg").classed("img-responsive center-block", true)
      .attr("width", margin.left + margin.right)
      .attr("height", margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var partition = d3.layout.partition()
      .sort(function(a, b) { return d3.ascending(a.name, b.name); })
      .size([2 * Math.PI, radius]);

  var arc = d3.svg.arc()
      .startAngle(function(d) { return d.x; })
      .endAngle(function(d) { return d.x + d.dx - .01 / (d.depth + .5); })
      .innerRadius(function(d) { return radius / 3 * d.depth; })
      .outerRadius(function(d) { return radius / 3 * (d.depth + 1) - 1; });

  //Tooltip description
  var tooltip = d3.select("body")
      .append("div")
      .attr("id", "tooltip")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("opacity", 0);

  function format_number(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }


  function format_description(d) {
    var description = d.description;
    // if (d.child_len){
    //   return  '<b>' + d.name + '</b></br>'+ d.description + '<br> (' + roundUp(d.value/d.child_len,2) + ')';  
    // } else {
      return  '<b>' + d.name + '</b></br>'+ roundUp(d.description,2);
    // }
  }

  function computeTextRotation(d) {

    var angle=(d.x +d.dx/2)*180/Math.PI - 90	
    
    return angle;
  }


  function mouseOverArc(d) {
        d3.select(this).attr("stroke","black")
        
            tooltip.html(format_description(d));
            return tooltip.transition()
              .duration(50)
              .style("opacity", 0.9);
          }

  function mouseOutArc(){
    d3.select(this).attr("stroke","")
    return tooltip.style("opacity", 0);
  }

  function mouseMoveArc (d) {
            return tooltip
              .style("top", (d3.event.pageY-10)+"px")
              .style("left", (d3.event.pageX+10)+"px");
  }

  var root_ = null;
  d3.json(api, function(error, root) {
    if (error) return console.warn(error);
    // Compute the initial layout on the entire tree to sum sizes.
    // Also compute the full name and fill color for each node,
    // and stash the children so they can be restored as we descend.
    // console.log(root);
    partition
        .value(function(d) { return d.size; })
        .nodes(root)
        .forEach(function(d, depth) {
          if (d.children){
            d.child_len = length(d.children);
          }
          d._depth = depth; 
          d._children = d.children;
          d.sum = d.value;
          d.key = key(d);
          d.fill = fill(d);
          // console.log(d);
        });

    // Now redefine the value function to use the previously-computed sum.
    partition
        .children(function(d, depth) { return depth < 2 ? d._children : null; })
        .value(function(d) { return d.sum; });

    var center = svg.append("circle")
        .attr("r", radius / 3)
        .on("click", zoomOut);

    center.append("title")
        .text("zoom out");
        
    var partitioned_data=partition.nodes(root).slice(1)

    var path = svg.selectAll("path")
        .data(partitioned_data)
      .enter().append("path")
        .attr("d", arc)
        .style("fill", function(d) { return d.fill; })
        .each(function(d) { this._current = updateArc(d); })
        .on("click", zoomIn)
      .on("mouseover", mouseOverArc)
        .on("mousemove", mouseMoveArc)
        .on("mouseout", mouseOutArc);
    
        
    var texts = svg.selectAll("text")
        .data(partitioned_data)
      .enter().append("text")
      .filter(filter_min_arc_size_text)    	
        .attr("transform", function(d) { return "rotate(" + computeTextRotation(d) + ")"; })
      .attr("x", function(d) { return radius / 3 * d.depth; })	
      .attr("dx", "6") // margin
        .attr("dy", ".35em") // vertical-align	
      .text(function(d,i) {return d.name})

    function zoomIn(p) {
      if (p.depth > 1) p = p.parent;
      if (!p.children) return;
      zoom(p, p);
    }

    function zoomOut(p) {
      if (!p.parent) return;
      zoom(p.parent, p);
    }

    // Zoom to the specified new root.
    function zoom(root, p) {
      if (document.documentElement.__transition__) return;

      // Rescale outside angles to match the new layout.
      var enterArc,
          exitArc,
          outsideAngle = d3.scale.linear().domain([0, 2 * Math.PI]);

      function insideArc(d) {
        return p.key > d.key
            ? {depth: d.depth - 1, x: 0, dx: 0} : p.key < d.key
            ? {depth: d.depth - 1, x: 2 * Math.PI, dx: 0}
            : {depth: 0, x: 0, dx: 2 * Math.PI};
      }

      function outsideArc(d) {
        return {depth: d.depth + 1, x: outsideAngle(d.x), dx: outsideAngle(d.x + d.dx) - outsideAngle(d.x)};
      }

      center.datum(root);

      // When zooming in, arcs enter from the outside and exit to the inside.
      // Entering outside arcs start from the old layout.
      if (root === p) enterArc = outsideArc, exitArc = insideArc, outsideAngle.range([p.x, p.x + p.dx]);
    
    var new_data=partition.nodes(root).slice(1)

      path = path.data(new_data, function(d) { return d.key; });
      
    // When zooming out, arcs enter from the inside and exit to the outside.
      // Exiting outside arcs transition to the new layout.
      if (root !== p) enterArc = insideArc, exitArc = outsideArc, outsideAngle.range([p.x, p.x + p.dx]);

      d3.transition().duration(d3.event.altKey ? 7500 : 750).each(function() {
        path.exit().transition()
            .style("fill-opacity", function(d) { return d.depth === 1 + (root === p) ? 1 : 0; })
            .attrTween("d", function(d) { return arcTween.call(this, exitArc(d)); })
            .remove();
            
        path.enter().append("path")
            .style("fill-opacity", function(d) { return d.depth === 2 - (root === p) ? 1 : 0; })
            .style("fill", function(d) { return d.fill; })
            .on("click", zoomIn)
        .on("mouseover", mouseOverArc)
          .on("mousemove", mouseMoveArc)
          .on("mouseout", mouseOutArc)
            .each(function(d) { this._current = enterArc(d); });

      
        path.transition()
            .style("fill-opacity", 1)
            .attrTween("d", function(d) { return arcTween.call(this, updateArc(d)); });
            
        
          
      });
      
      
    texts = texts.data(new_data, function(d) { return d.key; })
    
    texts.exit()
            .remove()    
      texts.enter()
              .append("text")
          
      texts.style("opacity", 0)
        .attr("transform", function(d) { return "rotate(" + computeTextRotation(d) + ")"; })
      .attr("x", function(d) { return radius / 3 * d.depth; })	
      .attr("dx", "6") // margin
        .attr("dy", ".35em") // vertical-align
        .filter(filter_min_arc_size_text)    	
        .text(function(d,i) {return d.name})
      .transition().delay(750).style("opacity", 1)
          
      
    }
  });

  function key(d) {
    var k = [], p = d;
    while (p.depth) k.push(p.name), p = p.parent;
    return k.reverse().join(".");
  }

  function fill(d) {
    var p = d;
    while (p.depth > 1) p = p.parent;
    var c = d3.lab(hue(p.name));
    c.l = luminance(d.sum);
    return c;
  }

  function arcTween(b) {
    var i = d3.interpolate(this._current, b);
    this._current = i(0);
    return function(t) {
      return arc(i(t));
    };
  }

  function updateArc(d) {
    return {depth: d.depth, x: d.x, dx: d.dx};
  }

  d3.select(self.frameElement).style("height", margin.top + margin.bottom + "px");
};
init1();

// -------------------------------------------------
function optionChanged3(data) {

  // reset the data
  // resetData();
  d3Sunburst.html("");
  d3.select("#tooltip").remove();

  // get the first dataset name from the list
  var  firstd3Data= data
  // console.log(data);
  d3.select('#label3')
  .text('Sunburst by d3: ' + firstd3Data);

  if (firstd3Data === "NJ Tax"){
    var api = "api/d3_sunburst_tax";
    d3Charts(api);
  } else if (firstd3Data === "NJ Crime"){
    var api = "api/d3_sunburst_crime";
    d3Charts(api);
  }  else {
    init1();
  }

}; // close optionChanged function
// d3.csv("api/d3_data").then(function(data) {
//     console.log(data)
// });

// Set default x/y axis variables.
var xCol = "poverty_rate";
var yCol = "total_offense";
// Function used for updating x-scale var upon click on axis label.
function xScale(data, xCol, chartWidth) {
    // Create scales.
    var xLinearScale = d3.scaleLinear()
        .domain([d3.min(data, d => d[xCol]) * .8,
            d3.max(data, d => d[xCol]) * 1.1])
        .range([0, chartWidth]);
    return xLinearScale;
}
// Function used for updating xAxis var upon click on axis label.
function renderXAxes(newXScale, xAxis) {
    var bottomAxis = d3.axisBottom(newXScale);
    xAxis.transition()
        .duration(1000).attr('class', 'axis')
        .call(bottomAxis);
    return xAxis;
}
// Function used for updating y-scale var upon click on axis label.
function yScale(data, yCol, chartHeight) {
    // Create scales.
    var yLinearScale = d3.scaleLinear()
        .domain([d3.min(data, d => d[yCol]) * .8,
            d3.max(data, d => d[yCol]) * 1.1])
        .range([chartHeight, 0]);
    return yLinearScale;
}
// Function used for updating yAxis var upon click on axis label.
function renderYAxes(newYScale, yAxis) {
    var leftAxis = d3.axisLeft(newYScale);
    yAxis.transition()
        .duration(1000)
        .call(leftAxis);
    return yAxis;
}
// Function used for updating circles group with a transition to new circles.
function renderCircles(circlesGroup, newXScale, newYScale, xCol, yCol) {
    circlesGroup.transition()
        .duration(1000)
        .attr("cx", d => newXScale(d[xCol]))
        .attr("cy", d => newYScale(d[yCol]));
    return circlesGroup;
}
// Function used for updating text in circles group with a transition to new text.
function renderText(circletextGroup, newXScale, newYScale, xCol, yCol) {
    circletextGroup.transition()
        .duration(1000)
        .attr("x", d => newXScale(d[xCol]))
        .attr("y", d => newYScale(d[yCol]));
    return circletextGroup;
}
var decimal_format = d3.format(".2f");
// Function used for updating circles group with new tooltip.
function updateToolTip(xCol, yCol, circlesGroup, textGroup) {
    // Conditional for X Axis.
    if (xCol === "poverty_rate") {
        var xlabel = "Poverty rate: ";
    } else if (xCol === "median_hh_income") {
        var xlabel = "Median Income: "
    } else if (xCol === "school_score") {
        var xlabel = "Average Schoool Score: "
    } else {
        var xlabel = "Property Tax rate: "
    }
    // Conditional for Y Axis.
    if (yCol === "total_offense") {
        var ylabel = "Total offense : ";
    } else if (yCol === "rate_per_100k") {
        var ylabel = "Crime rate per 100k: "
    } else {
        var ylabel = "Total arrests: "
    }
    // Define tooltip.
    var toolTip = d3.tip()
        .offset([-20, 0])
        .attr("class", "d3-tip")
        .html(function(d) {
            if (xCol === "poverty_rate") {
                // All yAxis tooltip labels presented and formated as %.
                // Display Poverty as percentage for xAxis.
                return (`${d.county_name}<br>${xlabel} ${d[xCol]}%<br>${ylabel}${d[yCol]}<br>population: ${d.population}`);
                } else if (xCol === "tax_rate") {
                // Display tax rate for xAxis.
                return (`${d.county_name}<br>${xlabel} ${decimal_format(d[xCol])}%<br>${ylabel}${d[yCol]}<br>population: ${d.population}`);
                } else if (xCol === "median_hh_income") {
                // Display income for xAxis.
                return (`${d.county_name}<br>${xlabel} $${d[xCol]}<br>${ylabel}${d[yCol]}<br>population: ${d.population}`);
                } else {
                // Display  School ranking for xAxis.
                return (`${d.county_name}<br>${xlabel} ${d[xCol]}<br>${ylabel}${d[yCol]}<br>population: ${d.population}`);
                }      
        });
    circlesGroup.call(toolTip);
    // Create "mouseover" event listener to display tool tip.
    circlesGroup
        .on("mouseover", function(data) {
            toolTip.show(data, this);
            d3.select(this)
            .transition()
            .duration(1000)
            .attr("r", 20);
        })
        .on("mouseout", function(data) {
            toolTip.hide(data);
            d3.select(this)
            .transition()
            .duration(1000)
            .attr("r", 15);
        });
    textGroup
        .on("mouseover", function(data) {
            toolTip.show(data, this);
        })
        .on("mouseout", function(data) {
            toolTip.hide(data);
        });
    return circlesGroup;
}   
// Hide all the cards
    d3.selectAll('.card').each(function() {
        if ((d3.select(this).attr('id'))!== `#${xCol}-${yCol}`){
            d3.select(this).style("display", "none");
        }
    });    
    var activeCard = d3.select(`#${xCol}-${yCol}`);
    activeCard.style("display", "block");
function makeResponsive() {
    // Select div by id.
    var svgArea = d3.select("#scatter").select("svg");
    // Clear SVG.
    if (!svgArea.empty()) {
        svgArea.remove();
    }
    //SVG params.
    var svgHeight = window.innerHeight/1.5;
    var svgWidth = window.innerWidth/1.1;
    // Margins.
    var margin = {
        top: 50,
        right: 110,
        bottom: 120,
        left: 150
    };
    // Chart area minus margins.
    var chartHeight = svgHeight - margin.top - margin.bottom;
    var chartWidth = svgWidth - margin.left - margin.right;
    // Create an SVG wrapper, append an SVG group that will hold our chart,
    // and shift the latter by left and top margins.
    var svg = d3
    .select("#scatter")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);
    // Append an SVG group
    var chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    d3.csv("api/d3_data").then(function(crimeDtata, err) {
        if (err) throw err;
        // Parse data.
        crimeDtata.forEach(function(data) {
            data.poverty_rate = +data.poverty_rate;
            data.median_hh_income = +data.median_hh_income;
            data.school_score = +data.school_score;
            data.total_offense = +data.total_offense;
            data.rate_per_100k = +data.rate_per_100k;
            data.total_arrest = +data.total_arrest;
            data.tax_rate = +data.tax_rate;
        });
        // Create x/y linear scales.
        var xLinearScale = xScale(crimeDtata, xCol, chartWidth);
        var yLinearScale = yScale(crimeDtata, yCol, chartHeight);
        // Create initial axis functions.
        var bottomAxis =d3.axisBottom(xLinearScale);
        var leftAxis = d3.axisLeft(yLinearScale);
        // Append x axis.
        var xAxis = chartGroup.append("g")
            .attr("transform", `translate(0, ${chartHeight})`).attr('class', 'axis')
            .call(bottomAxis);
        // Append y axis.
        var yAxis = chartGroup.append("g").attr('class', 'axis')
            .call(leftAxis);
        // Set data used for circles.
        var circlesGroup = chartGroup.selectAll("circle")
            .data(crimeDtata);
        // Bind data.
        var elemEnter = circlesGroup.enter();
        // Create circles.
        var circle = elemEnter.append("circle")
            .attr("cx", d => xLinearScale(d[xCol]))
            .attr("cy", d => yLinearScale(d[yCol]))
            .attr("r", 15)
            .classed("stateCircle", true);
        // Create circle text.
        var circleText = elemEnter.append("text")            
            .attr("x", d => xLinearScale(d[xCol]))
            .attr("y", d => yLinearScale(d[yCol]))
            .attr("dy", ".35em") 
            .text(d => d.county_code)
            .classed("stateText", true);
        // Update tool tip function above csv import.
        var circlesGroup = updateToolTip(xCol, yCol, circle, circleText);
        // Add x label groups and labels.
        var xLabelsGroup = chartGroup.append("g")
            .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 20})`);
        var povertyLabel = xLabelsGroup.append("text")
            .attr("x", 0)
            .attr("y", 20)
            .attr("value", "poverty_rate") // value to grab for event listener
            .classed("active", true)
            .text("Poverty Rate (%)");
        var schoolLabel = xLabelsGroup.append("text")
            .attr("x", 0)
            .attr("y", 40)
            .attr("value", "school_score") // value to grab for event listener
            .classed("inactive", true)
            .text("Average School Score");
        var incomeLabel = xLabelsGroup.append("text")
            .attr("x", 0)
            .attr("y", 60)
            .attr("value", "median_hh_income") // value to grab for event listener
            .classed("inactive", true)
            .text("Household Income (Median)");
        var taxLabel = xLabelsGroup.append("text")
            .attr("x", 0)
            .attr("y", 80)
            .attr("value", "tax_rate") // value to grab for event listener
            .classed("inactive", true)
            .text("Property Tax rate (%)")
        // Add y labels group and labels.
        var yLabelsGroup = chartGroup.append("g")
            .attr("transform", "rotate(-90)");
        var totOffLabel = yLabelsGroup.append("text")
            .attr("x", 0 - (chartHeight / 2))
            .attr("y", 90 - margin.left)
            .attr("dy", "1em")
            .attr("value", "total_offense")
            .classed("active", true)
            .text("Total Offense");
        var offRateLabel = yLabelsGroup.append("text")
            .attr("x", 0 - (chartHeight / 2))
            .attr("y",70 - margin.left)
            .attr("dy", "1em")
            .attr("value", "rate_per_100k")
            .classed("inactive", true)
            .text("Crime Rate Per 100k");
        var totArrestLabel = yLabelsGroup.append("text")
            .attr("x", 0 - (chartHeight / 2))
            .attr("y", 50 - margin.left)
            .attr("dy", "1em")
            .attr("value", "total_arrest")
            .classed("inactive", true)
            .text("Total Arrest");
        // X labels event listener.
        xLabelsGroup.selectAll("text")
            .on("click", function() {
                // Grab selected label.
                xCol = d3.select(this).attr("value");
                // Update xLinearScale.
                xLinearScale = xScale(crimeDtata, xCol, chartWidth);
                // Render xAxis.
                xAxis = renderXAxes(xLinearScale, xAxis);
                // Switch active/inactive labels.
                if (xCol === "poverty_rate") {
                    activeCard.style("display", "none");
                    povertyLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    schoolLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    incomeLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    taxLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    activeCard = d3.select(`#${xCol}-${yCol}`);
                    activeCard.style("display", "block");
                } else if (xCol === "school_score") {
                    activeCard.style("display", "none");
                    povertyLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    schoolLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    incomeLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    taxLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    activeCard = d3.select(`#${xCol}-${yCol}`);
                    activeCard.style("display", "block");
                } else if (xCol === "median_hh_income") {
                    activeCard.style("display", "none");
                    povertyLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    schoolLabel
                        .classed("active", false)
                        .classed("inactive", true)
                    incomeLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    taxLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    activeCard = d3.select(`#${xCol}-${yCol}`);
                    activeCard.style("display", "block");
                } else {
                    activeCard.style("display", "none");
                    povertyLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    schoolLabel
                        .classed("active", false)
                        .classed("inactive", true)
                    incomeLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    taxLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    activeCard = d3.select(`#${xCol}-${yCol}`);
                    activeCard.style("display", "block");
                }
                // Update circles with new x values.
                circle = renderCircles(circlesGroup, xLinearScale, yLinearScale, xCol, yCol);
                // Update tool tips with new info.
                circlesGroup = updateToolTip(xCol, yCol, circle, circleText);
                // Update circles text with new values.
                circleText = renderText(circleText, xLinearScale, yLinearScale, xCol, yCol);
            });
        // Y Labels event listener.
        yLabelsGroup.selectAll("text")
            .on("click", function() {
                // Grab selected label.
                yCol = d3.select(this).attr("value");
                // Update yLinearScale.
                yLinearScale = yScale(crimeDtata, yCol, chartHeight);
                // Update yAxis.
                yAxis = renderYAxes(yLinearScale, yAxis);
                // Changes classes to change bold text.
                if (yCol === "total_offense") {
                    activeCard.style("display", "none");
                    totOffLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    offRateLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    totArrestLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    activeCard = d3.select(`#${xCol}-${yCol}`);
                    activeCard.style("display", "block");
                } else if (yCol === "rate_per_100k"){
                    activeCard.style("display", "none");
                    totOffLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    offRateLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    totArrestLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    activeCard = d3.select(`#${xCol}-${yCol}`);
                    activeCard.style("display", "block");
                } else {
                    activeCard.style("display", "none");
                    totOffLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    offRateLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    totArrestLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    activeCard = d3.select(`#${xCol}-${yCol}`);
                    activeCard.style("display", "block");
                }
                // Update circles with new y values.
                circle = renderCircles(circlesGroup, xLinearScale, yLinearScale, xCol, yCol);
                // Update circles text with new values.
                circleText = renderText(circleText, xLinearScale, yLinearScale, xCol, yCol);
                // Update tool tips with new info.
                circlesGroup = updateToolTip(xCol, yCol, circle, circleText);
            });
    }).catch(function(err) {
        console.log(err);
    });
}
makeResponsive();
// Event listener for window resize.
// When the browser window is resized, makeResponsive() is called.
d3.select(window).on("resize", makeResponsive);
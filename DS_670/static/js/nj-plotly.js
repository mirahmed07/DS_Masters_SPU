// select the user input field
var idSelect = d3.select("#selDataset");

// select the demographic info div's ul list group
var demographicsTable = d3.select("#sample-metadata");

// select the bar chart div
var barChart = d3.select("#bar");

// select the bubble chart div
var bubbleChart = d3.select("#bubble");

// select the gauge chart div
var gaugeChart = d3.select("#gauge");

// create a function to initially populate dropdown menu with IDs and draw charts by default (using the first ID)
function init() {

    // reset any previous data
    resetData();

    // read JSON in from API
    d3.json("api/plotly_data").then((data => {
        // console.log(data);
        // ----------------------------------
        // POPULATE DROPDOWN MENU WITH county names 
        // ----------------------------------
        var metaData = data.metadata;
        // console.log(metaData);
        metaData.forEach(d =>{
            var option = idSelect.append("option");
            option.text(d.county_name);
            option.attr("class", "option-item");
            // console.log(d.county_name);
        });
        // get the first county names from the list for initial charts as a default
        var initCounty = idSelect.property("value")

        // plot charts with initial county names
        plotCharts(initCounty);

    })); // close .then()

} // close init() function

// create a function to reset divs to prepare for new data
function resetData() {

    // ----------------------------------
    // CLEAR THE DATA
    // ----------------------------------

    demographicsTable.html("");
    barChart.html("");
    bubbleChart.html("");
    gaugeChart.html("");

}; // close resetData()



function roundUp(num, precision) {
    precision = Math.pow(10, precision)
    return Math.ceil(num * precision) / precision
  }
// create a function to read JSON and plot charts
function plotCharts(initCounty) {

    // read in the JSON data
    d3.json("api/plotly_data").then((data => {

        // ----------------------------------
        // POPULATE DEMOGRAPHICS TABLE
        // ----------------------------------

        // filter the metadata for the ID chosen
        var individualMetadata = data.metadata.filter(d => d.county_name == initCounty)[0];

        // get the wash frequency for gauge chart later
        var median_hh_income = individualMetadata.median_hh_income;
        var decimal_format = d3.format(".2f");

        // Iterate through each key and value in the metadata
        Object.entries(individualMetadata).forEach(([key, value]) => {

            var newList = demographicsTable.append("ul");
            newList.attr("class", "list-group list-group-flush");

            // append a li item to the unordered list tag
            var listItem = newList.append("li");

            // change the class attributes of the list item for styling
            listItem.attr("class", "list-group-item p-1 bg-light");

            // add the key value pair from the metadata to the demographics list
            if (key == 'county_name'){
                listItem.text(`${key}:${value}`);
            } else if (key == 'effective_tax_rate'){
                listItem.text(`${key}: ${decimal_format(value)}%`);
            } else if (key == 'general_tax_rate'){
                listItem.text(`${key}: ${decimal_format(value)}%`);
            } else if (key == 'median_hh_income'){
                listItem.text(`${key}: $${decimal_format(value)}`);
            } else if (key == 'poverty_rate'){
                listItem.text(`${key}: ${decimal_format(value)}%`);
            } else {
                listItem.text(`${key}: ${roundUp(value,0)}`);
            }
            

        }); // close forEach

        // --------------------------------------------------
        // RETRIEVE DATA FOR PLOTTING CHARTS
        // --------------------------------------------------

        // filter the school data for the county names chosen
        var individualSchool = data.school.filter(d => d.county_name == initCounty);
        // console.log(individualSchool);
        // create empty arrays to store sample data
        var schIds = [];
        var schLabels = [];
        var schRatings = [];

        for (i=0; i< individualSchool.length; i++){
            schIds.push(individualSchool[i].rank)
            schLabels.push(individualSchool[i].school +', Grades: '+ individualSchool[i].grades +', School: '+ individualSchool[i].school_type)
            schRatings.push(individualSchool[i].score)
        };
        // console.log(schIds);
        // console.log(schRatings);
        // console.log(schLabels);
        // slice and reverse the arrays to get the top 10 summativescores, labels and IDs
        var topschIds = schIds.slice(0, 10).reverse();
        var topschRatings = schRatings.slice(0, 10).reverse();
        var topschLabels = schLabels.slice(0, 10).reverse();
        // console.log(topschIds);
        // console.log(topschRatings);
        // console.log(topschLabels);
        // use the map function to store the school IDs with "SCH_ID" for labelling y-axis
        var topschIdsFormatted = topschIds.map(d => "Rank:" + d);
        // ----------------------------------
        // PLOT BAR CHART
        // ----------------------------------

        // create a trace
        var traceBar = {
            x: topschRatings,
            y: topschIdsFormatted,
            text: topschLabels,
            type: 'bar',
            orientation: 'h',
            marker: {
                color: 'blue'
            }
        };

        // create the data array for plotting
        var dataBar = [traceBar];

        // define the plot layout
        var layoutBar = {
            height: 400,
            width: 550,
            font: {
                family: 'Quicksand'
            },
            hovermode: "closest",
            hoverlabel: {
                font: {
                    family: 'Quicksand'
                }
            },
            title: {
                text: `<b>Top schools for ${initCounty}</b>`,
                font: {
                    size: 18,
                    color: 'black'
                }
            },
            xaxis: {
                title: "<b>School Score <b>",
                color: 'black'
            },
            yaxis: {
                tickfont: { size: 14 }
            }
        }


        // plot the bar chart to the "bar" div
        Plotly.newPlot("bar", dataBar, layoutBar);

        // ----------------------------------
        // PLOT BUBBLE CHART
        // ----------------------------------
        // filter the school data for the county names chosen
        var individualCrime = data.crime.filter(d => d.county_name == initCounty);
        // console.log(individualCrime);
        // create arrays to store crime data
        var yBub = [ individualCrime[0].larceny, individualCrime[0].burglary, individualCrime[0].assault, individualCrime[0].auto_theft, 
                    individualCrime[0].murder, individualCrime[0].rape, individualCrime[0].robbery]
        var xBub = ['larceny', 'burglary', 'assault', 'auto_theft',  'murder', 'rape', 'robbery'];
        
        // create trace
        var yClr = ['blue', 'pink', 'red', 'purple', 'black', 'orange', 'violet'];
        var traceBub = {
            x: xBub,
            y: yBub,
            text: xBub,
            mode: 'markers',
            marker: {
                size: yBub,
                sizeref: 5,
                color: yClr
                // colorscale: 'Jet'
            }
        };

        // create the data array for the plot
        var dataBub = [traceBub];

        // define the plot layout
        var layoutBub = {
            title: `Crimes in ${initCounty}`,
            showlegend: true,
            height: 400,
            width: 1370,
            font: {
                family: 'Quicksand'
            },
            hoverlabel: {
                font: {
                    family: 'Quicksand'
                }
            },
            xaxis: {
                title: "<b>Crime type</b>",
                color: 'black'
            },
            yaxis: {
                title: "<b>Occurences</b>",
                color: 'black'
            },
            showlegend: false,
        };

        // plot the bubble chat to the appropriate div
        Plotly.newPlot('bubble', dataBub, layoutBub);

        // ----------------------------------
        // PLOT GAUGE CHART (BONUS)
        // ----------------------------------
        var income = [];
        data.metadata.forEach(d=> {
            d.median_hh_income = +d.median_hh_income;
            income.push(d.median_hh_income);
        });
        // console.log(income);
        var total = 0;
        for(var i = 0; i < income.length; i++) {
            total += income[i];
        }
        // console.log(total);
        // console.log(income.length);
        var avg = total / income.length;
        // console.log(avg);
        // if median_hh_income has a null value, make it zero for calculating pointer later
        if (median_hh_income == null) {
            median_hh_income = 0;
        }
        var data = [
            {
              domain: { x: [0, 1], y: [0, 1] },
              value: median_hh_income,
              title: { text: "Median household income" },
              type: "indicator",
              mode: "gauge+number+delta",
              delta: { reference: avg },
              gauge: {
                axis: { range: [null, 120000] },
                bar: { color: "blue" },
                steps: [
                  { range: [0, 40000], color: "orange" },
                  { range: [40000, 60000], color: "yellow" },
                  { range: [60000, 80000], color: "cyan" },
                  { range: [80000, 100000], color: "skyblue" },
                  { range: [100000, 120000], color: "royalblue" }
                ],
                threshold: {
                  line: { color: "red", width: 4 },
                  thickness: 0.75,
                  value: 36156
                }
              }
            }
          ];
          
          var layout = { width: 600, height: 400, margin: { t: 0, b: 0 } };
          Plotly.newPlot('gauge', data, layout);

    })); // close .then function

}; // close plotCharts() function
function optionChanged(county_name) {

    // reset the data
    resetData();

    // plot the charts for this id
    plotCharts(county_name);


} // close optionChanged function

// call the init() function for default data
init();


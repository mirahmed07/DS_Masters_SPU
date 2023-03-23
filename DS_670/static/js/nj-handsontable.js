var idSelect = d3.select("#selDataset");
var table = d3.select("#example");

function resetData() {

    // ----------------------------------
    // CLEAR THE DATA
    // ----------------------------------
    table.html("");
  
  }; // close resetData()



function init() {
// reset any previous table
    resetData();
    // get the first dataset name from the list
    var  firstData= idSelect.property("value")
    d3.select('#table-label')
    .text('Dataset: ' + firstData);
    var api = "api/data_pop_filter";
    // display filter-able table
    tableFilter(api);

}

function tableFilter(api){
    d3.csv(api).then(function(data, err) {
        if (err) throw err;

        var arr = [];
        for (i = 0 ; i < Object.values(data).length-1; i ++) {
            singleArr = Object.values(data[i]);
            arr.push(singleArr);
        }


        var container = document.getElementById('example');
        var hot =new Handsontable(container, {
        data: JSON.parse(JSON.stringify(arr)),
        // columns: Object.keys(data[0]),
        rowHeaders: true,
        colHeaders: true,
        // columns: ["county_name", "agency", "orinumber", "population"],
        filters: true,
        dropdownMenu: true,
        stretchH: 'all',
        autoWrapRow: true,
        height: 500,
        licenseKey: 'non-commercial-and-evaluation'
        }).updateSettings({
            colHeaders: Object.keys(data[0])
        });
    });
}
init();

// -------------------------------------------------
function optionChanged(data) {

    // reset the data
    resetData();
    d3.select('#table-label')
    .text('Dataset: ');
  
    // get the first dataset name from the list
    var firstData= data;
    
    d3.select('#table-label')
    .text('Dataset: ' + firstData);
  
    if (firstData === "NJ Rental Price (ZORI)"){
      var api = "api/data_rent_filter";
      tableFilter(api);
      
    } else if (firstData === "NJ Tax"){
      var api = "api/data_tax_filter";
      tableFilter(api);
    } else if (firstData === "NJ Poverty and Median Income"){
        var api = "api/data_poverty_history_filter";
        tableFilter(api);
    } else if (firstData === "NJ Crime Detail"){
        var api = "api/data_crime_det_filter";
        tableFilter(api);
    } else if (firstData === "NJ School"){
        var api = "api/data_school_filter";
        tableFilter(api);
    } else if (firstData === "NJ House Price (ZHVI)"){
        var api = "api/data_zillow_filter";
        tableFilter(api);
    } else if (firstData === "NJ APR History"){
        var api = "api/data_apr_filter";
        tableFilter(api);
    } else if (firstData === "NJ ADI"){
        var api = "api/data_adi_filter";
        tableFilter(api);
    } else if (firstData === "NJ Distance to Major Cities"){
        var api = "api/data_distance_filter";
        tableFilter(api);
    } else if (firstData === "NJ Food Desert"){
        var api = "api/data_food_filter";
        tableFilter(api);
    } 
    
    else {
        var api = "api/data_pop_filter";
        tableFilter(api);
    }
  
  }; // close optionChanged function
function countyDepth(tax_rate){
    return tax_rate * .25
  }
  // Creating map object
  var myMap = L.map("leaflet-map", {
    center: [40.0583, -74.4057],
    zoom: 8
  });

  // Adding tile layer
  L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
    tileSize: 512,
    maxZoom: 18,
    zoomOffset: -1,
    id: "mapbox/streets-v11",
    accessToken: API_KEY
  }).addTo(myMap)


  // Use this link to get the geojson data.
  var link = "api/leaflet_data";
  // Grabbing our GeoJSON data..
  d3.json(link, function(data) {
    // createFeatures(data.features);
    // Creating a GeoJSON layer with the retrieved data
    // console.log(data)
    geojson = L.geoJson(data, {
      style: function(features){
        return{
          color: getColor(features.properties.tax_rate),
          // fillColor: getColor(features.properties.tax_rate),
          fillColor: getCrimeColor(features.properties.crime_rate),
          // fillOpacity:countyDepth(features.properties.tax_rate)
          fillOpacity:.8
        }
    }, 
    onEachFeature: onEachFeature
    }).addTo(myMap);
  })


  function roundUp(num, precision) {
    precision = Math.pow(10, precision)
    return Math.ceil(num * precision) / precision
  }
    // Binding a pop-up to each layer
    function onEachFeature(feature, layer) {

    layer.bindPopup(`<h1>${feature.properties.COUNTY}</h1><br>
    <h5>Tax Rate:  ${roundUp(feature.properties.tax_rate,2)}</h5><br>
    <strong>Crime Rate per 100K: ${roundUp(feature.properties.crime_rate,2)}</strong><br>
    <strong>School Score: ${roundUp(feature.properties.school_score,2)}%</strong><br>
    <strong>Median household income: $${feature.properties.median_hh_income}</strong><br>
    <strong>Population: ${roundUp(feature.properties.population,0)}</strong><br>
    <strong>Poverty Rate: ${feature.properties.poverty_rate}%</strong>
    `).on('mouseover', function (e) {
        this.openPopup();
    }).on('mouseout', function (e) {
        this.closePopup();
    });
};

function getColor(d) {
    return d > 5 ? '#000000' :
            d > 4  ? '#000080' :
            d > 3.5  ? '#0000FF' :
            d > 3  ? '#1E90FF' :
            d > 2.5   ? '#00BFFF' :
            d > 2  ? '#87CEFA' :
            d > 1.5   ? '#ADD8E6' :
                        '#B0E0E6';
}

function getCrimeColor(d) {
  return d > 120000 ? '#800026' :
          d > 100000  ? '#BD0026' :
          d > 80000  ? '#E31A1C' :
          d > 40000  ? '#FC4E2A' :
          d > 20000   ? '#FD8D3C' :
          d > 10000 ? '#FEB24C' :
          d > 5000   ? '#FED976' :
                      '#FFEDA0';
}
    // Set up the legend
    var legend = L.control({ position: "bottomright" });
    legend.onAdd = function() {
        var div = L.DomUtil.create("div", "info legend");
        // var depth = [0, 1.25, 1.5, 1.75, 2, 2.5, 3 , 3.5];
        var crime = [0, 5000, 10000, 20000, 40000, 80000, 100000 , 120000];
        var labels = [];
        // var legendInfo = "<h4>Tax rate</h4>";
        var legendInfo = "<h4>Crime rate<br>(per 100K)</h4>";

        div.innerHTML = legendInfo;

        // go through each magnitude item to label and color the legend
        // push to labels array as list item
        // for (var i = 0; i < depth.length; i++) {
        //     labels.push('<li style="background-color:' + getColor(depth[i]+.2) + '"> <span>' + depth[i] + (depth[i + 1] ? '&ndash;' + depth[i + 1] + '' : '+') + '</span></li>');
        // }

        for (var i = 0; i < crime.length; i++) {
          labels.push('<li style="background-color:' + getCrimeColor(crime[i]+1) + '"> <span>' + crime[i] + (crime[i + 1] ? '&ndash;' + crime[i + 1] + '' : '+') + '</span></li>');
      }

        // add each label list item to the div under the <ul> tag
        div.innerHTML += "<ul>" + labels.join("") + "</ul>";

        return div;
    };

    // Adding legend to the map
    legend.addTo(myMap);


    var legend = L.control({ position: "bottomleft" });
    legend.onAdd = function() {
        var div = L.DomUtil.create("div", "info legend");
        var depth = [0, 1.5, 2, 2.5, 3 , 3.5, 4, 5];
        // var crime = [0, 5000, 10000, 20000, 40000, 80000, 100000 , 120000];
        var labels = [];
        var legendInfo = "<h4>Tax rate</h4>";
        // var legendInfo = "<h4>Crime rate<br>(per 100K)</h4>";

        div.innerHTML = legendInfo;

        // go through each magnitude item to label and color the legend
        // push to labels array as list item
        for (var i = 0; i < depth.length; i++) {
            labels.push('<li style="background-color:' + getColor(depth[i]+.2) + '"> <span>' + depth[i] + (depth[i + 1] ? '&ndash;' + depth[i + 1] + '' : '+') + '</span></li>');
        }
        // add each label list item to the div under the <ul> tag
        div.innerHTML += "<ul>" + labels.join("") + "</ul>";

        return div;
    };

    // Adding legend to the map
    legend.addTo(myMap);
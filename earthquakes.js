// Controller for Geonames data
var geoNamesController = (function() {
  const baseUrl = 'http://api.geonames.org/earthquakesJSON',
        username = 'adriancg';
  
  function buildUrl(bounds, maxRows) {
    
    var north = '?north=' + bounds.north,
        south = '&south=' + bounds.south,
        east = '&east=' + bounds.east,
        west = '&west=' + bounds.west,
        uname = '&username=' + username,
        maxRows = maxRows ? '&maxRows=' + maxRows : '',
        fullUrl = baseUrl + north + south + east + west + maxRows + uname;

    return fullUrl;
  }
  
  function queryEarthquakes(url) {
    
    return new Promise(function(resolve, reject){
      var xhttp = new XMLHttpRequest();
      xhttp.open('GET', url, true);
      xhttp.onload = function() {
        if(xhttp.status === 200){
          resolve(JSON.parse(xhttp.response));
        } else {
          reject(xhttp.statusText);
        }
      };
      
      xhttp.onerror = function() {
        reject('External service communication error.');
      };
            
      xhttp.send();
    });
    
  }
  
  return {
    getEarthquakes: function(bounds, maxRows) { 
      var url = buildUrl(bounds, maxRows);
      return queryEarthquakes(url);  
    }
  };
})();


// Controller for Map Object
var mapController = (function() {
  var map, autocomplete;
  var markers = [];
  var elems = {
    map: document.getElementById('map'),
    autocomplete: document.getElementById('pac-input')
  };
  
  // Only allow the public init function to set center and zoom.
  function strongParams(params) {
    var center = params.center || {lat: 25.6866, lng: -100.3161},
        zoom = params.zoom || 8;
    
    return {
      center: center,
      zoom: zoom
    };
  }
  
  function clearMarkers() {
    markers.forEach(function(marker){
      marker.setMap(null);
    });
    markers = [];
  }
  
  function addMarker(pos, label, timeout){
    window.setTimeout( function() {
      
      markers.push(new google.maps.Marker({
        position: {lat: pos.lat, lng: pos.lng},
        label: label,
        map: map,
        animation: google.maps.Animation.DROP
      }));
      
    } , timeout);
    
  }
  
  //Public Functions
  return {
    init: function(callback, params) {
      var safeParams = strongParams(params);
      
      if(!map){
        // Initialize map Object
        map = new google.maps.Map(elems.map, safeParams);

        // Initialize Autocomplete
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(elems.autocomplete);
        autocomplete = new google.maps.places.Autocomplete(elems.autocomplete);
        //autocomplete.bindTo('bounds', map);
        autocomplete.addListener('place_changed', callback);
      } else {
        window.alert("Map has already been initialized");
      }
    },
    
    getBounds: function() {
      var bounds, place;
      place = autocomplete.getPlace();
      
      if(place.geometry.viewport){
        bounds = place.geometry.viewport;
      } else {
        bounds = map.getBounds;
      }
      
      return {
        north: bounds.f.f,
        south: bounds.f.b,
        east: bounds.b.f,
        west: bounds.b.b
      }
      
    },
    
    changePlace: function() {
      
      var place = autocomplete.getPlace();
      
      if (!place.geometry) {
        // User entered the name of a Place that was not suggested and
        // pressed the Enter key, or the Place Details request failed.
        window.alert("Please select one of the suggested locations.");
        return -1;
      }

      // If the place has a geometry, then present it on a map.
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);  // Why 17? Because it looks good.
      }
            
      return 0;
    },
    
    plotMarkers: function(markers) {
      clearMarkers();
      markers.forEach(function(marker, i){
        
        if(marker.lat && marker.lng) {
          var position = {lat: marker.lat, lng: marker.lng};
          addMarker(position, (i + 1).toString(), i*200); // Array index is used for labeling and setting animation timeout.  
        }
      
      });
      
    },
    
    showAll: function() {
      map.setCenter({lat:0, lng:0});
      map.setZoom(2);
    }
  };
  
})();


// Application Controller
var appController = (function(geoNamesCtrl, mapCtrl) {
  
  var topTen;
  
  function clearRows(tbody) {
    
    while(tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
    }
    
  }
  
  function displayResults(results, tbody){
    
    clearRows(tbody);
    
    results.forEach(function(result, i){
      //Create DOM Elements
      var tr = document.createElement('tr'),
          tdNum = document.createElement('td'),
          tdDate = document.createElement('td'),
          tdMagnitude = document.createElement('td'),
          tdLat = document.createElement('td'),
          tdLng = document.createElement('td'),
          date = moment(result.datetime).format('LL');
      
      //Add content
      tdNum.textContent = i+1;
      tdDate.textContent = date;
      tdMagnitude.textContent = result.magnitude;
      tdLat.textContent = result.lat;
      tdLng.textContent = result.lng;
      
      //Append to table line
      tr.appendChild(tdNum);
      tr.appendChild(tdDate);
      tr.appendChild(tdMagnitude);
      tr.appendChild(tdLat);
      tr.appendChild(tdLng);
      
      // Append to table
      tbody.appendChild(tr);
    })
  }
  
  
  /* Process Earthquake data: This function will return a function
  that will be invoked by promise objects. The tbody_id paramenter is the id
  of the table where the results will be displayed */
  
  function processEarthquakes(earthquakeData) {
    
    var earthquakeArray = earthquakeData.earthquakes,
        tbody = document.getElementById('results');

    if(earthquakeArray.length > 0){
        mapCtrl.plotMarkers(earthquakeArray);
        displayResults(earthquakeArray, tbody);
    } else {
        window.alert('No earthquakes found.');
        clearRows(tbody);
    }
    
  }
  
  // Function that will run when a new location is entered
  function placeChanged() {
    
    var retCode = mapCtrl.changePlace();
    
    if( retCode !== -1) {
      // Make Webservice call and get Promise object
      var date = moment().format("YYYY-MM-DD");
      var earthquakes = geoNamesCtrl.getEarthquakes(mapCtrl.getBounds());
      
      earthquakes.then(processEarthquakes).catch(function(error){
        window.alert(error);
      });
    }
    
  }
  
  function getTopTen() {
    
    var todayStr = moment().format('YYYY-MM-DD');
    var topQuakes = geoNamesCtrl.getEarthquakes({ north: 90, 
                                               south: -90, 
                                               west: -180, 
                                               east: 180
                                             }, 500);
    
    topQuakes.then(processTopQuakes).catch(function(error){
      window.alert(error);
    });
    
  }
  
  function processTopQuakes(topQuakes) {
    var topQuakesArray = topQuakes.earthquakes;
    
    // Remove earthquakes older than 1 year.
    var filteredTopQuakes = topQuakesArray.filter(function(earthquake){
      var date = moment(earthquake.datetime).format('YYYYMMDD');
      return date >= moment().startOf('d').subtract(1, 'y').format('YYYYMMDD');
    });
    
    topTen = filteredTopQuakes.slice(0,10);
       
    //Sort by magnitude desc, date desc
    topTen.sort(function(a,b){
      if(a.magnitude > b.magnitude) return -1;
      if(a.magnitude < b.magnitude) return 1;
      if(a.datetime > b.datetime) return -1;
      if(a.datetime < b.datetime) return 1;
      return 0;      
    });
    
    displayResults(topTen, document.getElementById('top-ten'));
    document.getElementById('top-ten-btn').addEventListener('click', topTenPlot);
    
  }
  
  function topTenPlot () {
    mapCtrl.showAll();
    mapCtrl.plotMarkers(topTen);
  }
  
  //Public Functions
  return {
    init: function() {
      
      // Initialize map object
      mapCtrl.init(placeChanged, {
          center: {lat: 25.6866, lng: -100.3161},
          zoom: 8
      });
      
      getTopTen();
          
    }
  };
  
})(geoNamesController, mapController);


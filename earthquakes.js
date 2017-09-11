// Controller for Geonames data
var geoNamesController = (function() {
  const baseUrl = 'http://api.geonames.org/earthquakesJSON';
  const username = 'adriancg';
  
  function buildUrl(bounds) {
    var north = '?north=' + bounds.north;
    var south = '&south=' + bounds.south;
    var east = '&east=' + bounds.east;
    var west = '&west=' + bounds.west;
    var uname = '&username=' + username;
    var fullUrl = baseUrl + north + south + east + west + uname;
    
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
          reject(xttp.statusText);
        }
      };
      
      xhttp.onerror = function() {
        reject('External service communication error.');
      };
            
      xhttp.send();
    });
    
  }
  
  return {
    getEarthquakes: function(bounds) {
      var url = buildUrl(bounds);
      return queryEarthquakes(url);  
    }
  };
})();


// Controller for Map Object
var mapController = (function() {
  var map;
  var autocomplete;
  
  function getElements() {
    return {
      map: document.getElementById('map'),
      autocomplete: document.getElementById('pac-input')
    };
  }
  
  // Only allow the public init function to set center and zoom.
  function strongParams(params) {
    var center = params.center || {lat: -34.397, lng: 150.644};
    var zoom = params.zoom || 8;
    
    return {
      center: center,
      zoom: zoom
    };
  }
  
  //Public Functions
  return {
    init: function(callback, params) {
      var safeParams = strongParams(params);
      var elems = getElements();
      
      if(!map){
        // Initialize map Object
        map = new google.maps.Map(elems.map, safeParams);

        // Initialize Autocomplete
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(elems.autocomplete);
        autocomplete = new google.maps.places.Autocomplete(elems.autocomplete);
        autocomplete.bindTo('bounds', map);
        autocomplete.addListener('place_changed', callback);
      } else {
        window.alert("Map has already been initialized");
      }
    },
    
    getPlace: function() {
      return autocomplete.getPlace();
    },
    getBounds: function() {
      var bounds = map.getBounds();
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
        window.alert("No details available for input: '" + place.name + "'");
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
    }
  };
  
})();


// Application Controller
var appController = (function(geoNamesCtrl, mapCtrl) {
  
  // Function that will run when a new location is entered
  function placeChanged() {
    
    var retCode = mapCtrl.changePlace();
    
    if( retCode !== -1) {
      // Make Webservice call and get Promise object
      var earthquakes = geoNamesCtrl.getEarthquakes(mapCtrl.getBounds());
      
      earthquakes.then(processEarthquakes).catch(function(error){
        window.alert(error);
      });
    }
    
  }
  
  // Process Earthquake data once retrieved.
  function processEarthquakes(earthquakeData) {
    
    console.log(earthquakeData);
    var earthquakeArray = earthquakeData.earthquakes;
    if(earthquakeArray.length > 0){
      console.log("Plot earthquakes")
    } else {
      window.alert('No earthquakes found for the location.');
    }
    
  }
  
  //Public Functions
  return {
    init: function() {
      
      // Initialize map object
      mapCtrl.init (placeChanged, {
          center: {lat: -34.397, lng: 150.644},
          zoom: 8
      });   
      
    }
  };
  
})(geoNamesController, mapController);


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
    initMap: function(element, params) {
      var safeParams = strongParams(params);
      console.log(safeParams);
      map = new google.maps.Map(element, safeParams);
    },

    initAutocomplete: function(element, callback) {
      map.controls[google.maps.ControlPosition.TOP_LEFT].push(element);
      autocomplete = new google.maps.places.Autocomplete(element);
      autocomplete.bindTo('bounds', map);
      autocomplete.addListener('place_changed', callback);
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
    
    setView: function(place) {
      
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
  
  function placeChanged() {
    var place = mapCtrl.getPlace();
    var error = mapCtrl.setView(place);
    
    if( error !== -1) {
      // Code for getting earthquake data
      var earthquakes = geoNamesCtrl.getEarthquakes(mapCtrl.getBounds());
      earthquakes.then(processEarthquakes).catch(function(error){
        window.alert(error);
      });
    }
  };
  
  function processEarthquakes(earthquakeData) {
    console.log(earthquakeData);
    var earthquakeArray = earthquakeData.earthquakes;
    if(earthquakeArray.length > 0){
      console.log("Plot earthquakes")
    } else {
      window.alert('No earthquakes found for the location.');
    }
  };
  
  //Public Functions
  return {
    init: function() {
      
      // Initialize map object
      mapCtrl.initMap(document.getElementById('map'), {
          center: {lat: -34.397, lng: 150.644},
          zoom: 8
      });
      
      // Initialize autocomplete object
      mapCtrl.initAutocomplete(document.getElementById('pac-input'), placeChanged);      
      
    }
  };
  
})(geoNamesController, mapController);


// Controller for making Geonames data
var geoNamesController = (function() {
  
})();


// Controller for Map Object
var mapController = (function() {
  var map;
  var autocomplete;
  
  
  //Public Functions
  return {
    initMap: function(element, params) {
      map = new google.maps.Map(element, params);
    },

    initAutocomplete: function(element, callback) {
      autocomplete = new google.maps.places.Autocomplete(element);
      autocomplete.bindTo('bounds', map);
      autocomplete.addListener('place_changed', callback);
    },
    
    getPlace: function() {
      return autocomplete.getPlace();
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
  
  function place_changed() {
    var place = mapCtrl.getPlace();
    var error = mapCtrl.setView(place);
    
    if( error === 0) {
      // Code for getting earthquake data
      console.log("Get earthquake data");
    }
  }
  
  //Public Functions
  return {
    init: function() {
      
      // Initialize map object
      mapCtrl.initMap(document.getElementById('map'), {
          center: {lat: -34.397, lng: 150.644},
          zoom: 8
      });
      
      // Initialize autocomplete object
      mapCtrl.initAutocomplete(document.getElementById('pac-input'), place_changed);
      
      
    }
  };
  
})(geoNamesController, mapController);


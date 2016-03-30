// create our map
var map = new GMaps({
  zoom: 18,
  div: '#map',
  lat: 41.890551,
  lng: -87.626850
});


// grabs the user's location and sends the coordinates to the
// sendLocation function
$('#geolocate').click(function(){
  map.removeMarkers();
  GMaps.geolocate({
    success: function(position) {
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;

      map.setCenter(lat, lng);

      map.addMarker({
        lat: lat,
        lng: lng,
        label: 'You! (ish)',
        infoWindow: {
          content: '<h4>Your position!</h4>'
        }
      })
      sendLocation(lat,lng);
    },
    error: function(error) {
      console.log('Geolocation failed: '+error.message);
    },
    not_supported: function() {
      console.log("Your browser does not support geolocation");
    },
    always: function() {
      console.log("Done!");
    }
  });

})

// takes an address entered by the user and sends their coordinates to the
// sendLocation function
$('#address_search').click(function(e){
  map.removeMarkers();
  GMaps.geocode({
    address: $('#address').val().trim(),
    callback: function(results, status) {
      if (status == 'OK') {
        var lat = results[0].geometry.location.lat();
        var lng = results[0].geometry.location.lng();
        map.setCenter(lat, lng);
        map.addMarker({
          infoWindow: {
            content: '<h4>Your position!</h4>'
          },
          label: 'You! (ish)',
          lat: lat,
          lng: lng
        });
        sendLocation(lat, lng);
      } else {
        console.log(status);
      }
    }
  });
})


// sends the user's location to the server
// the server will send back a list of nearby locations
// this function then calls the functions to add these loctions to the map
// and to the list on the side of the page
function sendLocation(lat,lng){
  $.ajax({
    method: 'post',
    url: '/reviews',
    data: {
      "lat": lat,
      "lng": lng
    },
    success: function(data){
      $('#list-results').html('');
      var array_of_places = JSON.parse(data);
      array_of_places.forEach(function(place){
        // this.avgRating = 5;
        // this.numReviews = 10;
        // if (array_of_places.indexOf(place) < 5)
        addToList(place);
        placeMarker(place);
      })
    },
    failure: function(err){
      console.log(err);
    }
  });
}

// accepts a 'place' object and places a marker on the map
function placeMarker(place){
  var self = place;
  var content;
  // if there are no entries in the database for a location its avg_rating property will be -1
  if (self.avg_rating >= 0 && self.the_count > 0){
    content = '<h4>' + self.place_name + '</h4>' +
                  '<p>Average Rating: ' + self.avg_rating.toString() + '/5</p>' +
                  '<small>' + self.the_count + ' people reviewed this location</small>';
  }else {
    content = '<h4>' + self.place_name + '</h4>' +
              '<small>No reviews yet!</small>';
  }

  map.addMarker({
    place_id: self.place_id,
    lat: self.lat,
    lng: self.lng,
    title: self.place_name,
    infoWindow: {
      content: content
    }
  })
}

// adds a 'place' object to the list on the right side of the page.
function addToList(place){
  var displayRating;
  // if there are no entries in the database for a location its avg_rating property will be -1
  if (place.avg_rating >= 0 && place.the_count > 0){
    var displayRating = '<li>' + place.place_name + ' ' + place.avg_rating +'/5</li>' +
                        '<small>' + place.the_count + ' people reviewed this location</small>' +
                        '<li><small><a value="' + place.place_id + '" class="add-review" href="#">Write a review for this location</a></small></li>';
  } else {
    var displayRating = '<li>' + place.place_name + '</li>' +
                        '<li><small><a value="' + place.place_id + '" class="add-review" href="#">Be the first to review this location!</a></small></li>';
  }

  $('#list-results').append('<div class="results-item">' + displayRating + '</div>');
  // the 'add-review' class is added to all review links
  $('.add-review').click(function(e){
    // Grab the place id from the value of the link
    // The place id was stored in the value attribute of the link when the link was created
    var place_id = $(this).attr('value');
    e.preventDefault();
    // add the review form to the page with the correct place id
    $('#rate-location').html('<div class="review-wrapper">' +
                              '  <section id="write-review">' +
                              '    <h3>Rating from 1-5:</h3>' +
                              '    <form class="" action="/reviews/postreview" method="post">' +
                              '      <select name="stars" class="form-control">' +
                              '        <option>1</option>' +
                              '        <option>2</option>' +
                              '        <option>3</option>' +
                              '        <option>4</option>' +
                              '        <option>5</option>' +
                              '      </select>' +
                              '      <input type="hidden" name="place_id" value="' + place_id + '">' + //hidden field keeps track of place id
                              '      <button type="submit">GO!</button>' +
                              '    </form>' +
                              '  </section>' +
                              '</div>');
  });
}

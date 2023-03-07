mapboxgl.accessToken = 'pk.eyJ1IjoibnFhYmVuaGxlIiwiYSI6ImNsZXd6bjIwajBqdDUzb2tjY2lmamhqaWIifQ.3OexVyKsfjbGleSJhc3JxQ';

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#location-input').addEventListener('click', showMap);
  cropImage(3/2);
})

function showMap() {
  document.querySelector('#map').style.height = '300px';

  getLocation(function(position) {
    const lat = position ? position.coords.latitude : 0;
    const long = position ? position.coords.longitude : 0;

    var map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [long, lat],
      zoom: 7
    });

    var marker = new mapboxgl.Marker()
      .setLngLat([long, lat])
      .addTo(map);
      
    var locationInput = document.getElementById("location-input");

    locationInput.value = long + "," + lat;

    map.on('click', function(event) {
      marker.setLngLat(event.lngLat);
      locationInput.value = event.lngLat.lng + "," + event.lngLat.lat;
    }); 
  });
}

function getLocation(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      callback(position);
    }, function(error) {
      callback(null);
    });
  } else {
    callback(null);
  }
}
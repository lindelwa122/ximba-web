mapboxgl.accessToken = 'pk.eyJ1IjoibnFhYmVuaGxlIiwiYSI6ImNsZXd6bjIwajBqdDUzb2tjY2lmamhqaWIifQ.3OexVyKsfjbGleSJhc3JxQ';

document.addEventListener('DOMContentLoaded', () => {
  generateDescription();

  document.querySelector('#location-input').addEventListener('click', showMap);
  cropImage(3/2);

  const textCount = document.querySelector('.text-description-count');
  const description = document.querySelector('.description-input');
  description.addEventListener('input', () => {
    if (description.value.length < 100 || description.value.length > 500) {
      textCount.style.color = '#f00';
    } else {
      textCount.style.color = '#212529';
    }

    textCount.textContent = description.value.length;
  });

  const datetime = document.querySelector('.datetime');
  const now = new Date().toISOString().slice(0, 16);
  datetime.setAttribute('min', now);

  document.querySelector('.new-event-form').addEventListener('submit', (event) => {
    event.preventDefault();
    validateNewEventForm(event);
  });
})


const validateNewEventForm = (e) => {
  // At the start we assume the form is valid
  let isFormValid = true;

  // Clean up form
  document.querySelectorAll('.error-message').forEach((error) => {
    if (!error.classList.contains('d-none')) {
      error.classList.add('d-none');
    }
  });

  document.querySelectorAll('.input-frame').forEach((input) => {
    if (input.classList.contains('is-invalid')) {
      input.classList.remove('is-invalid');
    }
  })

  // Validate event title
  const eventTitle = document.querySelector('.title');
  if (eventTitle.value.length === 0) {
    eventTitle.classList.add('is-invalid');
    document.querySelector('.title-empty').classList.remove('d-none');
    isFormValid = false;
    window.scrollTo(0, 0);
  }
  
  // Validate event description
  const eventDescription = document.querySelector('.description-input');
  if (eventDescription.value.length < 100 || eventDescription.value.length > 500) {
    eventDescription.classList.add('is-invalid');
    document.querySelector('.description-empty').classList.remove('d-none');
    isFormValid = false;
    window.scrollTo(0, 0);
  }

  // Validate location input
  const locationInput = document.querySelector('#location-input');
  if (locationInput.value.length === 0) {
    locationInput.classList.add('is-invalid');
    document.querySelector('.location-empty').classList.remove('d-none');
    isFormValid = false;
  }

  // Validate datetime input
  const datetimeInput = document.querySelector('.datetime');
  if (datetimeInput.value.length === 0) {
    datetimeInput.classList.add('is-invalid');
    document.querySelector('.datetime-empty').classList.remove('d-none');
    isFormValid = false;
  }

  // Validate event type radio input
  let selectedEventTypeValue = null; 
  document.querySelectorAll('input[name="event-type"]').forEach((eventType) => {
    if (eventType.checked) {
      selectedEventTypeValue = eventType.value;
    }
  });

  if (!selectedEventTypeValue) {
    document.querySelector('.event-type-empty').classList.remove('d-none');
    isFormValid = false;
  }

  // Validate QR Code radio input
  let selectedEventQRCodeValue = null;
  document.querySelectorAll('input[name="access"]').forEach((access) => {
    if (access.checked) {
      selectedEventQRCodeValue = access.value;
    }
  });

  // if (!selectedEventQRCodeValue) {
  //   document.querySelector('.access-empty').classList.remove('d-none');
  //   isFormValid = false;
  // }

  // Ensure form is valid
  if (!isFormValid) {
    return false;
  }

  publishNewEvent(
    e,
    eventTitle.value,
    eventDescription.value,
    locationInput.value,
    datetimeInput.value,
    selectedEventTypeValue,
    selectedEventQRCodeValue
  );
}


const generateDescription = () => {
  // Replace YOUR_API_KEY with your actual API key
  const apiKey = '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';
  const apiUrl = 'https://api.openai.com/v1/engines/davinci-codex/completions';

  // Define your input prompt
  const prompt = 'Write a paragraph about the benefits of exercise';

  // Define your API request body
  const requestBody = {
    prompt: prompt,
    max_tokens: 100,
    n: 1,
    stop: '. ',
    temperature: 0.7
  };

  // Define your API request headers
  const requestHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  // Send the API request
  fetch(apiUrl, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(requestBody)
  })
  .then(response => response.json())
  .then(data => {
    // Process the API response
    const generatedParagraph = data.choices[0].text;
    document.querySelector('.open-ai').textContent = generatedParagraph;
  })
  .catch(error => {
    console.error(error);
  });
}

const publishNewEvent = (event, title, description, location, datetime, selectedType, selectedAccess) => {
  const form = new FormData();
  form.append('title', title);
  form.append('description', description);
  form.append('location', location);
  form.append('datetime', datetime);
  form.append('selectedType', selectedType);
  form.append('selectedAccess', selectedAccess);

  const csrfToken = document.querySelector(
    'input[name="csrfmiddlewaretoken"]'
  ).value;

  startBtnLoadingAnimation(event.submitter);
  
  fetch('/new-event/publish', {
    method: 'POST',
    body: form,
    headers: {
      'X-CSRFToken': csrfToken,
    },
  })
  .then((response) => {
      // Remove the loading animation
      stopBtnLoadingAnimation();

      if (response.status === 200) {
        alert('Your event has been published.')
        window.location.href = '/';
      }
      return response.json();
    })
    .then(({ error_type }) => {
      console.log(error_type);
      formErrorHandler(error_type);
    })
    .catch((error) => (console.error(error)))
    .finally(stopBtnLoadingAnimation);
}

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
mapboxgl.accessToken = 'pk.eyJ1IjoibnFhYmVuaGxlIiwiYSI6ImNsZXd6bjIwajBqdDUzb2tjY2lmamhqaWIifQ.3OexVyKsfjbGleSJhc3JxQ';

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#location-input').addEventListener('click', showMap);
  cropImage(3/2);

  const textCount = document.querySelector('.text-description-count');
  const description = document.querySelector('.description-input');
  const updateDescriptionValueLength = () => {
    if (description.value.length < 100 || description.value.length > 500) {
      textCount.style.color = '#f00';
    } else {
      textCount.style.color = '#212529';
    }

    textCount.textContent = description.value.length;
  }

  description.addEventListener('input', updateDescriptionValueLength);

  const title = document.querySelector('.title');

  title.addEventListener('input', () => {
    title.value = title.value.charAt(0).toUpperCase() + title.value.slice(1);
  });

  const ideaGeneratorLink = document.querySelector('.description-help-generator');
  description.addEventListener('focus', () => {
    if (title.value.length !== 0) {
      const descriptionHelp = ideaGeneratorLink;
      descriptionHelp.classList.remove('d-none');
      document.querySelector('.for-flex-structure').classList.add('d-none');
    }
  });

  ideaGeneratorLink.addEventListener('click', async () => {
    console.log('I am called');
    ideaGeneratorLink.textContent = 'Generating Idea...';
    ideaGeneratorLink.style.pointerEvents = 'none';
    const idea = await generateIdeas(title.value);
    // Remove newline characters
    const cleanIdea = idea.replace(/\n+/g, '\n');
    description.value = cleanIdea;
    ideaGeneratorLink.textContent = 'Need another idea?';
    ideaGeneratorLink.style.pointerEvents = 'auto';
    updateDescriptionValueLength();
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

  if (!selectedEventQRCodeValue) {
    document.querySelector('.access-empty').classList.remove('d-none');
    isFormValid = false;
  }

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

let titleIdea = '';
let ideas = [];
let ideaIndex = 0;
const generateIdeas = async (title) => {
  if (titleIdea === title) {
    ideaIndex = ideaIndex === 4 ? 0 : (ideaIndex+1);
    return ideas[ideaIndex]
  }

  ideas = await generateDescription(title);
  titleIdea = title;
  ideaIndex = 0;
  return ideas[ideaIndex];
}

const generateDescription = (title) => {
  // Replace YOUR_API_KEY with your actual API key
  const apiKey = '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';
  const apiUrl = 'https://api.openai.com/v1/engines/text-davinci-003/completions';

  // Define your input prompt
  const prompt = `Write a compelling paragraph that captures interest and encourages attendance to the event titled, ${title}. If title is not clear, just output 'Sorry, title is not clear. Ensure the title is in English and try again'`;

  // Define your API request body
  const requestBody = {
    prompt: prompt,
    max_tokens: 256,
    n: 5,
    temperature: 0.7
  };

  // Define your API request headers
  const requestHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  // Send the API request
  return new Promise((resolve, reject) => {
    fetch(apiUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody)
    })
    .then((response) => response.json())
    .then(({ choices }) => {
      // Process the API response
      const ideas = choices.map(choice => choice.text);
      resolve(ideas);
    })
    .catch(error => {
      console.error(error);
      reject(error);
    });
  });
}

const publishNewEvent = (event, title, description, location, datetime, selectedType, selectedAccess) => {
  const eventCover = document.querySelector('#file-input').files[0];
  const xAxis = document.querySelector('#x-axis').value;
  const yAxis = document.querySelector('#y-axis').value;
  const width = document.querySelector('#width').value;
  const height = document.querySelector('#height').value;
  const attendanceLimit = document.querySelector('.attendees-limit').value;

  const form = new FormData();
  form.append('title', title);
  form.append('description', description);
  form.append('image', eventCover);
  form.append('x', xAxis);
  form.append('y', yAxis);
  form.append('width', width);
  form.append('height', height);
  form.append('location', location);
  form.append('datetime', datetime);
  form.append('selectedType', selectedType);
  form.append('selectedAccess', selectedAccess);
  form.append('limit', attendanceLimit);

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

const showMap = () => {
  document.querySelector('#map').style.height = '300px';

  getLocation((position) => {
    const lat = position ? position.coords.latitude : 0;
    const long = position ? position.coords.longitude : 0;

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [long, lat],
      zoom: 7
    });

    const marker = new mapboxgl.Marker()
      .setLngLat([long, lat])
      .addTo(map);
      
    const locationInput = document.getElementById("location-input");

    locationInput.value = long + "," + lat;

    map.on('click', (event) => {
      marker.setLngLat(event.lngLat);
      locationInput.value = event.lngLat.lng + "," + event.lngLat.lat;
    }); 
  });
}

const getLocation = (callback) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      callback(position);
    }, (error) => {
      callback(null);
    });
  } else {
    callback(null);
  }
}
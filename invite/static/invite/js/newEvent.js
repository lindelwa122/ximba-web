mapboxgl.accessToken = 'pk.eyJ1IjoibnFhYmVuaGxlIiwiYSI6ImNsZXd6bjIwajBqdDUzb2tjY2lmamhqaWIifQ.3OexVyKsfjbGleSJhc3JxQ';

const retrieveEventLocation = () => {
  document.querySelector('#map').style.height = '300px';

  getUserLocation((position) => {
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

const getUserLocation = (callback) => {
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

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-icon-wrapper-lg').forEach((icon) => {
    icon.classList.remove('selected');
  });

  document.querySelector('.add-new-event').classList.add('selected');

  document.querySelector('#location-input').addEventListener('click', retrieveEventLocation);
  cropImage(3 / 2);

  const tagsArray = [];

  document.querySelector('.access-input').addEventListener('input', () => {
    const paidOptionsContainer = document.querySelector('.paid-options');
    paidOptionsContainer.style.height = paidOptionsContainer.scrollHeight + 'px';
  });

  document.querySelector('.tags-container').addEventListener('click', (event) => {
    if (event.target.classList.contains('bi-x')) {
      const parent = event.target.parentElement;
      const index = parent.dataset.index;
      tagsArray[parseInt(index)] = null;
      parent.remove();
    }
  });

  const tagsInput = document.querySelector('.tags');
  tagsInput.addEventListener('input', (event) => {
    const tagsContainer = document.querySelector('.tags-container');

    if (tagsInput.value === ' ') {
      tagsInput.value = '';
      return;
    }

    if (event.data === ' ' || event.data === ',') {

      const nullCount = tagsArray.filter((el) => el === null).length;
      const arrSize = tagsArray.length - nullCount;

      if (arrSize >= 5) {
        document.querySelector('.tags-invalid').classList.remove('d-none');
        tagsInput.value = '';
        return;
      }

      const keyword = tagsInput.value.trim().replace(',', '');

      if (!tagsArray.includes(keyword)) {
        const tag = document.createElement('div');
        tag.dataset.index = tagsArray.length;
        tagsArray.push(keyword);
        tag.innerHTML = keyword;
        const xIcon = document.createElement('i');
        tag.appendChild(xIcon);
        console.log(tagsArray);
        xIcon.classList = 'bi bi-x';
        tagsContainer.appendChild(tag);
      }

      tagsInput.value = '';
    }
  });

  document.querySelector('.no-access-input').addEventListener('input', () => {
    const paidOptionsContainer = document.querySelector('.paid-options');
    paidOptionsContainer.style.height = 0;

    const priceContainer = document.querySelector('.amount-container');
    priceContainer.style.height = 0;

    document.querySelector('.free-option').checked = true;
  });

  document.querySelector('.paid-option').addEventListener('input', () => {
    const priceContainer = document.querySelector('.amount-container');
    priceContainer.style.height = (priceContainer.scrollHeight + 35) + 'px';
  })

  document.querySelector('.free-option').addEventListener('input', () => {
    const priceContainer = document.querySelector('.amount-container');
    priceContainer.style.height = 0;
  })

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
    const button = event.submitter;
    if (button.tagName === 'INPUT') {
      validateNewEventForm(button, tagsArray, false, 'input');
    } else if (button.tagName === 'BUTTON') {
      validateNewEventForm(button, tagsArray, true, 'button');
    }
  });
});


const validateNewEventForm = (btn, tags, draft, btnType) => {
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

  let selectedPaidOptions = null;
  let amount = null;
  if (selectedEventQRCodeValue === 'with-access') {
    document.querySelectorAll('input[name="paid-options"]').forEach((input) => {
      if (input.checked) {
        selectedPaidOptions = input.value;
      }
    });

    if (!selectedPaidOptions) {
      document.querySelector('.paid-options-empty').classList.remove('d-none');
      isFormValid = false;
    }

    if (selectedPaidOptions === 'paid') {
      const price = document.querySelector('.amount');
      if (price.value.length === 0 || parseInt(price.value) <= 0) {
        document.querySelector('.amount-invalid').classList.remove('d-none');
        isFormValid = false;
      } else {
        amount = parseInt(price.value);
      }
    }
  }

  const keywords = tags.filter((el) => el !== null);
  if (keywords === 0 || keywords > 5) {
    document.querySelector('.tags-invalid').classList.remove('d-none');
    window.scrollTo(0, 0);
    isFormValid = false;
  }

  // Ensure form is valid
  if (!isFormValid) {
    return false;
  }

  publishNewEvent(btn, btnType, {
    title: eventTitle.value,
    description: eventDescription.value,
    location: locationInput.value,
    datetime: datetimeInput.value,
    selectedType: selectedEventTypeValue,
    selectedAccess: selectedEventQRCodeValue,
    selectedPaidOptions: selectedPaidOptions,
    amount: amount,
    keywords: keywords,
    draft: draft
  });
}

let titleIdea = '';
let ideas = [];
let ideaIndex = 0;
const generateIdeas = async (title) => {
  if (titleIdea === title) {
    ideaIndex = ideaIndex === 4 ? 0 : (ideaIndex + 1);
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

const publishNewEvent = (button, buttonType, eventData) => {
  const eventCover = document.querySelector('#file-input').files[0];
  const xAxis = document.querySelector('#x-axis').value;
  const yAxis = document.querySelector('#y-axis').value;
  const width = document.querySelector('#width').value;
  const height = document.querySelector('#height').value;
  const attendanceLimit = document.querySelector('.attendees-limit').value;

  const form = new FormData();
  form.append('title', eventData['title']);
  form.append('description', eventData['description']);
  form.append('image', eventCover);
  form.append('x', xAxis);
  form.append('y', yAxis);
  form.append('width', width);
  form.append('height', height);
  form.append('location', eventData['location']);
  form.append('datetime', eventData['datetime']);
  form.append('selectedType', eventData['selectedType']);
  form.append('selectedAccess', eventData['selectedAccess']);
  form.append('limit', attendanceLimit);
  form.append('selectedPaidOptions', eventData['selectedPaidOptions']);
  form.append('amount', eventData['amount']);
  form.append('keywords', eventData['keywords']);
  form.append('draft', eventData['draft']);

  const csrfToken = document.querySelector(
    'input[name="csrfmiddlewaretoken"]'
  ).value;

  button.disabled = true;
  let prev;
  if (buttonType === 'button') {
    prev = button.textContent;
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Saving...';
  } else {
    prev = button.value;
    prev.value = 'Publishing...';
  }

  fetch('/new-event/publish', {
    method: 'POST',
    body: form,
    headers: {
      'X-CSRFToken': csrfToken,
    },
  })
    .then((response) => {
      if (response.status === 200) {
        alert('Your event has been published.');
      }
      return response.json();
    })
    .then((data) => {
      if (data.next_route) {
        window.location.href = data.next_route;
        return;
      }

      formErrorHandler(data.error_type);
    })
    .catch((error) => (console.error(error)))
    .finally(() => {
      if (buttonType === 'button') {
        button.innerHTML = prev;
      } else {
        button.value = prev;
      }
      button.disabled = false;
    });
}
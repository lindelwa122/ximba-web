// This function retrieves the location of an event and displays a map using Mapbox.
const retrieveEventLocation = () => {
  // Set the height of the map container.
  document.querySelector('#map').style.height = '300px';
  
  try {
    // Try to get the user's location.
    getUserLocation(async (position) => {
    // Set the latitude and longitude values of the user's position.
    const lat = position ? position.coords.latitude : 0;
    const long = position ? position.coords.longitude : 0;
    
    // Fetch the Mapbox API key.
    const response = await fetch('/retrieve-api-key/mapbox');
    const { key } = await response.json();

    // Set the Mapbox access token using the API key.
    mapboxgl.accessToken = key;

    // Create a new map object.
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [long, lat],
      zoom: 7,
    });

    // Add a marker to the map at the user's position.
    const marker = new mapboxgl.Marker().setLngLat([long, lat]).addTo(map);

    // Set the value of the location input field to the user's position.
    const locationInput = document.getElementById('location-input');
    locationInput.value = long + ',' + lat;

    // When the user clicks on the map, update the marker position and the location input field.
    map.on('click', (event) => {
      marker.setLngLat(event.lngLat);
      locationInput.value = event.lngLat.lng + ',' + event.lngLat.lat;
    });
  });

} catch (error) {
  // Log any errors that occur.
  console.error(error);
  }
};
  
// This function gets the user's location using the browser's geolocation API.
const getUserLocation = (callback) => {
if (navigator.geolocation) {
navigator.geolocation.getCurrentPosition(
(position) => {
callback(position);
},
(error) => {
callback(null);
}
);
} else {
callback(null);
}
};  

// FORM VALIDATIONS

const validateStartAndEndDate = () => {
  const start = document.querySelector('.datetime');
  const end = document.querySelector('.datetime-ending');

  if (start.value > end.value) {
    alert('Start and end time of your event is invalid');
    return false;
  }

  return true;
}

const validateTicketPurchaseDeadline = () => {
  const ticketDeadline = document.querySelector('.ticket-deadline');
  const start = document.querySelector('.datetime');
  const end = document.querySelector('.datetime-ending');

  if (ticketDeadline.value > start.value && ticketDeadline.value < end.value) {
    return true;
  }

  if (!ticketDeadline.value) return true

  alert('Ticket deadline is invalid');
  return false;
}

const validateDateTimeInput = () => {
  // Validate datetime input
  const datetimeInput = document.querySelector('.datetime');
  if (datetimeInput.value.length === 0) {
    datetimeInput.classList.add('is-invalid');
    document.querySelector('.datetime-empty').classList.remove('d-none');
    return false;
  }

  return true;
}

const validateDateTimeEndInput = () => {
  const datetimeInput = document.querySelector('.datetime-ending');
  if (datetimeInput.value.length === 0) {
    datetimeInput.classList.add('is-invalid');
    document.querySelector('.datetime-ending-empty').classList.remove('d-none');
    return false;
  }

  return true;
}

const validateEventDescription = () => {
  // Validate event description
  const eventDescription = document.querySelector('.description-input');
  if (
    eventDescription.value.length < 100 ||
    eventDescription.value.length > 500
  ) {
    eventDescription.classList.add('is-invalid');
    document.querySelector('.description-empty').classList.remove('d-none');
    window.scrollTo(0, 0);
    return false;
  }

  return true;
}

const validatEventTitle = () => {
  const eventTitle = document.querySelector('.title');
  if (eventTitle.value.length === 0) {
    eventTitle.classList.add('is-invalid');
    document.querySelector('.title-empty').classList.remove('d-none');
    window.scrollTo(0, 0);
    return false;
  }

  return true;
}

const validateEventTypeRadioInput = () => {
  // Validate event type radio input
  let selectedEventTypeValue = null;
  document.querySelectorAll('input[name="event-type"]').forEach((eventType) => {
    if (eventType.checked) {
      selectedEventTypeValue = eventType.value;
    }
  });

  if (!selectedEventTypeValue) {
    document.querySelector('.event-type-empty').classList.remove('d-none');
    return false;
  }

  return true;
}

const validateKeywords = (tags) => {
  const keywords = tags.filter((el) => el !== null);
  if (keywords.length === 0 || keywords.length > 5) {
    document.querySelector('.tags-invalid').classList.remove('d-none');
    window.scrollTo(0, 0);
    return false;
  }

  return true;
}

const validateLocationInput = () => {
  // Validate location input
  const locationInput = document.querySelector('#location-input');
  if (locationInput.value.length === 0) {
    locationInput.classList.add('is-invalid');
    document.querySelector('.location-empty').classList.remove('d-none');
    return false;
  }

  return true;
}

const validateQRCodeRadioInput = () => {
  // Validate QR Code radio input
  let selectedEventQRCodeValue = null;

  // Iterate over all 'access' input elements and find the selected value
  document.querySelectorAll('input[name="access"]').forEach((access) => {
    if (access.checked) {
      selectedEventQRCodeValue = access.value;
    }
  });

  // If no 'access' value is selected, show an error message and return false
  if (!selectedEventQRCodeValue) {
    document.querySelector('.access-empty').classList.remove('d-none');
    return false;
  }

  let selectedPaidOptions = null;
  let amount = null;

  // If the 'with-access' option is selected, check for the selected paid option and amount
  if (selectedEventQRCodeValue === 'with-access') {
    // Iterate over all 'paid-options' input elements and find the selected value
    document.querySelectorAll('input[name="paid-options"]').forEach((input) => {
      if (input.checked) {
        selectedPaidOptions = input.value;
      }
    });

    // If no 'paid-options' value is selected, show an error message and return false
    if (!selectedPaidOptions) {
      document.querySelector('.paid-options-empty').classList.remove('d-none');
      return false;
    }

    // If 'paid' option is selected, validate the amount
    if (selectedPaidOptions === 'paid') {
      const price = document.querySelector('.amount');
      // If the price is not entered or is invalid, show an error message and return false
      if (price.value.length === 0 || parseInt(price.value) <= 0) {
        document.querySelector('.amount-invalid').classList.remove('d-none');
        return false;
      } else {
        amount = parseInt(price.value);
      }

      let selectedPaymentOptionValue = null;
      document.querySelectorAll('input[name="payment-options"]').forEach((option) => {
        if (option.checked) {
          selectedPaymentOptionValue = option.value;
        }
      });

      if (!selectedPaymentOptionValue) {
        document.querySelector('.payment-options-empty').classList.remove('d-none');
        return false;
      }

      return true;
    }
  }

  // If all validations pass, return true
  return true;
}

// FORM UTILS
const cleanForm = () => {
  document.querySelectorAll('.error-message').forEach((error) => {
    if (!error.classList.contains('d-none')) {
      error.classList.add('d-none');
    }
  });

  document.querySelectorAll('.input-frame').forEach((input) => {
    if (input.classList.contains('is-invalid')) {
      input.classList.remove('is-invalid');
    }
  });
}

const getFormData = (draft, tags) => {
  const datetime = document.querySelector('.datetime').value;
  const endingDatetime = document.querySelector('.datetime-ending').value;
  const ticketDeadline = document.querySelector('.ticket-deadline').value;
  const description = document.querySelector('.description-input').value;
  const title = document.querySelector('.title').value;
  const keywords = tags.filter((el) => el !== null);
  const location = document.querySelector('#location-input').value;
  const price = document.querySelector('.amount');
  const amount = parseInt(price.value);

  let selectedEventTypeValue = null;
  document.querySelectorAll('input[name="event-type"]').forEach((eventType) => {
    if (eventType.checked) {
      selectedEventTypeValue = eventType.value;
    }
  });

  let selectedEventQRCodeValue = null;
  document.querySelectorAll('input[name="access"]').forEach((access) => {
    if (access.checked) {
      selectedEventQRCodeValue = access.value;
    }
  });

  let selectedPaidOptions = null;
  document.querySelectorAll('input[name="paid-options"]').forEach((input) => {
    if (input.checked) {
      selectedPaidOptions = input.value;
    }
  });

  let selectedPaymentOptions = null;
  document.querySelectorAll('input[name="payment-options"]').forEach((input) => {
    if (input.checked) {
      selectedPaymentOptions = input.value;
    }
  });



  return {
    title: title,
    description: description,
    location: location,
    datetime: datetime,
    endingDatetime: endingDatetime,
    selectedType: selectedEventTypeValue,
    selectedAccess: selectedEventQRCodeValue,
    selectedPaidOptions: selectedPaidOptions,
    selectedPaymentOptions: selectedPaymentOptions,
    ticketDeadline: ticketDeadline,
    amount: amount,
    keywords: keywords,
    draft: draft,
  }
}

const startEventPublishButtonLoading = (button, buttonType) => {
  button.disabled = true;
  let prev;
  if (buttonType === 'button') {
    prev = button.textContent;
    button.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Saving...';
  } else {
    prev = button.value;
    button.value = 'Publishing...';
  }

  return prev;
};

const stopEventPublishButtonLoading = (prev, button, buttonType) => {
  if (buttonType === 'button') {
    button.innerHTML = prev;
  } else {
    button.value = prev;
  }
  button.disabled = false;
};

const validateNewEventForm = (btn, tags, draft, btnType) => {
  // Clean up form
  cleanForm();

  // Validate form
  const isFormValid = 
    validatEventTitle() &&
    validateEventDescription() &&
    validateLocationInput() &&
    validateDateTimeInput() &&
    validateDateTimeEndInput() &&
    validateTicketPurchaseDeadline() &&
    validateStartAndEndDate() &&
    validateEventTypeRadioInput() &&
    validateQRCodeRadioInput() &&
    validateKeywords(tags);

  if (!isFormValid) {
    return;
  }

  publishNewEvent(btn, btnType, getFormData(draft, tags));
};

const publishNewEvent = async (button, buttonType, eventData) => {
  // Start the loading animation on the publish button and save its previous text content
  const previousButtonTextContent = startEventPublishButtonLoading(button, buttonType);

  // Get the event cover, x-axis, y-axis, width, height, and attendance limit from the page
  const eventCover = document.querySelector('#file-input').files[0];
  const xAxis = document.querySelector('#x-axis').value;
  const yAxis = document.querySelector('#y-axis').value;
  const width = document.querySelector('#width').value;
  const height = document.querySelector('#height').value;
  const attendanceLimit = document.querySelector('.attendees-limit').value;

  // Get the event data from the eventData object
  const { 
    title, 
    description, 
    location, 
    datetime,
    endingDatetime,
    selectedType, 
    selectedAccess, 
    selectedPaidOptions, 
    selectedPaymentOptions,
    amount, 
    keywords, 
    draft,
    ticketDeadline
  } = eventData;

  const category = await categorizeEvent(title, description, keywords);

  const categoryAsStr = category.toString().toLowerCase().trim().replace(' ', '_');

  // Create a new FormData object and append all the event data to it
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
  form.append('endingDatetime', endingDatetime);
  form.append('selectedType', selectedType);
  form.append('selectedAccess', selectedAccess);
  form.append('limit', attendanceLimit);
  form.append('selectedPaidOptions', selectedPaidOptions);
  form.append('selectedPaymentOptions', selectedPaymentOptions);
  form.append('ticketDeadline', ticketDeadline);
  form.append('amount', amount);
  form.append('keywords', keywords);
  form.append('draft', draft);
  form.append('category', categoryAsStr);

  // Get the CSRF token from the page
  const csrfToken = document.querySelector(
    'input[name="csrfmiddlewaretoken"]'
  ).value;

  try {
    const response = await fetch('/new-event/publish', {
      method: 'POST',
      body: form,
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });

    // If the response status is 200 (OK), show an alert to the user
    if (response.status === 200) {
      alert('Your event has been published.');
    }

    // Parse the JSON response and check if there is a "next_route" property
    const { next_route, error_type } = await response.json();

    if (next_route) {
      // Redirect the user to the specified URL
      window.location.href = next_route;
      return;
    }

    // Handle the error with the formErrorHandler function
    formErrorHandler(error_type);

  } catch (error) {
    alert('An error occurred while saving your event. Please check your internet connection and try again later.');
    console.error(error);

  } finally {
    stopEventPublishButtonLoading(previousButtonTextContent, button, buttonType);
  }
};

// CATEGORIZE EVENT
const categorizeEvent = async (title, description, tags) => {
  // Retrieve an API key for the OpenAI API
  const response = await fetch('/retrieve-api-key/openai');
  const { key } = await response.json();

  // Set the API endpoint and request parameters
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const prompt = `Using the title, description and tags associated with an event, generate a category that best describes the event. Only return a one word answer. If the text is in another language translate it and try your best get the closest category that may describe that event.

    Title: ${title}
    
    Description: ${description}
    
    Tags: ${tags}
  `;

  const requestBody = {
    model: "gpt-5 nano",
    messages: [
      {
        role: "developer",
        content: prompt
      }
    ]
  };

  // Set the API request headers with the API key
  const requestHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  };

  // Send the API request and parse the response into an array of ideas
  return new Promise((resolve, reject) => {
    fetch(apiUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    })
      .then((response) => response.json())
      .then(({ choices }) => {
        if (!choices) {
          resolve("micro")
        }

        const category = choices.map((choice) => choice.content);
        resolve(category[0]);
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
};

// IDEA GENERATION

// Initialize variables
let titleIdea = '';
let ideas = [];
let ideaIndex = 0;

// A function that generates ideas for an event title
const generateIdeas = async (title) => {
  // If the function is called with the same title as the previous call, 
  // return the next idea from the previous ideas array
  if (titleIdea === title) {
    ideaIndex = ideaIndex === 4 ? 0 : ideaIndex + 1;
    return ideas[ideaIndex];
  }

  // Otherwise, generate new ideas using the OpenAI text-davinci-003 engine
  ideas = await generateDescription(title);
  titleIdea = title;
  ideaIndex = 0;
  return ideas[ideaIndex];
};

// A function that generates descriptions for an event title using the OpenAI API
const generateDescription = async (title) => {
  // Retrieve an API key for the OpenAI API
  const response = await fetch('/retrieve-api-key/openai');
  const { key } = await response.json();

  // Set the API endpoint and request parameters
  const apiUrl = 'https://api.openai.com/v1/engines/text-davinci-003/completions';
  const prompt = `Write a compelling paragraph that captures interest and encourages attendance to the event titled, ${title}. If title is not clear, just output 'Sorry, title is not clear. Ensure the title is in English and try again'`;
  const requestBody = {
    prompt: prompt,
    max_tokens: 256,
    n: 5,
    temperature: 0.7,
  };

  // Set the API request headers with the API key
  const requestHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  };

  // Send the API request and parse the response into an array of ideas
  return new Promise((resolve, reject) => {
    fetch(apiUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    })
      .then((response) => response.json())
      .then(({ choices }) => {
        const ideas = choices.map((choice) => choice.text);
        resolve(ideas);
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
};

// UTILS

const appendTicketSale = (priceClassName, serviceFeePercentage) => {
  const ticketPrice = document.querySelector('.amount').value;
  if (ticketPrice) {
    const priceContainer = document.querySelector(`.${priceClassName}`);
    priceContainer.innerHTML = `R${calcTicketSaleProfit(ticketPrice, serviceFeePercentage)}`;
  }
}

const calcTicketSaleProfit = (ticketPrice, serviceFeePercentage) => {
  const serviceFee = ticketPrice * (serviceFeePercentage/100);
  const bankCharges = ticketPrice * (2/100);
  const sale = ticketPrice - serviceFee - bankCharges;
  return sale.toFixed(2);
}

const clickEventHandler = () => {
  document
    .querySelector('#location-input')
    .addEventListener('click', retrieveEventLocation);
  cropImage(3 / 2);

  document
  .querySelector('.tags-container')
  .addEventListener('click', (event) => {
    if (event.target.classList.contains('bi-x')) {
      const parent = event.target.parentElement;
      const index = parent.dataset.index;
      tagsArray[parseInt(index)] = null;
      parent.remove();
    }
  });
}

const tagsArray = [];
const formatTags = () => {
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
        xIcon.classList = 'bi bi-x';
        tagsContainer.appendChild(tag);
      }

      tagsInput.value = '';
    }
  });
}

const getDescriptionIdeas = () => {
  const description = document.querySelector('.description-input');
  const ideaGeneratorLink = document.querySelector(
    '.description-help-generator'
  );

  const title = document.querySelector('.title');
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
}

const inputEventHandler = () => {
  document.querySelector('.no-access-input').addEventListener('input', () => {
    const paidOptionsContainer = document.querySelector('.paid-options');
    paidOptionsContainer.style.height = 0;

    const paymentContainer = document.querySelector('.paid-access-view');
    paymentContainer.style.height = 0;

    document.querySelector('.free-option').checked = true;
  });

  document.querySelector('.paid-option').addEventListener('input', () => {
    const paymentContainer = document.querySelector('.paid-access-view');
    paymentContainer.style.height = paymentContainer.scrollHeight + 'px';
  });

  document.querySelector('.free-option').addEventListener('input', () => {
    const priceContainer = document.querySelector('.paid-access-view');
    priceContainer.style.height = 0;
  });

  document.querySelector('.paid-immediate').addEventListener('input', () => {
    const immediate = document.querySelector('.immediate-option-selected');
    immediate.style.height = immediate.scrollHeight + 'px';

    const later = document.querySelector('.later-option-selected');
    later.style.height = 0;

    appendTicketSale('immediate-sale-value', 4);
  });
  
  document.querySelector('.paid-later').addEventListener('input', () => {
    const immediate = document.querySelector('.immediate-option-selected');
    immediate.style.height = 0;

    const later = document.querySelector('.later-option-selected');
    later.style.height = immediate.scrollHeight + 'px';

    appendTicketSale('later-sale-value', 2.9);
  });

  const title = document.querySelector('.title');
  title.addEventListener('input', () => {
    title.value = title.value.charAt(0).toUpperCase() + title.value.slice(1);
  });

  document.querySelector('.access-input').addEventListener('input', () => {
    const paidOptionsContainer = document.querySelector('.paid-options');
    paidOptionsContainer.style.height =
      paidOptionsContainer.scrollHeight + 'px';
  });
}

const setEventDateContraints = () => {
  const datetime = document.querySelector('.datetime');
  const now = new Date().toISOString().slice(0, 16);
  datetime.setAttribute('min', now);

  const datetimeEnding = document.querySelector('.datetime-ending');
  datetimeEnding.setAttribute('min', now);

  const ticketDeadline = document.querySelector('.ticket-deadline');
  ticketDeadline.setAttribute('min', now);
}

const submitEventHandler = () => {
  document
    .querySelector('.new-event-form')
    .addEventListener('submit', (event) => {
      event.preventDefault();
      const button = event.submitter;
      if (button.tagName === 'INPUT') {
        validateNewEventForm(button, tagsArray, false, 'input');
      } else if (button.tagName === 'BUTTON') {
        validateNewEventForm(button, tagsArray, true, 'button');
      }
    });
}

const updateDescriptionValueLength = () => {
  const textCount = document.querySelector('.text-description-count');
  const description = document.querySelector('.description-input');
  if (description.value.length < 100 || description.value.length > 500) {
    textCount.style.color = '#f00';
  } else {
    textCount.style.color = '#212529';
  }

  textCount.textContent = description.value.length;
  description.addEventListener('input', updateDescriptionValueLength);
};

const updateSelectedIconElement = () => {
  document.querySelectorAll('.nav-icon-wrapper-lg').forEach((icon) => {
    icon.classList.remove('selected');
  });

  document.querySelector('.add-new-event').classList.add('selected');
};

document.addEventListener('DOMContentLoaded', () => {
  updateSelectedIconElement();
  clickEventHandler();
  formatTags();
  inputEventHandler();
  updateDescriptionValueLength();
  getDescriptionIdeas();
  setEventDateContraints();
  submitEventHandler();
});

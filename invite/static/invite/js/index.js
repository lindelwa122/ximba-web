document.addEventListener('DOMContentLoaded', () => {
  eventsContainerLoadHandler();
  eventsContainerClickHandler('index-events-container');
  startPagination();
  getEvents();

  // EVENTS FILTER

  document
    .querySelector('.filter-by-following')
    .addEventListener('click', () => {
      resetPagination();
      filterEvents('following');
    });

  document.querySelector('.filter-by-friends').addEventListener('click', () => {
    resetPagination();
    filterEvents('friends');
  });

  document.querySelector('.filter-by-nearby').addEventListener('click', () => {
    resetPagination();
    filterByNearBy();
  });

  document
    .querySelector('.filter-by-upcoming')
    .addEventListener('click', () => {
      resetPagination();
      filterEvents('upcoming');
    });

  document.querySelector('.all-index').addEventListener('click', () => {
    // Remove the selected from the current selected
    document.querySelectorAll('.index-filter').forEach((el) => {
      el.classList.remove('selected');
    });

    // Set all-index to selected
    document.querySelector('.all-index').classList.add('selected');

    // Render event skeletons
    eventsSkeleton();

    // Retrieve events
    startPagination();
    getEvents();
  });
});

// EVENTS FUNCTIONALITY

const addAttendee = async (
  eventId,
  attendeesIconElement,
  attendeesCountElement,
  savedIconElement,
  savedCountElement,
  ticketButtonElement,
  shouldUpdateSavedCount = false
) => {
  // Function to update the attendee count and icon
  const updateAttendeesCount = () => {
    attendeesIconElement.classList.replace('bi-person', 'bi-person-fill');
    attendeesCountElement.textContent =
      parseInt(attendeesCountElement.textContent) + 1;
  };

  // Function to update the saved count and icon
  const updateSavedCount = () => {
    savedIconElement.classList.replace('bi-bookmark', 'bi-bookmark-fill');
    savedCountElement.textContent = parseInt(savedCountElement.textContent) + 1;
  };

  try {
    // Send a POST request to the server to add the attendee
    const response = await fetch('/event/add/attendee', {
      method: 'POST',
      body: JSON.stringify({ eventId: eventId }),
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
      },
    });

    // Handle the response based on the status code
    switch (response.status) {
      // If the attendee was successfully added
      case 200:
        updateAttendeesCount();

        if (shouldUpdateSavedCount) {
          updateSavedCount();
        }

        // Update recommendation scores
        updateScore('attend_free_event', 'event', eventId);

        break;

      // If the user is required to pay for the ticket, redirect to the page to get a ticket
      case 400:
        getTicket(eventId);
        break;

      // If the event has reached the maximum number of attendees
      case 401:
        alert('Sorry, this event has reached the maximum number of attendees.');
        break;
    }
  } catch (error) {
    // Handle errors that occur during the request
    alert(
      "Sorry an error occurred and we couldn't add you as an attendee. Please save this event and try again later"
    );
    console.error(error);
  }
};

// Display events placeholder
const eventsSkeleton = (append = false) => {
  const skeleton = `
    <div class='post events-loading-container'>
      <div class='user-info d-flex justify-content-between align-items-center'>
        <div class='d-flex'>
          <div class='skeleton profile-img'></div>
          <div class='skeleton name ms-2'></div>
        </div>
        <div>
          <div class='skeleton button'></div>
        </div>
      </div>

      <div class='skeleton buttons mt-3'></div>
      <div class='skeleton text-line mt-3'></div>
      <div class='skeleton text-line mt-2'></div>
      <div class='skeleton text-line mt-2 shorter'></div>

      <div class='d-flex justify-content-between mt-3'>
        <div class='skeleton item'></div>
        <div class='skeleton item'></div>
        <div class='skeleton item'></div>
      </div>
    </div>
  `;

  if (append) {
    document.querySelector('.index-events-container').innerHTML += skeleton;
  } else {
    document.querySelector('.index-events-container').innerHTML = skeleton;
  }
};

const filterByNearBy = () => {
  // Display events placeholder
  eventsSkeleton();

  // Remove 'selected' class from other filters
  document.querySelectorAll('.index-filter').forEach((el) => {
    el.classList.remove('selected');
  });

  // Add 'selected to the 'Nearby' filter
  document.querySelector('.filter-by-nearby').classList.add('selected');

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      try {
        const response = await fetch(
          `/events/get/filter/nearby?location=${longitude},${latitude}`
        );
        const { events } = await response.json();

        if (events.length === 0) {
          // Display 'no events' message
          document.querySelector('.index-events-container').innerHTML =
            'Currently, there are no events nearby :(';
        } else {
          // Render events
          renderEvents(events, 'index-events-container');
        }
      } catch (error) {
        // Display error message
        document.querySelector('.index-events-container').innerHTML =
          "Sorry, we couldn't fetch nearby events. Please try again later.";
        console.error(error);
      }
    });
  } else {
    alert(
      "To find nearby events, we need your permission to access your location. Please enable location services for this website. Without your permission, we won't be able to show you events near you."
    );
  }
};

const filterEvents = async (filterMethod) => {
  // Remove the 'selected' class from all filter buttons
  document.querySelectorAll('.index-filter').forEach((el) => {
    el.classList.remove('selected');
  });

  // Add the 'selected' class to the current filter button
  document
    .querySelector(`.filter-by-${filterMethod}`)
    .classList.add('selected');

  // Display events placeholder
  eventsSkeleton();

  let longitude = 0.0;
  let latitude = 0.0;
  try {
    if (navigator.geolocation) {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      longitude = position.coords.longitude;
      latitude = position.coords.latitude;
    } else {
      // Handle error if geolocation is not supported
      console.error('Geolocation is not supported');
    }
  } catch (error) {
    console.error(error);
  } finally {
    try {
      // Fetch events based on the given filter method
      const url = `/events/get/filter/${filterMethod}?longitude=${longitude}&latitude=${latitude}`;
      const response = await fetch(url);
      const { events } = await response.json();

      // Render the filtered events on the page
      renderEvents(events, 'index-events-container');
    } catch (error) {
      // Display error message if events could not be fetched
      document.querySelector('.index-events-container').innerHTML =
        "Sorry, we couldn't fetch events. Please try again later.";
      console.error(error);
    }
  }
};

let requestInProgress = false;
const getEventsPaginationHandler = () => {
  if (
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight
  ) {
    if (!requestInProgress && start < totalEvents) {
      requestInProgress = true;

      getEvents()
        .then(() => (requestInProgress = false))
        .catch((error) => {
          requestInProgress = false;
          console.error(error);
        });
    }
  }
};

const resetPagination = () => {
  window.removeEventListener('scroll', getEventsPaginationHandler);
  start = 0;
};

const startPagination = () => {
  window.addEventListener('scroll', getEventsPaginationHandler);
};

let start = 0;
let totalEvents;

const getEvents = async () => {
  if (start > 0) {
    eventsSkeleton(true);
  }

  let longitude = 0.0;
  let latitude = 0.0;
  try {
    if (navigator.geolocation) {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      longitude = position.coords.longitude;
      latitude = position.coords.latitude;
    } else {
      // Handle error if geolocation is not supported
      console.error('Geolocation is not supported');
    }
  } catch (error) {
    console.error(error);
  } finally {
    // If start is bigger or equal to totalEvents remove scroll event listener
    if (start + 5 >= totalEvents) {
      window.removeEventListener('scroll', getEventsPaginationHandler);
    }

    const url = `/events/get?longitude=${longitude}&latitude=${latitude}&start=${start}&end=${
      start + 5
    }`;

    try {
      const response = await fetch(url);
      const { events, end, total_events } = await response.json();
      start = end;
      totalEvents = total_events;

      renderEvents(events, 'index-events-container');
    } catch (error) {
      document.querySelector('.index-events-container').innerHTML =
        "Sorry, we couldn't fetch nearby events. Please try again later.";
      console.error(error);
    }
  }
};

// This function removes an attendee from an event
const removeAttendee = async (
  eventId,
  iconElement,
  count,
  ticket,
  ticketType = 'normal'
) => {
  // This function updates the attendee count and icon
  const updateAttendeesCount = () => {
    iconElement.classList.replace('bi-person-fill', 'bi-person');
    count.textContent = parseInt(count.textContent) - 1;
  };

  // This function updates the ticket button to represent a free ticket
  const updateTicketButton = () => {
    ticket.classList.replace('btn-primary', 'btn-secondary');
    ticket.classList.replace('view-ticket', 'get-ticket');
    ticket.textContent = 'Get Ticket (Free)';
  };

  try {
    // Send a DELETE request to remove the attendee from the event
    const response = await fetch('/event/remove/attendee', {
      method: 'DELETE',
      body: JSON.stringify({ eventId: eventId, method: ticketType }),
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
      },
    });

    // Handle the response based on the HTTP status code
    switch (response.status) {
      case 200:
        // If successful, update the attendee count and the ticket button (if applicable)
        updateAttendeesCount();

        if (ticket) {
          updateTicketButton();
        }
        break;

      case 400:
        // If there is an error, prompt the user to confirm removing their ticket and retry with the 'free' ticket type
        const removeTicket = confirm(
          'Are you sure you want to remove your ticket? This action cannot be undone?'
        );
        if (removeTicket) {
          removeAttendee(eventId, iconElement, count, ticket, 'free');
        }
        break;

      case 401:
        getRefund(eventId);
        break;

      default:
        // If there is an unexpected error, display an error message
        alert("Sorry, couldn't remove your ticket. Please try again later.");
        break;
    }
  } catch (error) {
    // If there is a network or server error, display an error message and log the error to the console
    alert(error);
    console.error(error);
  }
};

const saveEvent = async (id, btn, count) => {
  try {
    const response = await fetch('/event/save', {
      method: 'POST',
      body: JSON.stringify({ eventId: id }),
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
      },
    });

    switch (response.status) {
      case 200:
        btn.classList.replace('bi-bookmark', 'bi-bookmark-fill');
        count.textContent = parseInt(count.textContent) + 1;

        // Update recommendation scores
        updateScore('save_event', 'event', id);

        break;

      case 409:
        alert('This event is already added to your saved list.');
        break;

      default:
        alert(
          "We couldn't add this event to your saved list. Please reload, search for the event and try again!"
        );
        break;
    }
  } catch (error) {
    alert(
      "We couldn't add this event to your saved list. Please reload, search for the event and try again!"
    );
    console.error(error);
  }
};

const shareEventModal = (eventId) => {
  addToMainModalHistory('Share Event', () => {
    const container = document.createElement('div');

    container.innerHTML = `
      <div class='mb-2'>Share this event with all of your friends</div>
      <textarea class='form-control input-frame note mb-3' placeholder='Share this event with a note (Optional)'></textarea>
      <button class='share-event-btn btn btn-primary w-100'>Share Event</button>
    `; 

    return container;
  }, [{ func: (eventId) => {
    document.querySelector('.share-event-btn').addEventListener('click', () => {
      shareEvent(eventId);
    })
  }, values: [eventId] }])
}

const shareEvent = async (eventId) => {
  const submitButton = document.querySelector('.share-event-btn');
  submitButton.disabled = true;
  submitButton.innerHTML = 'Sharing Event...';

  const updateSharesCount = () => {
    const post = document.querySelector(`#event-${eventId}`);
    const sharesCount = post.querySelector('.shares-count');
    sharesCount.textContent = parseInt(sharesCount.textContent) + 1;
  }

  try {
    const response = await fetch(`/event/share/${eventId}`);

    switch (response.status) {
      case 200:
        alert('The event has been successfully shared with all of your friends');
        updateSharesCount();
        updateScore('share_event', 'event', eventId);
        break;

      case 409:
        alert('You have already shared this event with all of your friends.');
        break;

      default:
        throw new Error('An error occurred, check your internet connection and try again later.');
    }

  } catch (error) {
    alert(error);
    console.error(error);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Share Event';
  }
}

const showHideEventInfoToggle = (post) => {
  const moreInfo = post.querySelector('.event-more-info');
  const showMoreInfoAction = post.querySelector('.see-more');

  if (showMoreInfoAction.classList.contains('show')) {
    moreInfo.style.height = moreInfo.scrollHeight + 'px';

    const setHeightToAuto = () => {
      moreInfo.height = 'auto';
      moreInfo.removeEventListener('transitionend', setHeightToAuto);
    };

    moreInfo.addEventListener('transitionend', setHeightToAuto);
    showMoreInfoAction.classList.replace('show', 'hide');
    showMoreInfoAction.textContent = 'Hide info';
  } else {
    moreInfo.style.height = moreInfo.scrollHeight + 'px';
    moreInfo.style.height = 0;
    showMoreInfoAction.classList.replace('hide', 'show');
    showMoreInfoAction.textContent = 'See more';
  }
};

const unsavedEvent = async (eventId, savedIconElement, savedCountElement) => {
  const updateSavedCount = () => {
    savedIconElement.classList.replace('bi-bookmark-fill', 'bi-bookmark');
    savedCountElement.textContent = parseInt(savedCountElement.textContent) - 1;
  };

  try {
    const response = await fetch('/saved-event/delete', {
      method: 'DELETE',
      body: JSON.stringify({ eventId: eventId }),
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
      },
    });

    switch (response.status) {
      case 200:
        updateSavedCount();
        break;

      case 400:
        alert(
          "You can't remove this event because you already own the ticket. Try removing the ticket by pressing the attendees icon (person icon)."
        );
        break;

      default:
        throw new Error('An error occurred, try removing this event later.');
    }
  } catch (error) {
    alert(error);
    console.error(error);
  }
};

// HANDLERS

const eventsContainerLoadHandler = () => {
  document.querySelector('.index-events-container').addEventListener(
    'load',
    (event) => {
      if (event.target.tagName === 'IMG') {
        event.target.classList.remove('skeleton');
      }
    },
    true
  );
};

// MAP/LOCATION FUNCTIONALITIES

fetch('/retrieve-api-key/mapbox')
  .then((response) => response.json())
  .then(({ key }) => {
    mapboxgl.accessToken = key;
  });

const getDirections = (destination, directionsType) => {
  // Toggle between instructions and directions
  const getIntructionsOrDirectionsButton = document.querySelector(
    '.instructions-directions'
  );
  getIntructionsOrDirectionsButton.addEventListener('click', () => {
    document.querySelector('.directions-wrapper').classList.toggle('d-none');
    document.querySelector('.instructions-wrapper').classList.toggle('d-none');

    if (
      getIntructionsOrDirectionsButton.classList.contains('instructions-view')
    ) {
      getIntructionsOrDirectionsButton.classList.replace(
        'instructions-view',
        'directions-view'
      );
      getIntructionsOrDirectionsButton.innerHTML = 'See directions';
    } else {
      getIntructionsOrDirectionsButton.classList.replace(
        'directions-view',
        'instructions-view'
      );
      getIntructionsOrDirectionsButton.innerHTML = 'See instructions';
    }
  });

  // Empty map
  document.querySelector('#map').innerHTML = '';

  // Use geolocation API to get user's current location
  navigator.geolocation.getCurrentPosition((position) => {
    const origin = [position.coords.longitude, position.coords.latitude];

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: origin, // starting position
      zoom: 12,
    });

    // an arbitrary start will always be the same
    // only the end or destination will change
    // this is where the code for the next step will go
    // create a function to make a directions request
    const getRoute = async (destination) => {
      // make a directions request
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/${directionsType}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
        { method: 'GET' }
      );
      const json = await query.json();
      const data = json.routes[0];
      const route = data.geometry.coordinates;
      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route,
        },
      };
      // if the route already exists on the map, we'll reset it using setData
      if (map.getSource('route')) {
        map.getSource('route').setData(geojson);
      }
      // otherwise, we'll make a new request
      else {
        map.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: geojson,
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3887be',
            'line-width': 5,
            'line-opacity': 0.75,
          },
        });
      }
      // add turn instructions here at the end
      // get the sidebar and add the instructions

      let directionEmoji;
      switch (directionsType) {
        case 'cycling':
          directionEmoji = '🚴';
          break;

        case 'driving':
          directionEmoji = '🚗';
          break;

        case 'walking':
          directionEmoji = '🚶';
      }

      const instructions = document.querySelector('#instructions');
      const steps = data.legs[0].steps;

      let tripInstructions = '';
      for (const step of steps) {
        tripInstructions += `<li>${step.maneuver.instruction}</li>`;
      }
      instructions.innerHTML = `<p><strong>Trip duration: ${Math.floor(
        data.duration / 60
      )} min ${directionEmoji} </strong></p><ol>${tripInstructions}</ol>`;
    };

    map.on('load', () => {
      // make an initial directions request that
      // starts and ends at the same location
      getRoute(destination);

      // Add starting point to the map
      map.addLayer({
        id: 'point',
        type: 'circle',
        source: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: origin,
                },
              },
            ],
          },
        },
        paint: {
          'circle-radius': 10,
          'circle-color': '#3887be',
        },
      });
    });
  });
};

const getLocation = async (eventId, longitude, latitude) => {
  // Convert eventId (number) to a string
  const eventIdAsString = `${eventId}`;
  const location = localStorage.getItem(eventIdAsString);

  if (location) {
    const address = location.split(',');
    const suburb = address[0];
    const city = address[1];
    return { suburb, city };
  } else {
    const { suburb, city } = await reverseGeocode(longitude, latitude);
    if (city !== null) {
      const locationString = `${suburb},${city}`;
      localStorage.setItem(eventId, locationString);
    }
    return { suburb, city };
  }
};

const getMapCoordinates = (locationString) => {
  const coordinates = locationString.split(',');
  const longitude = parseFloat(coordinates[0]);
  const latitude = parseFloat(coordinates[1]);
  return { longitude, latitude };
};

const reverseGeocode = async (longitude, latitude) => {
  try {
    const response1 = await fetch('/retrieve-api-key/mapbox');
    const { key } = await response1.json();

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${key}`;
    const response2 = await fetch(url);
    const data = await response2.json();

    // extract the suburb and city from the geocoding results
    const suburb = data.features[0].text;
    const city = data.features[1].text;

    return { suburb, city };
  } catch (error) {
    console.error(error);
    console.error("Could't convert coordinates to an actual address");
    const suburb = 'Unknown';
    const city = null;
    return { suburb, city };
  }
};

const showExactLocation = (post) => {
  const locationDiv = post.querySelector('.exact-location');
  const location = locationDiv.dataset.location;
  const { longitude, latitude } = getMapCoordinates(location);

  // Update recommendation scores
  const eventId = post.dataset.eventid;
  updateScore('see_exact_location', 'event', eventId);

  addToMainModalHistory(
    'See exact location',
    () => {
      const container = document.createElement('div');
      container.className = 'location-actions-container';
      container.innerHTML = `
      <div class='location directions-wrapper'>
        <div id='map'></div>
        <div class='route-profile mt-3'>
          <div>Please select direction type:</div>
          <select class='form-control input-frame direction-type'>
            <option value='walking' selected>Walking</option>
            <option value='driving'>Driving</option>
            <option value='cycling'>Cycling</option>
          </select>
        </div>
      </div>
        
      <div class='instructions-wrapper d-none'>
        <div id='instructions'></div>
      </div>

      <button class='btn btn-primary w-100 mt-3 need-directions instructions-directions'>Need Directions?</button>
    `;

      return container;
    },
    [{ func: showMap, values: [longitude, latitude] }]
  );

  const getDirectionTypeButton = document.querySelector('.need-directions');
  const directionsOptions = () => {
    const routeProfile = document.querySelector('.route-profile');
    routeProfile.style.height = routeProfile.scrollHeight + 'px';
    getDirectionTypeButton.classList.replace('need-directions', 'directions');
    getDirectionTypeButton.innerHTML = 'Get Directions';
    getDirectionTypeButton.removeEventListener('click', directionsOptions);

    const getDirectionsButton = document.querySelector('.directions');
    const viewDirections = () => {
      document.querySelector('.route-profile').style.height = 0;
      getDirectionsButton.innerHTML = 'See instructions';
      getDirectionsButton.classList.replace('directions', 'instructions-view');

      const selectedDirectionType =
        document.querySelector('.direction-type').value;
      const destinationLocation = [longitude, latitude];

      getDirectionsButton.removeEventListener('click', viewDirections);

      getDirections(destinationLocation, selectedDirectionType);
    };

    getDirectionsButton.addEventListener('click', viewDirections);
  };

  getDirectionTypeButton.addEventListener('click', directionsOptions);
};

const showMap = (long, lat) => {
  document.querySelector('#map').style.height = '300px';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [long, lat],
    zoom: 7,
  });

  const marker = new mapboxgl.Marker().setLngLat([long, lat]).addTo(map);

  map.on('click', (event) => {
    marker.setLngLat(event.lngLat);
  });
};

// RENDER DATA

const keywordsDisplay = (keywords) => {
  const keywordsArr = keywords.split(',');

  const htmlStrings = keywordsArr.map((keyword) => {
    return `
      <div>${keyword}</div>
    `;
  });

  return htmlStrings.join('');
};

const renderButtons = (
  attendanceLimit,
  attendeesCount,
  isTicketRequired,
  isTicketSecured,
  price,
  ticketDeadline
) => {
  let ticketButton;
  let limit = parseInt(attendanceLimit);
  const attendees = parseInt(attendeesCount);

  // If ticket is not required
  if (!isTicketRequired) {
    ticketButton = '';
  }

  // If the deadline date has already past or
  // If the event has reached the maximum number of attendees and limit is not zero
  // If the limit is zero it indicates that there's not limit
  else if (ticketDeadline === 'past' || (attendees >= limit && limit !== 0)) {
    ticketButton =
      "<button class='btn btn-primary btn-small'>Tickets No Longer Available</button>";
  }

  // Check if ticket is already secured and give the user an option to view it
  // otherwise show the ticket price and give the user an option to get it
  else {
    ticketButton = isTicketSecured
      ? `<button class='btn btn-primary btn-small view-ticket'>View Ticket</button>`
      : `<button class='btn btn-secondary btn-small get-ticket'>Get Ticket (${
          price === 0 ? 'Free' : `R${price}`
        })</button>`;
  }

  const limitButton =
    limit > 0
      ? `<button class='btn btn-primary btn-small'>Limit: ${attendanceLimit}</button>`
      : '';

  return { ticketButton, limitButton };
};

const renderEvents = (posts, containerClassName) => {
  Promise.all(
    posts.map(async (event) => {
      const userInfo = await renderUserInfo(event.publisher[0]);
      const { longitude, latitude } = getMapCoordinates(event.location);
      const { suburb, city } = await getLocation(event.id, longitude, latitude);
      const datetime = formattedDateTime(event.timestamp);
      const duration = eventDuration(event.timestamp, event.end_timestamp);
      const ticketDeadline = ticketDeadlineHandler(event.ticket_deadline);
      const { ticketButton, limitButton } = renderButtons(
        event.attendance_limit,
        event.attendees,
        event.with_ticket,
        event.ticket_secured,
        event.ticket_price,
        ticketDeadline
      );

      return `
        <div class='post post-wp border-bottom border-dark' id='event-${
          event.id
        }' data-time-spent='0' data-eventid=${event.id}>
          <div class='post-intro'>
            ${userInfo}
            <div class='post-head'>
              <div class='font-title'>${event.title}</div>
              <div>
                <i class='bi bi-geo-alt'></i>
                <span class='ms-1' title='${
                  !city
                    ? 'The location of this event is unknown or unavailable at the moment'
                    : ''
                }'>${suburb}, ${city}</span>
              </div>
            </div>
            ${
              ticketDeadline && ticketDeadline !== 'past'
                ? `<div class='error-message mt-2'>${ticketDeadline}</div>`
                : ''
            }
          </div>

          ${
            event.cover
              ? renderImage(event.cover, limitButton, ticketButton)
              : renderPostActions(limitButton, ticketButton)
          }

          <div class='post-caption'>
            <div class='short-description'>${
              event.description
            } <span class='see-more show link font-body-tiny'>See more</span></div>

            <div class='post-interactions d-flex align-items-center justify-content-between'>
              <div class='d-flex align-items-center'>
                <i class='bi ${
                  event.attending ? 'bi-person-fill' : 'bi-person'
                }'></i>
                <span class='ms-1 attendees-count'>${event.attendees}</span>
              </div>
              <div class='d-flex align-items-center'>
                <i class='bi bi-repeat share-event'></i>
                <span class='ms-1 shares-count'>${event.shares}</span>
              </div>
              <div class='d-flex align-items-center'>
                <i class='bi ${
                  event.user_saved_event ? 'bi-bookmark-fill' : 'bi-bookmark'
                } save-event'></i>
                <span class='ms-1 saves-count'>${event.saves}</span>
              </div>
            </div>

            <div class='event-more-info'>
              <div>
                <i class='bi bi-geo-alt'></i>
                <span class='ms-2 exact-location link' data-location='${
                  event.location
                }'>See exact location</span>
              </div>
              <div>
                <i class='bi bi-clock'></i>
                <span class='ms-2 datetime'>${datetime} (${duration})</span>
              </div>
              ${
                event.more_info
                  ? `
                <div>
                  <i class='bi bi-info-circle'></i>
                  <span class='ms-2 link more-info' data-id='${event.id}'>More info</a></span>
                </div>
              `
                  : ''
              }
              <div class='tags-container'>${keywordsDisplay(
                event.keywords
              )}</div>
            </div>
          </div>
        </div>
      `;
    })
  ).then((htmlStrings) => {
    const loadingSkeleton = document.querySelector('.events-loading-container');
    if (loadingSkeleton) {
      loadingSkeleton.remove();
    }

    document.querySelector(`.${containerClassName}`).innerHTML +=
      htmlStrings.join('');
  });
};

const renderImage = (image, attendanceLimitButton, ticketButton) => {
  return `
      <div class='img-cover'>
        <img src='${image}' class='skeleton' alt='Event Cover'>
        <div class='buttons-container'>
          <div>
            ${attendanceLimitButton}
          </div>
          <div class='d-flex justify-content-end'>
            ${ticketButton}
          </div>
        </div>
      </div>
    `;
};

const renderPostActions = (attendanceLimitButton, ticketButton) => {
  return `
    <div class='post-action'>
      ${attendanceLimitButton}
      ${ticketButton}
    </div>
  `;
};

const renderUserInfo = async (user) => {
  const isUserLoggedIn = await userLogStatus();
  const isUserFollowingOrganiser = await isUserFollowingPublisher(
    user.username
  );
  let button;

  if (isUserLoggedIn === 'YES') {
    if (isUserFollowingOrganiser === 'YES') {
      button = `<button class='btn btn-secondary-outline btn-small'>Following</button>`;
    } else {
      button = `<button class='btn btn-primary btn-small follow-btn ${user.username}-follow'>Follow</button>`;
    }
  } else {
    button = `<button class='btn btn-primary btn-small'>Follow</button>`;
  }

  const htmlString = `
    <div class='user-info d-flex justify-content-between align-items-center' data-username='${user.username}'>
      <div class='d-flex'>
        <img src='${user.image}' class='skeleton' alt='${user.username} profile image'>
        <div class='ms-1'>
          <div class='font-body-tiny'><a href='/${user.username}'>@${user.username}</a></div>
          <div>${user.fullName}</div>
        </div>
      </div>
      <div>
        ${button}
      </div>
    </div>
  `;

  return htmlString;
};

// TICKET FUNCTIONALITIES

const afterRefundIsProcessed = (eventId) => {
  const post = document.querySelector(`#event-${eventId}`);

  const attendeesIcon = post.querySelector('.bi-person-fill');
  if (attendeesIcon) {
    attendeesIcon.classList.replace('bi-person-fill', 'bi-person');
  }

  const attendeesCount = post.querySelector('.attendees-count');
  attendeesCount.textContent = parseInt(attendeesCount.textContent) - 1;

  const savedIcon = post.querySelector('.bi-bookmark-fill');
  const savedCount = post.querySelector('.saves-count');
  if (savedIcon) {
    savedIcon.classList.replace('bi-bookmark-fill', 'bi-bookmark');
    savedCount.textContent = parseInt(savedCount.textContent) - 1;
  }

  const button = post.querySelector('.view-ticket');
  button.classList.replace('btn-primary', 'btn-secondary');
  button.classList.replace('view-ticket', 'get-ticket');
  button.innerHTML = 'Get Ticket';

  closeMainModal();
};

const afterTicketIsBought = (eventId) => {
  // Update recommendation scores
  updateScore('buy_ticket', 'event', eventId);

  const post = document.querySelector(`#event-${eventId}`);
  const attendeesIcon = post.querySelector('.bi-person');
  if (attendeesIcon) {
    attendeesIcon.classList.replace('bi-person', 'bi-person-fill');
  }

  const attendeesCount = post.querySelector('.attendees-count');
  attendeesCount.textContent = parseInt(attendeesCount.textContent) + 1;

  const savedIcon = post.querySelector('.bi-bookmark');
  const savedCount = post.querySelector('.saves-count');
  if (savedIcon) {
    savedIcon.classList.replace('bi-bookmark', 'bi-bookmark-fill');
    savedCount.textContent = parseInt(savedCount.textContent) + 1;
  }

  const button = post.querySelector('.get-ticket');
  button.classList.replace('btn-secondary', 'btn-primary');
  button.classList.replace('get-ticket', 'view-ticket');
  button.innerHTML = 'View Ticket';

  closeMainModal();
};

const displayQRCode = (eventId, ticketIdentifier) => {
  const qrcode = document.querySelector('.qrcode');
  qrcode.contents = `/ticket/${eventId}/${ticketIdentifier}`;
  qrcode.moduleColor = '#3b44f6';
  qrcode.positionCenterColor = '#3b44f6';
  qrcode.positionRingColor = '#3ec70b';

  qrcode.addEventListener('codeRendered', () => {
    qrcode.animateQRCode('MaterializeIn');
  });
};

const fetchTicketData = async (ticketId) => {
  try {
    const response = await fetch(`/ticket/${ticketId}`);
    const { ticket_info } = await response.json();
    ticketPageHTML(ticket_info);
  } catch (error) {
    ticketPageHTML('', true);
    console.error(error);
  }
};

const getRefund = async (eventId) => {
  try {
    const response = await fetch(`/is-event-refundable/${eventId}`);
    const { answer } = await response.json();

    if (answer === 'YES') {
      refundAllowed(eventId);
    } else {
      refundNotAllowed();
    }
  } catch (error) {
    console.error(error);
  }
};

const getTicket = (eventId) => {
  addToMainModalHistory(
    'Get Ticket',
    () => {
      const container = document.createElement('div');
      container.className = 'get-ticket';

      container.innerHTML = `
      <div class='mb-1'>Your Balance: R<span class='balance'>--.--</span></div>
      <div class='mb-1'>Ticket Price: R<span class='price'>--.--</span></div>
      <div class='mb-1'>Number of People: <span class='people'>1</span></div>
      <div class='mb-1'>Service Fee: 3%</div>
      <div class='mb-1'>Total: R<span class='total'>--.--</span></div>

      <div class='mt-1 mb-2 error-message non-refundable d-none'>NON-REFUNDABLE</div>

      <form class='get-ticket-form'>
        <div class='form-floating mb-3'>
          <input type='number' class='people-count form-control input-frame' placeholder='Number of People'>
          <label for='people' class='floating-input-placeholder'>Number of People</label>
        </div>

        <div class='form-floating mb-3'>
          <input type='password' class='password form-control input-frame' placeholder='Type in your password'>
          <label for='password' class='floating-input-placeholder'>Type in your password</label>
        </div>

        <div class='error-message get-ticket-error mb-3'></div>      

        <input type='submit' class='btn btn-primary w-100 submit-get-ticket-form' value='Get Ticket'/>
      </form>
    `;

      return container;
    },
    [
      { func: getWalletBalance, values: [] },
      { func: getTicketPrice, values: [eventId] },
      { func: getTicketInputHandler, values: [] },
      { func: isEventRefundable, values: [eventId] },
      { func: getTicketSubmitHandler, values: [eventId] },
    ]
  );
};

const getTicketInputHandler = () => {
  const peopleCount = document.querySelector('.people-count');
  let count;
  peopleCount.addEventListener('input', () => {
    if (!(peopleCount.value > 1)) {
      count = 1;
    } else {
      count = parseInt(peopleCount.value);
    }

    document.querySelector('.people').innerHTML = count;
    const price = document.querySelector('.price').innerHTML;
    const total = document.querySelector('.total');
    const totalCost = parseFloat(price) * parseInt(count);
    const charges = totalCost * (3 / 100);

    total.innerHTML = (totalCost + charges).toFixed(2);
  });
};

const getTicketPrice = async (eventId) => {
  try {
    const response = await fetch(`/event/stats/${eventId}`);
    const { price } = await response.json();
    const ticketPrice = parseFloat(price);
    const charges = ticketPrice * (3 / 100);
    document.querySelector('.price').innerHTML = ticketPrice.toFixed(2);
    document.querySelector('.total').innerHTML = (
      ticketPrice + charges
    ).toFixed(2);
  } catch (error) {
    alert(
      'There was an error retrieving the ticket price. Check your internet connection and try again later.'
    );
    console.error(error);
  }
};

const getTicketSubmitHandler = (eventId) => {
  document
    .querySelector('.get-ticket-form')
    .addEventListener('submit', async (event) => {
      event.preventDefault();

      const errorContainer = document.querySelector('.get-ticket-error');
      const submitButton = document.querySelector('.submit-get-ticket-form');
      submitButton.value = 'Getting Ticket...';
      submitButton.disabled = true;

      // Clean up error container
      errorContainer.innerHTML = '';

      const attendeesCount = document.querySelector('.people-count').value;
      const password = document.querySelector('.password').value;
      try {
        const response = await fetch('/ticket/new/add', {
          method: 'POST',
          body: JSON.stringify({
            eventId: eventId,
            attendees: attendeesCount,
            password: password,
          }),
          headers: {
            'X-CSRFToken': getCookie('csrftoken'),
          },
        });

        switch (response.status) {
          case 200:
            alert('Your ticket purchase was successful');
            afterTicketIsBought(eventId);
            break;

          case 401:
            errorContainer.innerHTML =
              "Your password is incorrect. Press <a href='/reset_password'>here</a> to reset your password";
            break;

          case 400:
            errorContainer.innerHTML =
              "You don't afford the ticket. Press <a class='link' href='/wallet'>here</a> to deposit funds to your wallet.";
            break;

          default:
            throw new Error();
        }
      } catch (error) {
        alert(
          "Sorry, we could't save your ticket. Check your internet connection and try again later."
        );
        console.error(error);
      } finally {
        submitButton.value = 'Get Ticket';
        submitButton.disabled = false;
      }
    });
};

const getWalletBalance = async () => {
  try {
    const response = await fetch('/wallet/balance');
    const { balance } = await response.json();

    document.querySelector('.balance').innerHTML =
      parseFloat(balance).toFixed(2);
  } catch (error) {
    alert(
      'There was an error retrieving you balance. Check your internet connection and try again later.'
    );
    console.error(error);
  }
};

const isEventRefundable = async (eventId) => {
  try {
    const response = await fetch(`/is-event-refundable/${eventId}`);
    const { answer } = await response.json();

    if (answer === 'NO') {
      document.querySelector('.non-refundable').classList.remove('d-none');
    }
  } catch (error) {
    console.error(error);
  }
};

const refundAllowed = async (eventId) => {
  const response = await fetch(`/ticket/${eventId}`);
  const { ticket_info } = await response.json();

  const refundablePrice =
    parseFloat(ticket_info.price) * parseInt(ticket_info.people);

  addToMainModalHistory(
    'Refund',
    () => {
      const container = document.createElement('div');

      container.innerHTML = `
      <form class='refund-form'>
        <div class='mb-3'>R<span class='price'>${refundablePrice.toFixed(
          2
        )}</span> will be refunded to your wallet</div>
        <div class='error-message mb-3'>Please be aware that invalidating your ticket is a permanent action and cannot be undone.</div>
        <div class='error-message error-refund'></div>
        <input type='submit' class='btn btn-primary w-100 refund-submit-btn' value='Get Refund'>
      </form>
    `;

      return container;
    },
    [{ func: refundSubmitHandler, values: [eventId] }]
  );
};

const refundNotAllowed = () => {
  addToMainModalHistory('Refund', () => {
    const container = document.createElement('div');

    container.innerHTML = `
      <div class='error-message'>NOT REFUNDABLE</div>
    `;

    return container;
  });
};

const refundSubmitHandler = async (eventId) => {
  document
    .querySelector('.refund-form')
    .addEventListener('click', async (event) => {
      event.preventDefault();

      const submitButton = document.querySelector('.refund-submit-btn');
      submitButton.disabled = true;
      submitButton.value = 'Processing...';

      try {
        const response = await fetch('event/refund', {
          method: 'POST',
          body: JSON.stringify({ eventId: eventId }),
          headers: {
            'X-CSRFToken': getCookie('csrftoken'),
          },
        });

        if (response.status === 200) {
          alert('Your account has been refunded.');
          afterRefundIsProcessed(eventId);
        } else {
          throw new Error();
        }
      } catch (error) {
        alert(
          "Sorry, we couldn't process your refund. Please check your internet connection and try again later."
        );
        console.error(error);
      } finally {
        submitButton.disabled = false;
        submitButton.value = 'Get Refund';
      }
    });
};

const ticketPageHTML = async (ticket, error = false) => {
  let htmlString;
  if (!error) {
    const { longitude, latitude } = getMapCoordinates(ticket.location);
    const { suburb, city } = await getLocation(
      parseInt(ticket.event_id),
      longitude,
      latitude
    );
    const datetime = formattedDateTime(ticket.timestamp);

    htmlString = `
      <div class='title font-headline mb-2'>${ticket.title}</div>
      <div>
        <i class='bi bi-geo-alt mb-1'></i>
        <span>${suburb}, ${city}</span>
      </div>
      <div>
        <i class='bi bi-clock mb-3'></i>
        <span>${datetime}</span>
      </div>
      <div class='qr-code-wrapper'>
        <qr-code class='qrcode'>
          <img src='/static/invite/images/app/logo.svg' slot='icon'>
        </qr-code>
      </div>
    `;
  } else {
    htmlString =
      "An error occurred and the ticket wasn't found. Reload the page and try again.";
  }

  document.querySelector('.ticket-container').innerHTML = htmlString;
  displayQRCode(ticket.event_id, ticket.identifier);
};

// USER

const addFollow = async (followButton, username, eventId) => {
  const updateFollowButton = () => {
    followButton.classList.replace('btn-primary', 'btn-secondary-outline');
    followButton.classList.remove('follow-btn');
    followButton.textContent = 'Following';
  };

  try {
    // Disable followButton
    followButton.disabled = true;

    const response = await fetch(`/follow/${username}`);

    if (response.status !== 200) {
      throw new Error(
        `Could't follow ${username}. Click their username to try again.`
      );
    }

    updateFollowButton();

    /// Update recommendation score
    updateScore('follow_organiser', 'event', eventId);
    updateScore('new_follow', 'person', null, username);
  } catch (error) {
    alert(error);
    console.error(error);
  } finally {
    // Enable followButton
    followButton.disabled = false;
  }
};

const isUserFollowingPublisher = async (username) => {
  try {
    const response = await fetch(`/check/is-user-following/${username}`);
    const { answer } = await response.json();
    return answer;
  } catch (error) {
    console.error(error);
    return 'NO';
  }
};

const userLogStatus = async () => {
  try {
    const response = await fetch('/logged-in');
    if (response.status !== 200) {
      throw new Error("Couldn't check user log status");
    }
    const { answer } = await response.json();
    return answer;
  } catch (error) {
    console.error(error);
    return 'NO';
  }
};

// UTILS

const eventDuration = (start, end) => {
  const difference = end - start;

  return difference <= 3600000
    ? Math.round(difference / (1000 * 60)) + ' Minutes Long'
    : (difference / (1000 * 60 * 60)).toFixed(1) + ' Hours Long';
};

const ticketDeadlineHandler = (deadline) => {
  if (!deadline) {
    return null;
  }

  const now = new Date().getTime();
  // If we are past the deadline
  if (now > deadline) {
    return 'past';
  }

  const difference = deadline - now;

  // If the difference is or less than 60 Minutes
  if (difference <= 3600000) {
    return Math.round(difference / (1000 * 60)) + ' Minutes Left';

    // If the difference is or less than 24 hours
  } else if (difference <= 86400000) {
    return Math.round(difference / (1000 * 60 * 60)) + ' Hours Left';

    // If the difference is or less than 10 days
  } else if (difference <= 864000000) {
    return Math.round(difference / (1000 * 60 * 60 * 24)) + ' Days Left';
  }

  // Difference bigger than 10 days
  return null;
};

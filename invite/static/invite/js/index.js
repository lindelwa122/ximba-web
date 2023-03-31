document.addEventListener('DOMContentLoaded', () => {
  eventsContainerLoadHandler();
  eventsContainerClickHandler('index-events-container');
  getEvents();

  document.querySelector('.filter-by-friends').addEventListener('click', () => {
    filterEvents('friends');
  });

  document.querySelector('.filter-by-following').addEventListener('click', () => {
    filterEvents('following');
  });

  document.querySelector('.filter-by-upcoming').addEventListener('click', () => {
    filterEvents('upcoming');
  });

  document.querySelector('.filter-by-nearby').addEventListener('click', () => {
    filterByNearBy();
  })

  document.querySelector('.all-index').addEventListener('click', () => {
    document.querySelectorAll('.index-filter').forEach((el) => {
      el.classList.remove('selected');
    });
  
    document.querySelector('.all-index').classList.add('selected');

    eventsSkeleton();

    getEvents();
  });
});

const filterByNearBy = () => {
  eventsSkeleton();

  document.querySelectorAll('.index-filter').forEach((el) => {
    el.classList.remove('selected');
  });

  document.querySelector('.filter-by-nearby').classList.add('selected');

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var latitude = position.coords.latitude;
      var longitude = position.coords.longitude;
      
      fetch(`/events/get/filter/nearby?location=${longitude},${latitude}`)
        .then((response) => response.json())
        .then(({ events }) => {
          if (events.length === 0) {
            document.querySelector('.index-events-container').innerHTML = 'Currently, there are no events nearby :(';
          } else {
            renderEvents(events, 'index-events-container');
          }
        })
        .catch((error) => console.error(error));
    });
  } else {
    alert('To find nearby events, we need your permission to access your location. Please enable location services for this website. Without your permission, we won\'t be able to show you events near you.');
  }
}

const eventsSkeleton = () => {
  document.querySelector('.index-events-container').innerHTML = `
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
}

const filterEvents = (filterMethod) => {
  document.querySelectorAll('.index-filter').forEach((el) => {
    el.classList.remove('selected');
  });

  document.querySelector(`.filter-by-${filterMethod}`).classList.add('selected');

  eventsSkeleton();

  fetch(`/events/get/filter/${filterMethod}`)
    .then((response) => response.json())
    .then(({ events }) => {
      renderEvents(events, 'index-events-container');
    })
    .catch((error) => console.error(error));
}

const eventsContainerLoadHandler = () => {
  document.querySelector('.index-events-container').addEventListener('load', (event) => {
    if (event.target.tagName === 'IMG') {
      event.target.classList.remove('skeleton');
    }
  }, true);
}

const getEvents = () => {
  fetch('/events/get').then((response) => response.json())
    .then(({ events }) => {
      renderEvents(events, 'index-events-container');
    })
    .catch((error) => console.error(error));
}

const userLogStatus = async () => {
  try {
    const response = await fetch('/logged-in')
    if (response.status !== 200) {
      throw new Error('Couldn\'t check user log status');
    }
    const { answer } = await response.json();
    return answer;
  } catch(error) {
    console.error(error);
    return 'NO';
  }
}

const isUserFollowingPublisher = async (username) => {
  try {
    const response = await fetch(`/check/is-user-following/${username}`)
    const { answer } = await response.json();
    return answer;
  } catch(error) {
    console.error(error);
    return 'NO'
  }
}

const renderUserInfo = async (user) => {
  const isUserLoggedIn = await userLogStatus();
  const followingUser = await isUserFollowingPublisher(user.username);
  let button;

  if (isUserLoggedIn === 'YES') {
    if (followingUser === 'YES') {
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
  `

  return htmlString;
}

const reverseGeocode = async (longitude, latitude) => {
  try {
    const response1 = await fetch('/retrieve-api-key/mapbox');
    const { key } = await response1.json();

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${key}`;
    const response = await fetch(url);
    const data = await response.json();
  
    // extract the suburb and city from the geocoding results
    const suburb = data.features[0].text;
    const city = data.features[1].text;
  
    return { suburb, city };
  } catch (error) {
    console.error(error);
    console.error('Could\'t convert coordinates to an actual address');
    const suburb = 'Unknown';
    const city = null;
    return { suburb, city };
  }
};

const getLocation = async (eventId, longitude, latitude) => {
  localStorage.clear();

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
}

const getMapCoordinates = (locationString) => {
  const coordinates = locationString.split(',');
  const longitude = parseFloat(coordinates[0]);
  const latitude = parseFloat(coordinates[1]);
  return { longitude, latitude };
}

const renderImage = (image, ticket, ticket_secured, attendees, price) => {
  if (image) {
    const setTicket = ticket ? true : false;

    let ticketBtn;
    if (setTicket) {
      ticketBtn = ticket_secured ? 
      `<button class='btn btn-primary btn-small view-ticket'>View Ticket</button>` :
      `<button class='btn btn-secondary btn-small get-ticket'>Get Ticket (${price===0 ? 'Free' : `R${price}`})</button>`;
    } else {
      ticketBtn = '';
    }

    const limitBtn = attendees > 0 ? `<button class='btn btn-secondary btn-small'>Limit: ${attendees}</button>` :
    '';

    return `
      <div class='img-cover'>
        <img src='${image}' class='skeleton' alt='Event Cover'>
        <div class='buttons-container'>
          <div>
            ${limitBtn}
          </div>
          <div class='d-flex justify-content-end'>
            ${ticketBtn}
          </div>
        </div>
      </div>
    `
  }

  return '';
}

const renderPostActions = (access, ticket_secured, attendance_limit, price) => {
  let ticketButton;
  if (access) {
    ticketButton = ticket_secured ?
    `<button class='btn btn-primary btn-small view-ticket'>View Ticket</button>` :
    `<button class='btn btn-secondary btn-small get-ticket'>Get Ticket (${price===0 ? 'Free' : `R${price}`})</button>`;
  } else {
    ticketButton = '';
  }

  const limitButton = parseInt(attendance_limit) > 0 ?
  `<button class='btn btn-secondary-outline btn-small'>Limit: ${attendance_limit}</button>` :
  ''

  return `
    <div class='post-action'>
      ${limitButton}
      ${ticketButton}
    </div>
  `;
}

const renderEvents = (posts, containerClassName) => {
  Promise.all(posts.map(async (event) => {
    const userInfo = await renderUserInfo(event.publisher[0]);
    const { longitude, latitude } = getMapCoordinates(event.location);
    const { suburb, city } = await getLocation(event.id, longitude, latitude);
    const datetime = formattedDateTime(event.timestamp);
    return `
        <div class='post post-wp border-bottom border-dark' data-eventid=${event.id}>
          <div class='post-intro'>
            ${userInfo}
            <div class='post-head'>
              <div class='font-title'>${event.title}</div>
              <div>
                <i class='bi bi-geo-alt'></i>
                <span class='ms-1' title='${!city ? "The location of this event is unknown or unavailable at the moment" : ""}'>${suburb}, ${city}</span>
              </div>
            </div>
          </div>

          ${!event.cover ? renderPostActions(event.with_ticket, event.ticket_secured, event.attendance_limit, event.ticket_price) : ''}

          ${renderImage(event.cover, event.with_ticket, event.ticket_secured, event.attendance_limit, event.ticket_price)}

          <div class='post-caption'>
            <div class='short-description'>${event.description} <span class='see-more show link font-body-tiny'>See more</span></div>

            <div class='post-interactions d-flex align-items-center justify-content-between'>
              <div class='d-flex align-items-center'>
                <i class='bi ${event.attending ? 'bi-person-fill' : 'bi-person'}'></i>
                <span class='ms-1 attendees-count'>${event.attendees}</span>
              </div>
              <div class='d-flex align-items-center'>
                <i class='bi bi-repeat'></i>
                <span class='ms-1'>37</span>
              </div>
              <div class='d-flex align-items-center'>
                <i class='bi ${event.user_saved_event ? 'bi-bookmark-fill' : 'bi-bookmark'} save-event'></i>
                <span class='ms-1 saves-count'>${event.saves}</span>
              </div>
            </div>

            <div class='event-more-info'>
              <div>
                <i class='bi bi-geo-alt'></i>
                <span class='ms-2 exact-location link' data-location='${event.location}'>See exact location</span>
              </div>
              <div>
                <i class='bi bi-clock'></i>
                <span class='ms-2 datetime'>${datetime}</span>
              </div>
              ${event.more_info ? `
                <div>
                  <i class='bi bi-info-circle'></i>
                  <span class='ms-2 link more-info' data-id='${event.id}'>More info</a></span>
                </div>
              ` : ''}
              <div class='tags-container'>${keywordsDisplay(event.keywords)}</div>
            </div>
          </div>
        </div>
      `;
  })).then((htmlStrings) => {
    document.querySelector(`.${containerClassName}`).innerHTML = htmlStrings.join('');
  });
}

const keywordsDisplay = (keywords) => {
  const keywordsArr = keywords.split(',');

  const htmlStrings = keywordsArr.map((keyword) => {
    return `
      <div>${keyword}</div>
    `
  });

  return htmlStrings.join('');
}

const showHideEventInfoToggle = (post) => {
  const moreInfo = post.querySelector('.event-more-info');
  const showMoreInfoAction = post.querySelector('.see-more');

  if (showMoreInfoAction.classList.contains('show')) {
    moreInfo.style.height = moreInfo.scrollHeight + 'px';

    const setHeightToAuto = () => {
      moreInfo.height = 'auto';
      moreInfo.removeEventListener('transitionend', setHeightToAuto);
    }

    moreInfo.addEventListener('transitionend', setHeightToAuto);
    showMoreInfoAction.classList.replace('show', 'hide');
    showMoreInfoAction.textContent = 'Hide info';
  } else {
    moreInfo.style.height = moreInfo.scrollHeight + 'px';
    moreInfo.style.height = 0;
    showMoreInfoAction.classList.replace('hide', 'show');
    showMoreInfoAction.textContent = 'See more';
  }
}

const getTicket = (btn, eventId, bookmarkIcon, savedCount, attendeesIcon, attendeesCount) => {
  const id = parseInt(eventId);
  const prevInnerHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving your ticket...';

  fetch(`/event/ticket/get/${id}`)
    .then((response) => {
      switch (response.status) {
        case 200:
          alert('Ticket added to your saved events.');
          btn.classList.replace('btn-secondary', 'btn-primary');
          btn.classList.replace('get-ticket', 'view-ticket');

          if (bookmarkIcon) {
            bookmarkIcon.classList.replace('bi-bookmark', 'bi-bookmark-fill');
            savedCount.textContent = parseInt(savedCount.textContent) + 1;
          }

          attendeesIcon.classList.replace('bi-person', 'bi-person-fill');
          attendeesCount.textContent = parseInt(attendeesCount.textContent) + 1;
          btn.innerHTML = 'View Ticket';
          break;

        case 401:
          alert('Sorry, this event has reached the maximum number of attendees.')
          throw new Error('Maximum number of attendees reached');
          
        case 404:
          alert('Event not found.');
          throw new Error('Event not found.');

        case 409:
          alert('This ticket is already saved.');
          throw new Error('This ticket is already saved.');
      }
    })
    .catch((error) => {
      btn.innerHTML = prevInnerHTML;
      console.error(error);
    })
    .finally(() => btn.disabled = false);
}

const displayQRCode = (eventId, ticketIdentifier) => {
  const qrcode = document.querySelector('.qrcode');
  qrcode.contents = `/ticket/${eventId}/${ticketIdentifier}`;
  qrcode.moduleColor = '#3b44f6';
  qrcode.positionCenterColor = '#3b44f6';
  qrcode.positionRingColor = '#3ec70b';

  qrcode.addEventListener('codeRendered', () => {
    qrcode.animateQRCode('MaterializeIn');
  });
}

const ticketPageHTML = async (ticket, error) => {
  let htmlString;
  if (!error) {
    const { longitude, latitude } = getMapCoordinates(ticket.location);
    const { suburb, city } = await getLocation(
      parseInt(ticket.event_id),
      longitude,
      latitude
    )
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
    htmlString = 'An error occurred and the ticket wasn\'t found. Reload the page and try again.';
  }
 
  document.querySelector('.ticket-container').innerHTML = htmlString;
  displayQRCode(ticket.event_id, ticket.identifier);
}

const fetchTicketData = (id) => {
  fetch(`/ticket/${id}`)
    .then((response) => response.json())
    .then(({ ticket_info }) => ticketPageHTML(ticket_info))
    .catch((error) => {
      ticketPageHTML('', true);
      console.error(error);
    });
}

const removeAttendee = (id, icon, count, ticket, method='normal') => {
  fetch('/event/remove/attendee',{
    method: 'DELETE',
    body: JSON.stringify({ eventId: id, method: method }),
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
    }
  })
    .then((response) => {
      if (response.status === 200) {
        icon.classList.replace('bi-person-fill', 'bi-person')
        count.textContent = parseInt(count.textContent) - 1;

        if (ticket) {
          ticket.classList.replace('btn-primary', 'btn-secondary');
          ticket.classList.replace('view-ticket', 'get-ticket');
          ticket.textContent = 'Get Ticket (Free)';
        }
      } else if (response.status === 400) {
        const removeTicket = confirm('Are you sure you want to remove your ticket? This action cannot be undone?');
        if (removeTicket) {
          removeAttendee(id, icon, count, ticket, 'free');
        }
      } else {
        throw new Error('An error occurred. Please try again later!');
      }
    })
    .catch((error) => {
      alert(error);
      console.error(error);
    })
}

const unsavedEvent = (id, savedIcon, savedCount) => {
  fetch('/saved-event/delete', {
    method: 'DELETE',
    body: JSON.stringify({ eventId: id }),
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
    },
  })
    .then((response) => {
      if ((response.status === 200)) {
        savedIcon.classList.replace('bi-bookmark-fill', 'bi-bookmark');
        savedCount.textContent = parseInt(savedCount.textContent) - 1;
      } else if (response.status === 400) {
        alert('You can\'t remove this event because you already own the ticket. Try removing the ticket by pressing the attendees icon (person icon).');
      } else {
        throw new Error('An error occurred, try removing this event later.');
      }
    })
    .catch((error) => {
      alert(error);
      console.error(error);
    })
}

const addAttendee = (id, attendeesIcon, attendeesCount, savedIcon, savedCount, ticketBtn, updateSavedCount=false, method='normal') => {
  fetch('/event/add/attendee', {
    method: 'POST',
    body: JSON.stringify({ eventId: id, method: method }),
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
    },
  })
    .then((response) => {
      if (response.status === 200) {
        attendeesIcon.classList.replace('bi-person', 'bi-person-fill');
        attendeesCount.textContent = parseInt(attendeesCount.textContent) + 1;

        if (updateSavedCount) {
          savedIcon.classList.replace('bi-bookmark', 'bi-bookmark-fill');
          savedCount.textContent = parseInt(savedCount.textContent) + 1;
        }
        return;
      } else if (response.status === 400) {
        getTicket(ticketBtn, id, savedIcon, savedCount, attendeesIcon, attendeesCount);
      } else if (response.status === 401) {
        alert('Sorry, this event has reached the maximum number of attendees.');
      }
    })
    .catch((error) => {
      alert('Sorry an error occurred and we couldn\'t add you as an attendee. Please save this event and try again later');
      console.error(error);
    })
}

const saveEvent = (id, btn, count) => {
  fetch('/event/save', {
    method: 'POST',
    body: JSON.stringify({ eventId: id }),
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
    },
  })
    .then((response) => {
      switch (response.status) {
        case 200:
          btn.classList.replace('bi-bookmark', 'bi-bookmark-fill');
          count.textContent = parseInt(count.textContent) + 1;
          break;

        case 409:
          alert('This event is already added to your saved list.');
          break;

        default:
          alert('We couldn\'t add this event to your saved list. Please reload, search for the event and try again!');
          break;
      }
    })
}

const getCookie = (name) => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}

fetch('/retrieve-api-key/mapbox')
  .then((response) => response.json())
  .then(({ key }) => {
    mapboxgl.accessToken = key;
  });

const showMap = (long, lat) => {
  document.querySelector('#map').style.height = '300px';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [long, lat],
    zoom: 7
  });

  const marker = new mapboxgl.Marker()
    .setLngLat([long, lat])
    .addTo(map);

  map.on('click', (event) => {
    marker.setLngLat(event.lngLat);
  }); 
}

const showExactLocation = (post) => {
  const locationDiv = post.querySelector('.exact-location');
  const location = locationDiv.dataset.location;
  const { longitude, latitude } = getMapCoordinates(location);

  addToMainModalHistory('See exact location', () => {
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
    `

    return container;
  }, [{ func: showMap, values: [longitude, latitude] }]);

  const needDirectionsBtn = document.querySelector('.need-directions');
  const directionsOptions = () => {
    const routeProfile = document.querySelector('.route-profile');
    routeProfile.style.height = routeProfile.scrollHeight + 'px';
    needDirectionsBtn.classList.replace('need-directions', 'directions');
    needDirectionsBtn.innerHTML = 'Get Directions';
    needDirectionsBtn.removeEventListener('click', directionsOptions);

    const getDirectionsBtn = document.querySelector('.directions');
    const viewDirections = () => {
      document.querySelector('.route-profile').style.height = 0;
      getDirectionsBtn.innerHTML = 'See instructions';
      getDirectionsBtn.classList.replace('directions', 'instructions-view');

      const selectedDirectionType = document.querySelector('.direction-type').value;
      const destinationLocation = [longitude, latitude];

      getDirectionsBtn.removeEventListener('click', viewDirections);

      getDirections(destinationLocation, selectedDirectionType);
    }

    getDirectionsBtn.addEventListener('click', viewDirections);
  }

  needDirectionsBtn.addEventListener('click', directionsOptions);
}

function getDirections(destination, directionsType) {
  // Toggle between instructions and directions
  const instructionsDirectionsBtn = document.querySelector('.instructions-directions');
  instructionsDirectionsBtn.addEventListener('click', () => {
    document.querySelector('.directions-wrapper').classList.toggle('d-none');
    document.querySelector('.instructions-wrapper').classList.toggle('d-none');

    if (instructionsDirectionsBtn.classList.contains('instructions-view')) {
      instructionsDirectionsBtn.classList.replace('instructions-view', 'directions-view');
      instructionsDirectionsBtn.innerHTML = 'See directions';
    } else {
      instructionsDirectionsBtn.classList.replace('directions-view', 'instructions-view');
      instructionsDirectionsBtn.innerHTML = 'See instructions';
    }
  });

  // Empty map
  document.querySelector('#map').innerHTML = '';

  // Use geolocation API to get user's current location
  navigator.geolocation.getCurrentPosition(function(position) {
    const origin = [position.coords.longitude, position.coords.latitude];

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: origin, // starting position
      zoom: 12
    });
    
    // an arbitrary start will always be the same
    // only the end or destination will change
    // this is where the code for the next step will go
    // create a function to make a directions request
    async function getRoute(destination) {
      // make a directions request using cycling profile
      // an arbitrary start will always be the same
      // only the end or destination will change
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
          coordinates: route
        }
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
            data: geojson
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3887be',
            'line-width': 5,
            'line-opacity': 0.75
          }
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

      const instructions = document.getElementById('instructions');
      const steps = data.legs[0].steps;
    
      let tripInstructions = '';
      for (const step of steps) {
        tripInstructions += `<li>${step.maneuver.instruction}</li>`;
      }
      instructions.innerHTML = `<p><strong>Trip duration: ${Math.floor(
        data.duration / 60
      )} min ${directionEmoji} </strong></p><ol>${tripInstructions}</ol>`;
    }
  
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
                  coordinates: origin
                }
              }
            ]
          }
        },
        paint: {
          'circle-radius': 10,
          'circle-color': '#3887be'
        }
      });
      // this is where the code from the next step will go
    });
  })
}

const addFollow = (btn, username) => {
  btn.disabled = true;

  fetch(`/follow/${username}`)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`Could't follow ${username}. Click their username to try again.`);
      }

      btn.classList.replace('btn-primary', 'btn-secondary-outline');
      btn.classList.remove('follow-btn');
      btn.textContent = 'Following';
    })
    .catch((error) => {
      console.error(error);
      alert(error);
    })
    .finally(() => btn.disabled = false);
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.saved-events-btn').forEach((el) => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.nav-icon-wrapper-lg').forEach((icon) => {
        icon.classList.remove('selected');
      });
      
      document.querySelector('.saved-events-btn').classList.add('selected');
  
      addToMainModalHistory('Saved events', () => {
        const container = document.createElement('div');
        container.className = 'saved-events-container';
        container.innerHTML = `
          <div>
            <div class='skeleton skeleton-card'></div>
            <div class='skeleton skeleton-card'></div>
            <div class='skeleton skeleton-card'></div>
          </div>
        `;
        return container;
      }, [{ func: fetchSavedEvents, values: [] }]);
    });

    loadEventHandler();
  })
});

const fetchSavedEvents = () => {
  fetch('/saved-events')
    .then((response) => response.json())
    .then(({ events }) => renderSavedEvents(events))
    .catch((error) => console.error(error));
}

const renderSavedEventsImage = (image) => {
  return image ? `<div class='img-cover me-2'><img src='${image}' alt='event-cover'></div>` : '';
}

const eventsContainerClickHandler = (containerClassName) => {
  console.log(containerClassName);
  const container = document.querySelector(`.${containerClassName}`);
  container.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
      let button = event.target.closest('.follow-btn');
      if (button) {
        const post = event.target.closest('.post');
        const eventId = post.dataset.eventid;
        const username = button.parentElement.parentElement.dataset.username;
        followUserInSavedEvents(button, username, eventId);
        return;
      }

      button = event.target.closest('.get-ticket');
      if (button) {
        const post = event.target.closest('.post');
        const eventId = post.dataset.eventid;
        const bookmarkIcon = post.querySelector('.bi-bookmark');
        const savedCount = post.querySelector('.saves-count');
        const attendeesIcon = post.querySelector('.bi-person');
        const attendeesCount = post.querySelector('.attendees-count');
        // getTicket(button, eventId, bookmarkIcon, savedCount, attendeesIcon, attendeesCount);
        addAttendee(eventId, attendeesIcon, attendeesCount, bookmarkIcon, savedCount, button);
        return;
      }

      button = event.target.closest('.view-ticket');
      if (button) {
        const post = event.target.closest('.post');
        const eventId = parseInt(post.dataset.eventid);
        addToMainModalHistory('Ticket', () => {
          const container = document.createElement('div');
          container.classList = 'ticket-container';
          container.innerHTML = `
            <div class='skeleton skeleton-card'></div>
          `;
          return container;
        }, [{ func: fetchTicketData, values: [eventId] }]);
        return;
      }
    }

    if (event.target.classList.contains('see-more')) {
      const post = event.target.closest('.post');
      updateScore('see_more', 'event', post.dataset.eventid);
      showHideEventInfoToggle(post);
      return;
    }

    if (event.target.classList.contains('exact-location')) {
      const post = event.target.closest('.post');
      showExactLocation(post);
      return;
    }

    if (event.target.classList.contains('bi-bookmark')) {
      const post = event.target.closest('.post');
      const eventId = post.dataset.eventid;
      const savedCount = post.querySelector('.saves-count');
      const saveBtn = post.querySelector('.bi-bookmark');
      saveEvent(eventId, saveBtn, savedCount);
    }

    if (event.target.classList.contains('bi-bookmark-fill')) {
      const post = event.target.closest('.post');
      const eventId = post.dataset.eventid;
      const savedCount = post.querySelector('.saves-count');
      const savedIcon = post.querySelector('.bi-bookmark-fill');
      unsavedEvent(eventId, savedIcon, savedCount);
    }

    if (event.target.classList.contains('share-event')) {
      const post = event.target.closest('.post');
      const eventId = post.dataset.eventid;
      shareEventModal(eventId);
    }

    if (event.target.classList.contains('bi-person')) {
      const post = event.target.closest('.post');
      const eventId = post.dataset.eventid;
      const attendeesIcon = post.querySelector('.bi-person');
      const attendeesCount = post.querySelector('.attendees-count');
      const savedIcon = post.querySelector('.bi-bookmark');
      const savedCount = post.querySelector('.saves-count');
      const ticketBtn = post.querySelector('.get-ticket');
      addAttendee(eventId, attendeesIcon, attendeesCount, savedIcon, savedCount, ticketBtn, Boolean(savedIcon));
    }

    if (event.target.classList.contains('bi-person-fill')) {
      const post = event.target.closest('.post');
      const eventId = post.dataset.eventid;
      const attendeesIcon = post.querySelector('.bi-person-fill');
      const attendeesCount = post.querySelector('.attendees-count');
      const ticketBtn = post.querySelector('.view-ticket');
      removeAttendee(eventId, attendeesIcon, attendeesCount, ticketBtn);
    }

    if (event.target.classList.contains('more-info')) {
      const post = event.target.closest('.post');
      const eventId = post.dataset.eventid;
      window.location.href = `/more-info/${eventId}/event/view`;
    }
  });
}

const savedEventsContainerClickHandler = (e, events) => {
  if (e.target.classList.contains('title')) {
    const container = e.target.closest('.event');
    const index = parseInt(container.dataset.index);
    const event = events[index];

    const title = event.title.length >= 20 ? event.title.slice(0, 20) + '...' : event.title;

    addToMainModalHistory(title, () => {
      const eventsContainer = document.createElement('div');
      eventsContainer.className = 'events-container';
      return eventsContainer;
    }, [
      { func: renderEvents, values: [[event], 'events-container'] },
      { func: eventsContainerClickHandler, values: ['events-container'] }
    ]);

    return;
  }

  if (e.target.classList.contains('view-ticket')) {
    const container = e.target.closest('.event');
    const eventId = parseInt(container.dataset.id);
    addToMainModalHistory('Ticket', () => {
      const containerDiv = document.createElement('div');
      containerDiv.classList = 'ticket-container';
      containerDiv.innerHTML = `
        <div class='skeleton skeleton-card'></div>
      `;
      return containerDiv;
    }, [{ func: fetchTicketData, values: [eventId] }]);
  }

  if (e.target.classList.contains('remove-event')) {
    const event = e.target.closest('.event');
    const eventId = parseInt(event.dataset.id);
    removeEventFromSavedList(event, eventId);
  }
}

const removeEventFromSavedList = async (event, eventId) => {
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
        event.classList.add('disappear');
        event.addEventListener('transitionend', () => {
          event.remove();
        });
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
}

const renderSavedEvents = (events) => {
  const savedEventsContainer = document.querySelector('.saved-events-container');
  savedEventsContainer.addEventListener('click', (event) => savedEventsContainerClickHandler(event, events));

  savedEventsContainer.innerHTML = `
    ${events.map((event, index) => `
      <div class='event d-flex justify-content-between align-items-center' data-id='${event.id}' data-index='${index}'>
        <div>
          <div class='d-flex align-items-center mb-2'>
            ${renderSavedEventsImage(event.cover)}
            <div class='title'>${event.title}</div>
          </div>
          <div class='d-flex align-items-center'>
            <i class='bi bi-clock'></i>
            <div class='ms-1 font-body-tiny'>${formattedDateTime(event.timestamp)}</div>
          </div>
        </div>
        <div class='d-flex align-items-center'>
          ${renderTicket(event.with_ticket, event.ticket_secured)}
          <i class='remove-event bi bi-x'></i>
        </div>
      </div>
    `).join('')}
  `;
}

const renderTicket = (with_ticket, ticket_secured) => {
  if (with_ticket) {
      return ticket_secured ? 
      `<button class='btn btn-primary btn-small me-2 view-ticket'>Ticket</button>` :
      `<button class='btn btn-primary-outline btn-small me-2 get-ticket'>Get Ticket</button>`;
  } else {
    return '';
  }
}

const followUserInSavedEvents = (btn, username, eventId) => {
  btn.disabled = true;

  const updateButtonContent = (button) => {
    button.classList.replace('btn-primary', 'btn-secondary-outline');
    button.classList.remove('follow-btn');
    button.textContent = 'Following';
  }

  fetch(`/follow/${username}`)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`Could't follow ${username}. Click their username to try again.`);
      }

      document.querySelectorAll(`.${username}-follow`).forEach((button) => {
        updateButtonContent(button);
      });

      updateButtonContent(btn);

      // Update recommendation score
      updateScore('follow_organiser', 'event', eventId);
      updateScore('new_follow', 'person', null, username);
    })
    .catch((error) => {
      console.error(error);
      alert(error);
    })
    .finally(() => btn.disabled = false);
}

const loadEventHandler = () => {
  document.querySelector('.modal-page-content').addEventListener('load', (event) => {
    if (event.target.tagName === 'IMG') {
      event.target.classList.remove('skeleton');
    }
  }, true);
}

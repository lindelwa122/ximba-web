document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.saved-events-btn').addEventListener('click', () => {
    fetchSavedEvents();
    addToMainModalHistory('Saved events', () => {
      const container = document.createElement('div');
      container.className = 'saved-events-container';
      container.innerHTML = `
        <div class='skeleton skeleton-card'></div>
        <div class='skeleton skeleton-card'></div>
        <div class='skeleton skeleton-card'></div>
      `;
      return container;
    }, [{ func: fetchSavedEvents, values: [] }]);
  });
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
    }, [{ func: renderEvents, values: [[event], 'events-container'] }]);

    eventsContainerClickHandler('events-container');

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
          <button class='btn btn-primary btn-small me-2 view-ticket'>Ticket</button>
          <i class='bi bi-x'></i>
        </div>
      </div>
    `).join('')}
  `;
}
document.addEventListener('DOMContentLoaded', () => {
  const url = window.location.pathname.split('/');
  const id = parseInt(url[2]);

  fetch(`/more-info/${id}/view`)
    .then((response) => response.json())
    .then(({ info }) => {
      const draftList = JSON.parse(JSON.parse(info));
      renderMoreInfo(draftList);

      // Update recommendation scores
      updateScore('read_more_info', 'event', id);
    })
    .catch((error) => console.error(error));
});

const renderMoreInfo = (arr) => {
  arr.map((item) => {
    const [selector, value] = Object.entries(item)[0];

    // Creating the container
    const container = document.createElement('div');
    container.className = selector === 'p' ? 'p-wrapper' : 'h-wrapper';
    container.dataset.index = arr.indexOf(item);

    // Creating the html content
    const html = document.createElement(selector);
    html.innerHTML = value;
    html.className = selector === 'p' ? '' : 'title';

    container.appendChild(html);

    document.querySelector('.text-container').appendChild(container);
  });
};

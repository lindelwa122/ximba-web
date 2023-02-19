document.querySelectorAll('.search-btn').forEach((el) => {
  el.addEventListener('click', () => {
    addToMainModalHistory('Recents', searchContent, '10px');

    fetchRecentSearches();

    document.querySelector('.search-input').addEventListener('focus', () => {
      // Add animation to input
      document.querySelector('.search-input-container').classList.add('move-to-top');

      const recentSearchesWrapper = document.querySelector('.recent-searches-wrapper');

      // Add animation to recent searches
      recentSearchesWrapper.classList.add('hide');

      // When recent searches wrapper animation ends
      recentSearchesWrapper.addEventListener('animationend', () => {
        recentSearchesWrapper.style.display = 'none';
      });

      // When the input animation ends
      document.querySelector('.move-to-top').addEventListener('animationend', () => {
        document.querySelector('.move-to-top').style.top = '10px';

        // Change the title of the modal
        document.querySelectorAll('.modal-page-title').forEach((title) => {
          title.textContent = 'Search';
        });

        // Show search results container
        searchResultsAnimation();
      })
    });
  });
});

const renderRecentUsers = (data) => {
  document.querySelector('.recent-searches-wrapper').innerHTML = `
    ${data.map((user) => `
      <div class='account-container d-flex justify-content-between align-items-center p-2' data-username='${user.username}'>
        <div class='d-flex'>
          <img class='skeleton profile-img' src='${user.profile_img}'>
          <div class='ms-1'>
            <div class='font-body-tiny'>@${user.username}</div>
            <div class='font-body'>${user.fullname}</div>
          </div>
        </div>
        <div class='btn-container'>
        </div>
      </div>
    `).join('')}
  `
}

const fetchRecentSearches = () => {
  fetch('search/recent')
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('Couldn\'t fetch recent searches, try to reload the page');
      }
      return response.json();
    })
    .then(({ recent }) => {
      renderRecentUsers(recent);
    })
    .catch((error) => {
      document.querySelector('.recent-searches-wrapper').innerHTML = `<div class='display-error'>${error}</div>`;
      console.error(error);
    })
}

const searchResultsAnimation = () => {
  const container = document.querySelector('.search-results');
  container.style.display = 'block';
  container.classList.add('show');
}

const searchContent = () => {
  // Creating Elements
  const container = document.createElement('div');

  container.className = 'search-container';

  container.innerHTML = `
    <div class='recent-searches-wrapper'>
      <div class='skeleton skeleton-card'></div>
      <div class='skeleton skeleton-card'></div>
      <div class='skeleton skeleton-card'></div>
    </div>

    <div class='search-results'>
      <div class='header pb-1 border-bottom border-dark'>
        <span>Accounts</span>
        <span>Area</span>
        <span>Events</span>
        <span>Tags</span>
        <span>Past</span>
        <span>Upcoming</span>
      </div>
    </div>

    <div class='search-input-container'>
      <input type='search' class='form-control input-frame search-input' placeholder="Try  'jane',  'cape town',  'wedding'">
      <div class='search-icon-wrapper'>
        <i class='bi bi-search'></i>
      </div>
    </div>
  </div>
  `

  return container;
};

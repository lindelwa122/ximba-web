document.querySelectorAll('.search-btn').forEach((el) => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.nav-icon-wrapper-lg').forEach((icon) => {
      icon.classList.remove('selected');
    });

    el.classList.add('selected');

    // Open main modal with search content
    addToMainModalHistory('Recents', searchContent, '10px');

    fetchRecentSearches();

    // Handle click event on the search container
    searchContainerClickHandler();

    // Handle load event on the search container
    searchContainerLoadHandler();

    // Handle focus event on search input
    searchInputFocusHandler();

    // Handle input event on search input
    document
      .querySelector('.search-input')
      .addEventListener('input', fetchSearchResults);

    // Handle input click on search input
    document
      .querySelector('.search-icon-wrapper')
      .addEventListener('click', fetchSearchResults);
  });
});

const searchContent = () => {
  // Create container
  const container = document.createElement('div');

  // Add class name
  container.className = 'search-container';

  container.innerHTML = `
    <div class='recent-searches-wrapper'>
      <div class='skeleton skeleton-card'></div>
      <div class='skeleton skeleton-card'></div>
      <div class='skeleton skeleton-card'></div>
    </div>

    <div class='search-results'>
      <div class='nav border-bottom border-dark'>
        <span class='active'>Accounts</span>
        <span>Area</span>
        <span>Events</span>
        <span>Tags</span>
        <span>Past</span>
        <span>Upcoming</span>
      </div>
      <div class='content'>
        <span class='spinner'></span>
      </div>
    </div>

    <div class='search-input-container'>
      <input type='search' class='form-control input-frame search-input' placeholder="Try  'jane',  'cape town',  'wedding'">
      <div class='search-icon-wrapper'>
        <i class='bi bi-search'></i>
      </div>
    </div>
  </div>
  `;

  return container;
};

// ANIMATION

const searchInputAnimation = () => {
  document
    .querySelector('.move-to-top')
    .addEventListener('animationend', () => {
      document.querySelector('.move-to-top').style.top = '10px';

      // Change the title of the modal
      document.querySelectorAll('.modal-page-title').forEach((title) => {
        title.textContent = 'Search';
      });

      // Show search results container
      searchResultsAnimation();
    });
};

const searchResultsAnimation = () => {
  const container = document.querySelector('.search-results');
  container.style.display = 'block';
  container.classList.add('show');
};

// FETCH REQUEST

const addToRecentSearches = (username) => {
  const csrfToken = document.querySelector(
    'input[name="csrfmiddlewaretoken"]'
  ).value;

  fetch(`/search/recent/add/${username}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken
    },
    body: JSON.stringify({ username: username })
  });
}

const fetchSearchResults = () => {
  const spinner = document.querySelector('.spinner');

  // Show spinner if it exists, otherwise create it
  if (spinner) {
    spinner.style.display = 'inline';
  } else {
    document.querySelector(
      '.content'
    ).innerHTML = `<span class='spinner'></span>`;
  }

  const query = document.querySelector('.search-input').value;

  if (query.length > 0) {
    fetch(`/search?query=${query}&threshold=60`)
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(
            "Couldn't fetch matching username, try to reload the page"
          );
        }
        return response.json();
      })
      .then(({ users }) => {
        renderUserSearchResults(users, 'content');
      })
      .catch((error) => {
        document.querySelector(
          '.content'
        ).innerHTML = `<div class='display-error'>${error}</div>`;
        console.error(error);
      });
  }
};

const fetchRecentSearches = () => {
  fetch('/search/recent')
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(
          "Couldn't fetch recent searches, try to reload the page"
        );
      }
      return response.json();
    })
    .then(({ recent }) => {
      renderUserSearchResults(recent, 'recent-searches-wrapper');
    })
    .catch((error) => {
      document.querySelector(
        '.recent-searches-wrapper'
      ).innerHTML = `<div class='display-error'>${error}</div>`;
      console.error(error);
    });
};

// HANDLERS

const searchContainerClickHandler = () => {
  document
    .querySelector('.search-container')
    .addEventListener('click', (event) => {
      // Get the clicked account container
      const accountContainer = event.target.closest('.account-container');
      
      if (accountContainer) {
        const username = accountContainer.dataset.username;
        // Add user to recent searches
       addToRecentSearches(username);
        window.location.href = username;
      }
    });
};

const searchContainerLoadHandler = () => {
  document.querySelector('.search-container').addEventListener(
    'load',
    (event) => {
      if (event.target.tagName === 'IMG') {
        const img = event.target;
        img.classList.remove('skeleton');
      }
    },
    true
  );
};

const searchInputFocusHandler = () => {
  document.querySelector('.search-input').addEventListener('focus', () => {
    // Add animation to input
    document
      .querySelector('.search-input-container')
      .classList.add('move-to-top');

    const recentSearchesWrapper = document.querySelector(
      '.recent-searches-wrapper'
    );

    // Add animation to recent searches
    recentSearchesWrapper.classList.add('hide');

    // When recent searches wrapper animation ends
    recentSearchesWrapper.addEventListener('animationend', () => {
      recentSearchesWrapper.style.display = 'none';
    });

    // When the input animation ends
    searchInputAnimation();
  });
};

// RENDER DATA

const renderUserSearchResults = (data, containerClass) => {
  document.querySelector(`.${containerClass}`).innerHTML = `
    ${data
      .map(
        (user) => `
      <div class='account-container d-flex justify-content-between align-items-center p-2' data-username='${user.username}'>
        <div class='d-flex'>
          <img class='skeleton profile-img' src='${user.image}'>
          <div class='ms-1'>
            <div class='font-body-tiny'>@${user.username}</div>
            <div class='font-body'>${user.fullName}</div>
          </div>
        </div>
      </div>
    `
      )
      .join('')}
  `;

  if (data.length === 0 & containerClass === 'content') {
    document.querySelector(`.${containerClass}`).innerHTML = `
      <div class='not-found'>
        <img class='illustration' src='/static/invite/images/illustrations/page_not_found.gif' alt='Search results not found'>
        <div class='mt-2 text-center'>We couldn't find any results for your search. Please try again with a different keyword.</div>
      </div>
    `;
  }
};

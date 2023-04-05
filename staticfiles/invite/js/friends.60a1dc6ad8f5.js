// AFTER THE DOM CONTENT HAS LOADED
document.addEventListener('DOMContentLoaded', () => {
  const getUserFriends = () => {
    // Add a button depending if user is authenticated (if user is viewing their profile)
    fetch(`/is-user-authenticated/${username}`)
      .then((response) => {
        if (response.status === 200) {
          document.querySelector('.view-friends-btn-container').innerHTML = `
            <button class='btn btn-secondary view-pending-friends'>View Pending Friends</button>
          `
        }
      })
      .catch((error) => console.error(error))
      .finally(() => {
        // Fetch the user's friends data
        fetchFriends();
        // Add a load event handler for the friends container
        friendsContainerLoadHandler();
        // Add a click event handler for the friends container
        friendsContainerClickHandler();
      });
  }


  // Get the friends wrapper container element
  const friendsWrapper = document.querySelector('.friends-wrapper');
  // If the container exists, add a click event listener to it
  if (friendsWrapper) {
    friendsWrapper.addEventListener('click', () => {
      // Add the Friends page to the main modal history
      addToMainModalHistory('Friends', () => {
        // Create a container element for the friends page
        const container = document.createElement('div');
        container.className = 'friends-container';
        container.innerHTML = `
          <div class='view-friends-btn-container'>
          </div>
          <div class='friends-main-content'>
          <div class='skeleton skeleton-card'></div>
            <div class='skeleton skeleton-card'></div>
            <div class='skeleton skeleton-card'></div>
            <div class='skeleton skeleton-card'></div>
          </div>
        `
        // Return the container element
        return container;
      }, [{ func: getUserFriends, values: [] }]);
    });
  }

  // Add click event listeners to all elements with the class 'friends-btn'
  document.querySelectorAll('.friends-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-icon-wrapper-lg').forEach((icon) => {
        icon.classList.remove('selected');
      });
      
      document.querySelector('.friends-btn').classList.add('selected');

      showSuggestedFriends()
    });
  });
});

// Define a function to show the suggested friends page
const showSuggestedFriends = () => {
  // Add the Find Friends page to the main modal history
  addToMainModalHistory('Find Friends', () => {
    // Create a container element for the suggested friends page
    const container = document.createElement('div');
    container.className = 'suggested-friends-container';
    container.innerHTML = `
      <div class='skeleton skeleton-card'></div>
      <div class='skeleton skeleton-card'></div>
      <div class='skeleton skeleton-card'></div>
    `
    // Return the container element
    return container;
  }, [
    { func: fetchSuggestedFriends, values: [] },
    { func: suggestedFriendsContainerClickHandler, values: [] },
    { func: suggestedFriendsContainerLoadHandler, values: [] }
  ]);
}


// ERROR HANDLER
const errorHandler = (errorContainerClassName, error) => {
  document.querySelector(`.${errorContainerClassName}`).innerHTML = `
    <div class='display-error'>${error}</div>
  `;
  console.error(error);
}

// HANDLERS
// Handles click events on the suggested friends container
const suggestedFriendsContainerClickHandler = () => {
  document
    .querySelector('.suggested-friends-container')
    .addEventListener('click', (event) => {

      // Check the tag name of the clicked element
      switch (event.target.tagName) {
        case 'DIV':
          // Get the clicked account container
          const accountContainer = event.target.closest('.account-container');

          if (accountContainer) {
            // Extract the username of the clicked user
            const username = accountContainer.dataset.username;

            // Navigate to the clicked user's profile page
            window.location.href = username;
          }

          break;

        case 'BUTTON':
          // Get the clicked button
          const btnClicked = event.target.closest('.add-friend');

          if (btnClicked) {
            // Extract the username of the clicked user
            const username = btnClicked.parentElement.parentElement.dataset.username;

            // Disable the button to prevent multiple clicks
            btnClicked.disabled = true;

            // Send a friend request to the clicked user
            addFriend(btnClicked, username);
          }

          break;
      }

    });
}


// Handles click events on the friends container
const friendsContainerClickHandler = () => {
  document
    .querySelectorAll('.friends-main-content').forEach((el) => {
      el.addEventListener('click', (event) => {

        // Check the tag name of the clicked element
        switch (event.target.tagName) {
          case 'DIV':
            // Get the clicked account container
            const accountContainer = event.target.closest('.account-container');

            if (accountContainer) {
              // Extract the username of the clicked user
              const username = accountContainer.dataset.username;

              // Navigate to the clicked user's profile page
              window.location.href = username;
            }

            break;

          case 'BUTTON':
            // Get the clicked button
            const btnClicked = event.target.closest('.add-friend');

            if (btnClicked) {
              // Extract the username of the clicked user
              const username = btnClicked.parentElement.parentElement.dataset.username;

              // Disable the button to prevent multiple clicks
              btnClicked.disabled = true;

              // Send a friend request to the clicked user
              addFriend(btnClicked, username);
            }

            // Get accept friend request button
            const acceptFriendRequestBtn = event.target.closest('.accept-friendship');
            if (acceptFriendRequestBtn) {
              // Extract the username of the clicked user
              const username = acceptFriendRequestBtn.parentElement.parentElement.dataset.username;

              // Accept the friend request from the clicked user
              acceptFriendRequest(acceptFriendRequestBtn, username);
            }

            // Get remove friend button
            const removeFriendBtn = event.target.closest('.remove-friend');
            if (removeFriendBtn) {
              // Extract the username of the clicked user
              const username = removeFriendBtn.parentElement.parentElement.dataset.username;

              // Remove the clicked user from the user's friend list
              removeFriend(removeFriendBtn, username);
            }

            break;
        }

      });
    })
}

// This function handles the click event of the "View Pending Friends" button
const viewPendingFriendsClickHandler = () => {
  // Get the button element
  const btn = document.querySelector('.view-friends');

  // Remove the event listener for this button
  btn.removeEventListener('click', viewPendingFriendsClickHandler);

  // Replace the CSS class of the button to reflect that we are now viewing pending friends
  btn.classList.replace('view-friends', 'view-pending-friends');

  // Change the text of the button to reflect that we are now viewing pending friends
  btn.innerHTML = 'View Friends';

  // Add an event listener to the button that will fetch the user's list of friends
  btn.addEventListener('click', fetchFriends);

  // Change the title of the modal to reflect that we are now viewing pending friends
  document.querySelectorAll('.modal-page-title').forEach((title) => {
    title.innerHTML = 'Pending Friends';
  });

  // Fetch the user's list of pending friends
  fetchPendingFriends();
}

// This function adds a load event listener to the friends container
const friendsContainerLoadHandler = () => {
  document.querySelector('.friends-container').addEventListener(
    'load',
    (event) => {
      // If the event target is an image, remove the skeleton class from it
      if (event.target.tagName === 'IMG') {
        const img = event.target;
        img.classList.remove('skeleton');
      }
    },
    true
  );
}

// This function adds a load event listener to the suggested friends container
const suggestedFriendsContainerLoadHandler = () => {
  document.querySelector('.suggested-friends-container').addEventListener(
    'load',
    (event) => {
      // If the event target is an image, remove the skeleton class from it
      if (event.target.tagName === 'IMG') {
        const img = event.target;
        img.classList.remove('skeleton');
      }
    },
    true
  );
}

// FETCH DATA
const fetchSuggestedFriends = () => {
  fetch('/use-logged-in-user/friends/new')
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('Failed to fetch friends, check your internet connection and try again later.');
      }
      return response.json();
    })
    .then(({ suggested_friends }) => {
      // Render the suggested friends list
      renderUserList(suggested_friends, 'suggestions', 'suggested-friends-container');
    })
    .catch((error) => errorHandler('suggested-friends-container', error));
}

const fetchFriends = () => {
  fetch(`/friends/${username}`)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('Failed to fetch friends, check your internet connection and try again later.');
      }
      return response.json();
    })
    .then(({ friends }) => {
      if (friends.length !== 0) {
        // Check if the user is authenticated
        fetch(`/is-user-authenticated/${username}`)
          .then((response) => {
            // Render the friends list with the appropriate view depending on the user's authentication status
            if (response.status === 200) {
              renderUserList(friends, 'viewFriends', 'friends-main-content');
            } else {
              renderUserList(friends, '', 'friends-main-content');
            }
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        // If the user has no friends, render an empty message
        renderEmptyContentMessage(
          'You don\'t have any friends yet. Try finding new friends.'
        );
      }
    })
    .catch((error) => errorHandler('friends-main-content', error));

  // Update the button to view pending friends
  const btn = document.querySelector('.view-pending-friends');
  if (btn) {
    btn.removeEventListener('click', fetchFriends);
    btn.classList.replace('view-pending-friends', 'view-friends');
    btn.innerHTML = 'View Pending Friends';
    btn.addEventListener('click', viewPendingFriendsClickHandler);
  }

  // Change the title of the modal
  document.querySelectorAll('.modal-page-title').forEach((title) => {
    title.innerHTML = 'Friends';
  });
}

const fetchPendingFriends = () => {
  fetch(`/pending-friends/${username}`)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('Failed to fetch pending friends, check your internet connection and try again later.');
      }
      return response.json();
    })
    .then(({ receivers, requesters }) => {
      if ([...receivers, ...requesters].length !== 0) {
        // Render the list of friend request receivers and senders

        // Check if user is authenticated
        fetch(`/is-user-authenticated/${username}`)
          .then((response) => {
            if (response.status === 200) {
              renderUserList(receivers, 'friendRequestReceivers', 'friends-main-content');
              renderUserList(requesters, 'friendRequestSenders', 'friends-main-content', true);
            } else {
              renderUserList(receivers, '', 'friends-main-content');
              renderUserList(requesters, '', 'friends-main-content', true);
            }
          })
          .catch((error) => console.error(error));
      } else {
        // If the user has no pending friends, render an empty message
        renderEmptyContentMessage(
          'You don\'t have any pending friends yet. Try finding new friends.'
        );
      }
    })
    .catch((error) => errorHandler('friends-main-content', error));
}


// POST DATA
// Function to add a friend
const addFriend = (btn, username) => {
  // Get the CSRF token from the input field
  const csrfToken = document.querySelector(
    'input[name="csrfmiddlewaretoken"]'
  ).value;

  // Send a POST request to add the friend to the user's friend list
  fetch('/add/friend', {
    method: 'POST',
    body: JSON.stringify({ username: username }),
    headers: {
      'X-CSRFToken': csrfToken,
    },
  })
    .then((response) => {
      // If the request is successful, update the button text
      if (response.status === 200) {
        btn.innerHTML = 'Request Sent';
        // Update recommendation score
        updateScore('add_new_friend', 'person', null, username);
      }
    })
    .catch((error) => {
      // If there's an error, re-enable the button and log the error to the console
      btn.disabled = false;
      console.error(error);
    })
}

// Function to accept a friend request
const acceptFriendRequest = (btn, username) => {
  // Disable the button and change the text to indicate that the request is being processed
  btn.disabled = true;
  btn.innerHTML = 'Adding Friend';

  // Get the CSRF token from the input field
  const csrfToken = document.querySelector(
    'input[name="csrfmiddlewaretoken"]'
  ).value;

  // Send a POST request to accept the friend request
  fetch('/friend-request/accept', {
    method: 'POST',
    body: JSON.stringify({ username: username }),
    headers: {
      'X-CSRFToken': csrfToken,
    },
  })
    .then((response) => {
      // If the request is successful, update the button text and class, and re-enable the button
      if (response.status !== 200) {
        throw new Error('Accepting Request Failed. Try again later');
      }

      setTimeout(() => {
        btn.innerHTML = 'Remove Friend';
        btn.classList.replace('accept-friendship', 'remove-friend');
        btn.disabled = false;

        // Increment the friends count and update the text
        const friendsCount = document.querySelector('.friends-count');
        friendsCount.textContent = parseInt(friendsCount.textContent) + 1;

        if (parseInt(friendsCount.textContent) === 1) {
          document.querySelector('.friends-text').innerHTML = 'friend';
        } else {
          document.querySelector('.friends-text').innerHTML = 'friends';
        }

      }, 3000);

      // Update recommendation score
      updateScore('add_new_friend', 'person', null, username);
    })
    .catch((error) => {
      // If there's an error, log it to the console
      console.error(error);
    });
}

// Function to remove a friend
const removeFriend = (btn, username) => {
  // Disable the button and change the text to indicate that the request is being processed
  btn.disabled = true;
  btn.innerHTML = 'Removing Friend';

  // Get the CSRF token from the input field
  const csrfToken = document.querySelector(
    'input[name="csrfmiddlewaretoken"]'
  ).value;

  // Send a POST request to remove the friend from the user's friend list
  fetch('/friend/remove', {
    method: 'POST',
    body: JSON.stringify({ username: username }),
    headers: {
      'X-CSRFToken': csrfToken,
    },
  })
    .then((response) => {
      // If the request is successful, update the button text and class, and re-enable the button
      if (response.status !== 200) {
        throw new Error('Removing Friend Failed. Try again later');
      }

      setTimeout(() => {
        btn.innerHTML = 'Add Friend';
        btn.classList.replace('remove-friend', 'add-friend');
        // Enable button
        btn.disabled = false;

        // Decrement the friends count
        const friendsCount = document.querySelector('.friends-count');
        friendsCount.textContent = parseInt(friendsCount.textContent) - 1;

        if (parseInt(friendsCount.textContent) === 1) {
          document.querySelector('.friends-text').innerHTML = 'friend';
        }
        else {
          document.querySelector('.friends-text').innerHTML = 'friends';
        }
      }, 3000);
    })
    .catch((error) => {
      console.error(error);
    });
}

// RENDER DATA
const renderUserList = (userData, listType, listContainerClassName, append = false) => {
  let buttonHtml;
  switch (listType) {
    case 'suggestions':
      buttonHtml = `<button class='btn btn-primary btn-small add-friend'>Add Friend</button>`;
      break;

    case 'viewFriends':
      buttonHtml = `<button class='btn btn-primary btn-small remove-friend'>Remove Friend</button>`;
      break;

    case 'friendRequestSenders':
      buttonHtml = `<button class='btn btn-primary btn-small accept-friendship'>Accept Request</button>`;
      break;

    case 'friendRequestReceivers':
      buttonHtml = `<button class='btn btn-primary btn-small disabled'>Request Sent</button>`;
      break;

    default:
      buttonHtml = '';
      break;
  }

  // If not appending to existing container, clear the container first
  if (!append) {
    document.querySelector(`.${listContainerClassName}`).innerHTML = '';
  }

  // Append the new user data to the container
  document.querySelector(`.${listContainerClassName}`).innerHTML += `
    ${userData.map((user) => `
    <div class='account-container d-flex justify-content-between align-items-center p-2' data-username='${user.username}'>
      <div class='d-flex'>
        <img class='skeleton profile-img' src='${user.image}'>
        <div class='ms-1'>
          <div class='font-body-tiny'>@${user.username}</div>
          <div class='font-body'>${user.fullName}</div>
        </div>
      </div>
      <div class='btn-container'>${buttonHtml}</div>
    </div>
    `).join('')}
  `
}

const renderEmptyContentMessage = (message) => {
  // Clear the main content container and show a message with an illustration and button to suggest friends
  document.querySelector('.friends-main-content').innerHTML = `
    <div class='empty-content-msg'>
      <img class='illustration text-center' src='static/invite/images/illustrations/no_messages.gif' alt='Nothing here by Icons8'>
      <div class='message text-center mb-2'>${message}</div>
      <button class='btn btn-primary friends-btn' onclick=showSuggestedFriends()>Find Friends</button>
    </div>
  `
}

const username = window.location.pathname.split('/')[1];
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-icon-wrapper-lg').forEach((icon) => {
    icon.classList.remove('selected');
  });

  fetchCount(username);
  fetchBio(username);
  fetchProfileImage(username);

  const loginBtn = document.querySelector('.login-btn');
  const registerBtn = document.querySelector('.register-btn');

  if (loginBtn && registerBtn) {
    loginBtn.addEventListener('click', () => {
      window.location.href = '/login';
    });

    registerBtn.addEventListener('click', () => {
      window.location.href = '/register';
    });
  }

  const followBtn = document.querySelector('.follow-btn');
  if (followBtn) {
    followBtn.addEventListener('click', followHandler);
  }

  const unfollowBtn = document.querySelector('.unfollow-btn');
  if (unfollowBtn) {
    unfollowBtn.addEventListener('click', unfollowHandler);
  }

  const buttonsWrapper = document.querySelector('.buttons-wrapper');
  if (buttonsWrapper) {
    buttonsWrapper.addEventListener('click', (event) => {
      const elClicked = event.target;

      if (elClicked.classList.contains('add-friend')) {
        elClicked.disabled = true;
        addFriend(elClicked, username);
      }

      if (elClicked.classList.contains('accept-friendship')) {
        acceptFriendRequest(elClicked, username);
      }

      if (elClicked.classList.contains('remove-friend')) {
        removeFriend(elClicked, username);
      }
    });

    // Convince the user to register/login if they are not logged in
    const convinceUserBtn = document.querySelectorAll('.convince-register');
    if (convinceUserBtn.length !== 0) {
      convinceUserBtn.forEach((btn) => {
        btn.addEventListener('click', () => {
          notLoggedIn();
        })
      })
    }
  }

  document.querySelector('.following-wrapper').addEventListener('click', () => {
    displayFollowingUsers();
  });

  document.querySelector('.followers-wrapper').addEventListener('click', () => {
    displayFollowers();
  });

  getPosts();
});

// Get user's posts
const getPosts = () => {
  const username = window.location.pathname.replace('/', '');
  console.log(username);
  fetch(`events/get?username=${username}&events_for=profile`)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('Couldn\'t fetch posts. Try reloading the page and if this persist, contact support.');
      }
      return response.json();
    })
    .then(({ events }) => {
      renderProfileEvents(events);
    })
    .catch((error) => console.error(error));
}

const renderCoverImage = (image) => {
  return image ? `
    <div class='post-img-wrapper me-2'>
      <img class='h-100' class='skeleton'
      src='${image}' alt='Event Image' />
    </div>` : '';
}

const renderProfileEvents = (events) => {
  document.querySelector('.events-list').innerHTML += `
    ${events.map((event) => `
      <div class='d-flex align-items-center justify-content-between border-bottom border-dark event-post'>
          <div class='overflow-hidden'>
            <div class='d-flex align-items-center mb-2'>
              ${renderCoverImage(event.cover)}
              <span class='font-title'>${event.title}</span>
            </div>
            <div class='d-flex justify-content-between align-items-center'>
              <p class='font-body'>
                ${event.description}
              </p>
            </div>
            <small class='d-flex align-items-center'>
              <i class='bi bi-clock'></i>
              <span class='ms-1'>${formattedDateTime(event.timestamp)}</span>
            </small>
          </div>
          <i class='bi bi-three-dots-vertical'></i>
        </div>`
  ).join('')}
  `
}

const countGroupDisplay = () => {
  const container = document.createElement('div');
  container.className = 'count-group-container';

  container.innerHTML = `
    <div class='skeleton skeleton-card'></div>
    <div class='skeleton skeleton-card'></div>
  `;

  return container;
};

const displayFollowingUsers = () => {
  addToMainModalHistory('Following', countGroupDisplay, [
    { func: fetchFollowingUsers, values: [] }
  ]);
};

const displayFollowers = () => {
  addToMainModalHistory('Followers', countGroupDisplay, [
    { func: fetchFollowers, values: [] }
  ]);
}

const fetchCount = (username) => {
  fetch(`profile/count/${username}`)
    .then((response) => response.json())
    .then((data) => {
      document.querySelector('.followers-count').textContent =
        data.followersCount;
      document.querySelector('.following-count').textContent =
        data.followingCount;
      document.querySelector('.friends-count').textContent = data.friendsCount;

      if (data.followersCount === 1) {
        document.querySelector('.followers-text').textContent = 'follower';
      }

      if (data.friendsCount === 1) {
        document.querySelector('.friends-text').textContent = 'friend';
      }

      document.querySelectorAll('.count').forEach((element) => {
        element.classList.remove('skeleton', 'skeleton-text');
      });
    });
};

const fetchBio = (username) => {
  fetch(`/bio/${username}`)
    .then((response) => response.json())
    .then((data) => {
      document.querySelector('.bio').textContent = data.bio;
    });
};

const fetchProfileImage = (username) => {
  fetch(`/profile_image/${username}`)
    .then((response) => response.json())
    .then((data) => {
      const img = document.querySelector('.profile-img');
      img.src = data.imagePath;
      img.addEventListener('load', () => img.classList.remove('skeleton'));
    });
};

const removeError = () => {
  document.querySelector('.display-error').textContent = '';
};

const followUser = (username) => {
  fetch(`follow/${username}`)
    .then((response) => {
      if (response.status === 200) {
        const followersCount = document.querySelector('.followers-count');
        followersCount.textContent = parseInt(followersCount.textContent) + 1;

        // Toggle between 'follower' and 'followers'
        if (parseInt(followersCount.textContent) === 1) {
          document.querySelector('.followers-text').textContent = 'follower';
        } else {
          document.querySelector('.followers-text').textContent = 'followers';
        }

        const followBtn = document.querySelector('.follow-btn');
        followBtn.textContent = 'Unfollow';
        followBtn.classList.replace('btn-secondary', 'btn-secondary-outline');
        followBtn.classList.replace('follow-btn', 'unfollow-btn');

        // Remove event handler
        followBtn.removeEventListener('click', followHandler);

        // Add new event handler
        followBtn.addEventListener('click', unfollowHandler);

        // Update recommendation score
        updateScore('new_follow', 'person', null, username);
      } else {
        throw new Error('Request Failed, try again later!');
      }
    })
    .catch((error) => {
      document.querySelector('.display-error').textContent = error;
      setTimeout(removeError, 60000);
    });
};

const unfollowUser = (username) => {
  fetch(`unfollow/${username}`)
    .then((response) => {
      if (response.status === 200) {
        const followersCount = document.querySelector('.followers-count');
        followersCount.textContent = parseInt(followersCount.textContent) - 1;

        // Toggle between 'follower' and 'followers'
        if (parseInt(followersCount.textContent) === 1) {
          document.querySelector('.followers-text').textContent = 'follower';
        } else {
          document.querySelector('.followers-text').textContent = 'followers';
        }

        const unfollowBtn = document.querySelector('.unfollow-btn');
        unfollowBtn.textContent = 'Follow';
        unfollowBtn.classList.replace('btn-secondary-outline', 'btn-secondary');
        unfollowBtn.classList.replace('unfollow-btn', 'follow-btn');

        // Remove event handler
        unfollowBtn.removeEventListener('click', unfollowHandler);

        // Add new event handler
        unfollowBtn.addEventListener('click', followHandler);
      } else {
        throw new Error('Request Failed, try again later!');
      }
    })
    .catch((error) => {
      document.querySelector('.display-error').textContent = error;
      setTimeout(removeError, 60000);
    });
};

const followHandler = () => followUser(username);
const unfollowHandler = () => unfollowUser(username);


// FETCH FOLLOWING USER'S DATA
const clickEventHandlerInsideCountGroup = (btnClass, btnClickHandler) => {

  // Select the container element with the class 'count-group-container'
  const countGroupContainer = document.querySelector('.count-group-container');

  // Add an event listener for clicks to the container element
  countGroupContainer.addEventListener('click', (event) => {

    // Check if the clicked element is a button with the specified class
    if (event.target.tagName === 'BUTTON') {
      const button = event.target.closest(`.${btnClass}`);

      // If a matching button is found, execute the function passed in as a parameter
      if (button) {
        btnClickHandler(button);

        // If the button is a 'follow' button, remove the 'follow-btn-sm' class
        if (btnClass === 'follow-btn-sm') {
          button.classList.remove(btnClass);
        }
      }
    }

    // Check if the clicked element is a container element for a user account
    if (event.target.tagName === 'DIV') {
      const container = event.target.closest('.account-container');

      // If a matching container is found, navigate to the user's profile page
      if (container) {
        const username = container.dataset.username;
        window.location.href = `/${username}`;
      }
    }
  });
}

const displayError = (error) => {
  const errorWrapper = document.createElement('div');
  errorWrapper.className = 'display-error';
  errorWrapper.textContent = error;

  const countGroupContainer = document.querySelector('.count-group-container');
  countGroupContainer.innerHTML = '';
  countGroupContainer.append(errorWrapper);

  console.error(error);
}

const renderUserData = (data) => {
  // Get the element where the user data will be rendered
  document.querySelector('.count-group-container').innerHTML = `
    ${data.map((user) => `
      <div class='account-container d-flex justify-content-between align-items-center p-2' data-username='${user.username}'>
        <div class='d-flex'>
          <img class='skeleton profile-img' src='${user.image}'>
          <div class='ms-1'>
            <div class='font-body-tiny'>@${user.username}</div>
            <div class='font-body'>${user.fullName}</div>
          </div>
        </div>
        <div class='btn-container'>
        </div>
      </div>
    `).join('')}
  `;

  // Add event listener to remove 'skeleton' when the image is loaded
  document.querySelector('.count-group-container').addEventListener('load', (event) => {
    if (event.target.tagName === 'IMG') {
      const img = event.target;
      img.classList.remove('skeleton');
    }
  }, true);
}

const toggleFollowStatusForUser = (action, btn, username, newTextContentAfterFollowAction = 'Unfollow') => {
  // Disable the button while the follow/unfollow request is being made
  btn.setAttribute('disabled', true);
  let initialClassToken;
  let newClassToken;

  if (action === 'follow') {
    // If the action is to follow the user, set the initial and new class tokens accordingly
    initialClassToken = 'btn-primary';
    newClassToken = 'btn-primary-outline';
  } else {
    // Otherwise, if the action is to unfollow the user, swap the initial and new class tokens
    initialClassToken = 'btn-primary-outline';
    newClassToken = 'btn-primary';
  }

  // Make a request to the follow/unfollow API endpoint for the specified user
  fetch(`/${action}/${username}`)
    .then((response) => {
      if (response.status === 200) {
        // If the request is successful, update the button's text content and class to reflect the new follow/unfollow status
        btn.textContent = action === 'follow' ? newTextContentAfterFollowAction : 'Follow';

        // Increase/Decrease the following count
        const followingCount = document.querySelector('.following-count');
        if (followingCount) {
          if (action === 'follow') {
            followingCount.textContent = parseInt(followingCount.textContent) + 1;
          } else {
            followingCount.textContent = parseInt(followingCount.textContent) - 1;
          }
        }

        btn.classList.replace(initialClassToken, newClassToken);
      } else {
        // If the request fails, throw an error
        throw new Error('Request Failed! Please try again later');
      }
    })
    .catch((error) => {
      // If there is an error, display an alert and log the error to the console
      alert(error);
      console.error(error);
    });

  // Re-enable the button after the request has completed
  btn.removeAttribute('disabled');
};


const fetchFollowingUsers = () => {
  // Send a request to the server to get the list of users that the current user is following
  fetch(`/get/followings/${username}`)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('Request Failed, try again later');
      }
      return response.json();
    })
    .then(({ users }) => {
      // Render the list of following users
      renderUserData(users);

      // If the user is authenticated, update the follow buttons to show "Unfollow" instead of "Follow"
      fetch(`is-user-authenticated/${username}`)
        .then((response) => {
          if (response.status === 200) {
            document.querySelectorAll('.btn-container').forEach((el) => {
              el.innerHTML = `
                <button class='btn btn-primary-outline btn-small unfollow-btn-sm'>Unfollow</button>
              `
            });
          }
        });

      // Add a click event handler to each "Unfollow" button
      const buttonClickedEventHandler = (btn) => {
        const username = btn.parentElement.parentElement.dataset.username;
        btn.textContent === 'Unfollow'
          ? toggleFollowStatusForUser('unfollow', btn, username)
          : toggleFollowStatusForUser('follow', btn, username);
      }

      clickEventHandlerInsideCountGroup('unfollow-btn-sm', buttonClickedEventHandler);
    })
    .catch((error) => {
      displayError(error);
    });
}

// FETCH FOLLOWERS USER'S DATA

// Function to fetch the followers of the user
const fetchFollowers = () => {
  // Send a GET request to the server to get the followers of the user with the given username
  fetch(`/get/followers/${username}`)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('Request Failed, try again later');
      }
      return response.json();
    })
    .then(({ users }) => {
      // Render the data of the followers
      renderUserData(users);

      // Check if the current user is authenticated, and if they are, update the follow buttons for the followers
      fetch(`is-user-authenticated/${username}`)
        .then((response) => {
          if (response.status === 200) {
            // Iterate over all the follow buttons and update them based on whether the user is already following the follower or not
            document.querySelectorAll('.btn-container').forEach((el) => {
              const username = el.parentElement.dataset.username;
              fetch(`/check/is-user-following/${username}`)
                .then((response) => response.json())
                .then(({ answer }) => {
                  const btn = answer === 'YES'
                    ? `<button class='btn btn-secondary-outline btn-small'>Following</button>`
                    : `<button class='btn btn-primary btn-small follow-btn-sm'>Follow Back</button>`;
                  el.innerHTML = btn;
                })
                .catch((error) => console.error(error));
            })
          }
        });

      // Add click event listener to the follow buttons for each follower
      const buttonClickedEventHandler = (btn) => {
        const username = btn.parentElement.parentElement.dataset.username;
        toggleFollowStatusForUser('follow', btn, username, 'Following');
      }

      clickEventHandlerInsideCountGroup('follow-btn-sm', buttonClickedEventHandler);
    })
    .catch((error) => {
      // Display an error message on the screen
      displayError(error);
    });
};

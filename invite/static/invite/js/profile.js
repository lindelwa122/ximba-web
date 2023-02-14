const username = window.location.pathname.split('/')[1];

document.addEventListener('DOMContentLoaded', () => {
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

  document.querySelector('.following-wrapper').addEventListener('click', () => {
    displayFollowingUsers();
    fetchFollowingUsers();
  });
});

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
  addToMainModalHistory('Following', countGroupDisplay, '10px');
};

const fetchFollowingUsers = () => {
  fetch(`/get/followings/${username}`)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('Request Failed, try again later');
      }
      return response.json();
    })
    .then((data) => {
      document.querySelector('.count-group-container').innerHTML = '';

      for (let user of data.users) {
        document.querySelector('.count-group-container').innerHTML += `
          <div class='account-container d-flex justify-content-between align-items-center p-2' data-username='${user.username}'>
            <div class='d-flex'>
              <img class='skeleton profile-img' src='${user.image}'>
              <div class='ms-1'>
                <div class='font-body-tiny'>@${user.username}</div>
                <div class='font-body'>${user.fullName}</div>
              </div>
            </div>
            <div>
              <button class='btn btn-primary-outline btn-small unfollow-btn-sm'}>Unfollow</button>
            </div>
          </div>
        `;
      }

      // When the small button inside modal is clicked
      document.querySelectorAll('.unfollow-btn-sm').forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.stopPropagation();

          const username = btn.parentElement.parentElement.dataset.username;

          if (btn.textContent === 'Unfollow') {
            btn.disabled = true;

            fetch(`/unfollow/${username}`).then((response) => {
              if (response.status === 200) {
                btn.textContent = 'Follow';
                btn.classList.replace('btn-primary-outline', 'btn-primary');
              }
              btn.disabled = false;
            });
          } else {
            btn.disabled = true;

            fetch(`/follow/${username}`).then((response) => {
              if (response.status === 200) {
                btn.textContent = 'Unfollow';
                btn.classList.replace('btn-primary', 'btn-primary-outline');
              }
              btn.disabled = false;
            });
          }
        });
      });

      // Add click event listener (route to user's profile)
      document.querySelectorAll('.account-container').forEach((container) => {
        const username = container.dataset.username;
        container.addEventListener('click', () => {
          window.location.href = `/${username}`;
        });
      });

      document.querySelectorAll('img').forEach((img) => {
        img.addEventListener('load', () => {
          img.classList.remove('skeleton');
        });
      });
    })
    .catch((error) => {
      const errorWrapper = document.createElement('div');
      errorWrapper.className = 'display-error';
      errorWrapper.textContent = error;
      document.querySelector('.count-group-container').innerHTML = '';
      document.querySelector('.count-group-container').append(errorWrapper);
    });
};

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
        document.querySelector('.followers-text').textContent = 'friend';
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

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
});

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
}

const followUser = (username) => {
  fetch(`follow/${username}`)
    .then((response) => {
      if (response.status === 200) {
        const followersCount = document.querySelector('.followers-count');
        followersCount.textContent = parseInt(followersCount.textContent) + 1;
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
}

const unfollowUser = (username) => {
  fetch(`unfollow/${username}`)
    .then((response) => {
      if (response.status === 200) {
        const followersCount = document.querySelector('.followers-count');
        followersCount.textContent = parseInt(followersCount.textContent) - 1;
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
}

const followHandler = () => followUser(username);
const unfollowHandler = () => unfollowUser(username);
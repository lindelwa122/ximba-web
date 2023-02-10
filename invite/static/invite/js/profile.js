document.addEventListener('DOMContentLoaded', () => {
  const username = window.location.pathname.split('/')[1];
  fetchCount(username);
  fetchBio(username);
  fetchProfileImage(username);

  // Prevent JS from stop execution when '.login-btn' or '.register-btn' is null
  try {
    document.querySelector('.login-btn').addEventListener('click', () => {
      window.location.href = '/login';
    });
  
    document.querySelector('.register-btn').addEventListener('click', () => {
      window.location.href = '/register';
    });
  } catch (error) {
    document.querySelector('.follow-btn').addEventListener('click', () => {
      followBtn(username);
    })
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

const followBtn = (username) => {
  fetch(`follow/${username}`)
    .then((response) => {
      if (response.status === 200) {
        const followersCount = document.querySelector('.followers-count');
        followersCount.textContent = parseInt(followersCount.textContent) + 1;
        document.querySelector('.follow-btn').textContent = 'Unfollow';
        document.querySelector('.follow-btn').classList.replace('btn-secondary', 'btn-secondary-outline');
        document.querySelector('.follow-btn').classList.replace('follow-btn', 'unfollow-btn');
      } else {
        throw new Error('Request Failed, try again later!');
      }
    })
    .catch((error) => {
      document.querySelector('.display-error').textContent = error;
      setTimeout(removeError, 60000);
    });
}

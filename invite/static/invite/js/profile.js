document.addEventListener('DOMContentLoaded', () => {
  fetchCount();
  fetchBio();
  fetchProfileImage();
});

const fetchCount = () => {
  fetch(`profile/count`)
    .then((response) => response.json())
    .then((data) => {
      document.querySelector('.followers-count').textContent =
        data.followersCount;
      document.querySelector('.following-count').textContent =
        data.followingCount;
      document.querySelector('.friends-count').textContent = data.friendsCount;
      document.querySelectorAll('.count').forEach((element) => {
        element.classList.remove('skeleton', 'skeleton-text');
      });
    });
};

const fetchBio = () => {
  const username = window.location.pathname.split('/')[1];
  fetch(`/bio/${username}`)
    .then((response) => response.json())
    .then((data) => {
      document.querySelector('.bio').textContent = data.bio;
    });
};

const fetchProfileImage = () => {
  const username = window.location.pathname.split('/')[1];
  fetch(`/profile_image/${username}`)
    .then((response) => response.json())
    .then((data) => {
      const img = document.querySelector('.profile-img');
      img.src = data.imagePath;
      img.addEventListener('load', () => img.classList.remove('skeleton'));
    });
};

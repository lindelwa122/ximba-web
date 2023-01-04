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
  fetch(`/bio`)
    .then((response) => response.json())
    .then((data) => {
      document.querySelector('.bio').textContent = data.bio;
    });
};

const fetchProfileImage = () => {
  fetch(`/profile_image`)
    .then((response) => response.json())
    .then((data) => {
      document.querySelector('.profile-img').src = data.imagePath;
    });
};

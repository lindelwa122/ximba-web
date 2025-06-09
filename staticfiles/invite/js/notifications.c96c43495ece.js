document.querySelectorAll('.notification').forEach((el) => {
  el.addEventListener('click', async () => {
    // Check if the user is logged in
    const answer = await userLogStatus()

    if (answer === 'NO') {
      notLoggedIn();
      return false;
    }

    document.querySelectorAll('.nav-icon-wrapper-lg').forEach((icon) => {
      icon.classList.remove('selected');
    });

    document.querySelector('.notification').classList.add('selected');

    addToMainModalHistory('Notifications', () => {
      const container = document.createElement('div');
      container.className = 'notifications-container';
      return container;
    });

    fetchNotifications();
    notificationsContainerLoadHandler();
    notificationsContainerClickHandler();
  });
});

const notificationsType = {
  friend_request: 'sent you a friend request',
  new_follower: 'started following you',
};

const notificationsContainerLoadHandler = () => {
  document.querySelector('.notifications-container').addEventListener(
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

const fetchNotifications = () => {
  fetch('/notifications')
    .then((response) => {
      if (response.status !== 200) {
        throw new Error("Couldn't fetch notifications try again later");
      }
      return response.json();
    })
    .then(({ notifications }) => {
      renderNotifications(notifications);

      document.querySelectorAll('.btn-container').forEach((el) => {
        const username = el.parentElement.dataset.username;

        fetch(`/check/friendship/${username}`)
          .then((response) => {
            if (response.status === 200) {
              throw new Error(
                `Could\'t check friendship between the logged in user and ${username}`
              );
            }
            return response.json();
          })
          .then(({ answer }) => {
            const btn =
              answer === 'YES'
                ? `<button class='btn btn-secondary-outline btn-small disabled'>Friends</button>`
                : `<button class='btn btn-primary btn-small follow-btn-sm accept-btn'>Accept</button>`;
            el.innerHTML = btn;
          })
          .catch((error) => console.error(error));
      });
    })
    .catch((error) => console.error(error));
};

const renderNotifications = (data) => {
  document.querySelector('.notifications-container').innerHTML = `
    ${data
      .map(
        (user) => `
      <div class='account-container d-flex justify-content-between align-items-center p-2' data-username='${
        user.origin
      }'>
      <div class='d-flex'>
        <img class='skeleton profile-img' src='${user.image}'>
        <div class='ms-1'>
          <div class='font-body-tiny'>@${user.origin}</div>
          <div class='font-body'>${notificationsType[user.type]}</div>
        </div>
      </div>
      <div class='btn-container'>
      </div>
    </div>
    `
      )
      .join('')}
  `;
};

const notificationsContainerClickHandler = () => {
  document
    .querySelector('.notifications-container')
    .addEventListener('click', (event) => {
      switch (event.target.tagName) {
        case 'DIV':
          // Get the clicked account container
          const accountContainer = event.target.closest('.account-container');

          if (accountContainer) {
            const username = accountContainer.dataset.username;
            window.location.href = username;
          }

          break;

        case 'BUTTON':
          // Get the clicked button
          const btnClicked = event.target.closest('.btn');

          if (btnClicked) {
            const username = btnClicked.parentElement.dataset.username;
            btnClicked.disabled = true;
            addFriend(btnClicked, username);
          }

          break;
      }
    });
};
document.addEventListener('DOMContentLoaded', () => {
  // Calls function to update the push notification on the top of the page
  updateTopPushNotification();

  // Highlights the 'View Profile' button in the navigation bar if the user is authenticated
  highlightViewProfileButtonIfAuthenticated();

  // Sets up event listener for the navigation controller for small devices
  document.querySelector('.nav-controller').addEventListener('click', () => {
    // Runs rotation animation on navigation controller
    rotateAnimation('sm');

    // Hides all navigation icons in the navigation bar for small devices and sets their width to 0
    document.querySelectorAll('.nav-icon-wrapper').forEach((el) => {
      el.classList.add('hide');
      el.classList.remove('show');
      el.style.width = 0;
    });

    // Runs shrink/expand animation on the navigation bar for small devices
    shrinkExpandAnimation();

    // When the animation ends and the navigation bar is expanded, shows all navigation icons and sets their width to 40px
    const navSm = document.querySelector('.nav-sm');
    navSm.addEventListener('animationend', () => {
      if (navSm.classList.contains('expand')) {
        document.querySelectorAll('.nav-icon-wrapper').forEach((el) => {
          el.classList.add('show');
          el.classList.remove('hide');
          el.style.width = '40px';
        });
      }
    });
  });

  // Sets up event listener for all 'View Profile' buttons
  document.querySelectorAll('.view-profile-btn').forEach((el) => {
    el.addEventListener('click', async () => {
      // Check if the user is logged in
      const answer = await userLogStatus()

      if (answer === 'NO') {
        notLoggedIn();
        return false;
      }

      // Fetches the username of the currently logged-in user and redirects to their profile page
      fetch('/get-username')
        .then((response) => response.json())
        .then(({ username }) => {
          window.location.href = `/${username}`;
        })
        .catch((error) => console.error(error));
    });
  });

  // Sets up event listener for all 'Home' buttons
  document.querySelectorAll('.home').forEach((el) => {
    el.addEventListener('click', () => (window.location.href = '/home'));
  });

  // Sets up event listener for all 'Add New Event' buttons
  document.querySelectorAll('.add-new-event').forEach((el) => {
    el.addEventListener('click', async () => {
      // Check if the user is logged in
      const answer = await userLogStatus()

      if (answer === 'NO') {
        notLoggedIn();
        return false;
      }

      window.location.href = '/new-event';
    });
  });

  // Sets up event listener for all 'Menu' buttons
  document.querySelectorAll('.menu-view').forEach((el) => {
    el.addEventListener('click', viewMenu);
  });
});

const viewMenu = () => {
  addToMainModalHistory('Menu', () => {
    const container = document.createElement('div');
    container.classList.add('menu-container');

    container.innerHTML = `
      <div class='border-bottom border-dark calendar'>Calendar</div>
      <div class='border-bottom border-dark scan-tickets'>Scan Tickets</div>
      <div class='border-bottom border-dark wallet'>Wallet</div>
    `;

    return container;
  }, [{ func: menuClickHandler, values: []}])
}

const menuClickHandler = () => {
  document.querySelector('.calendar').addEventListener('click', () => {
    window.location.href = '/calendar';
  });

  document.querySelector('.wallet').addEventListener('click', () => {
    window.location.href = '/wallet';
  });

  document.querySelector('.scan-tickets').addEventListener('click', () => {
    addToMainModalHistory('Scan Tickets', () => {
      const container = document.createElement('div');

      container.innerHTML = `
        <form class='event-id-form'>
          <div class='form-floating mb-3'>
            <input type='text' class='event-id form-control input-frame' placeholder='Event ID'>
            <label for='event-id' class='floating-input-placeholder'>Event ID</label>
          </div>
          <div class='error-message mb-3'></div>
          <button class='btn btn-primary submit-event-id w-100'>Scan Tickets</button>
        </form>
      `;

      return container;
    }, [{ func: getTicketScannerReady, values: [] }]);
  });
};

const getTicketScannerReady = () => {
  document.querySelector('.event-id-form').addEventListener('submit', (event) => {
    event.preventDefault();

    const eventIdentifier = document.querySelector('.event-id').value;
    const errorMessage = document.querySelector('.error-message');
    errorMessage.textContent = '';

    if (!eventIdentifier) {
      errorMessage.textContent = 'Please ensure ticket ID is not empty';
      return false;
    }

    window.location.href = `/scan-tickets/${eventIdentifier}`;
  })
}

// ANIMATION

// Hides the navigation icons one by one with a delay
const hideIconsAnimations = (wrappers) => {
  const reversedIconsWrappers = Array.prototype.slice.call(wrappers).reverse();

  reversedIconsWrappers.forEach((el, index) => {
    setTimeout(() => {
      el.classList.remove('show');
      el.classList.add('hide');
    }, (index + 1) * 90); // calculate delay based on index
  });
};

// Rotates the navigation controller button
const rotateAnimation = (device) => {
  const navController =
    device === 'sm'
      ? document.querySelector('.nav-controller')
      : document.querySelector('.nav-controller-lg');

  if (navController.classList.contains('rotate')) {
    navController.classList.remove('rotate');
    navController.classList.add('rotate-back');
  } else {
    navController.classList.remove('rotate-back');
    navController.classList.add('rotate');
  }
};

// Shows the navigation icons one by one with a delay
const showIconsAnimations = (wrappers) => {
  wrappers.forEach((el, index) => {
    setTimeout(() => {
      el.classList.remove('hide');
      el.classList.add('show');
    }, (index + 1) * 80); // calculate delay based on index
  });
};

// Shrinks/expands the navigation menu for small screens
const shrinkExpandAnimation = () => {
  const nav = document.querySelector('.nav-sm');
  if (nav.classList.contains('shrink')) {
    nav.classList.remove('shrink');
    nav.classList.add('expand');
  } else {
    nav.classList.remove('expand');
    nav.classList.add('shrink');
  }
};

// ABOUT COMPONENT

const aboutForm = () => {
  const htmlString = `
    <form>
      <div class='mb-2 text-end'><span class='about-count'>0</span>/200</div>
      <textarea class='mb-3 about form-control input-frame' placeholder='Write a short description about you or your events' name='about'></textarea>
      <div class='mb-3 error-message'></div>
      <div class='mb-3'>
        <input type='submit' value='Add an About' class='btn btn-primary w-100 submit-about'>
        <button class='btn btn-primary w-100 d-none' disabled>
          <span class='spinner'></span>
        </button>
      </div>
    </form>
  `;

  const container = document.createElement('div');
  container.innerHTML = htmlString;
  return container;
};

// This function handles the form submission for the about section
const aboutFormHandler = () => {
  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();

    const aboutTextArea = document.querySelector('textarea');

    // Get the CSRF token from the input field in the form
    const csrfToken = document.querySelector(
      'input[name="csrfmiddlewaretoken"]'
    ).value;

    // Check if the length of the text in the about text area is within the acceptable range
    if (aboutTextArea.value.length > 200) {
      document.querySelector('.error-message').textContent =
        'The about must have 200 characters or less.';
      return false;
    } else if (aboutTextArea.value.length === 0) {
      document.querySelector('.error-message').textContent =
        'The about must have 1 character or more.';
      return false;
    }

    // Call the function to update the about section
    changeAbout(aboutTextArea, csrfToken, event);
  });
};

// This function handles the keyup event on the about text area
const aboutKeyUpHandler = () => {
  const aboutTextArea = document.querySelector('textarea');

  aboutTextArea.addEventListener('input', () => {
    // Update the character count display
    document.querySelector('.about-count').textContent =
      aboutTextArea.value.length;

    // Change the character count color if the length of the text is not within the acceptable range
    if (aboutTextArea.value.length > 200) {
      document.querySelector('.about-count').style.color = '#f00';
      document.querySelector('.submit-about').disabled = true;
    } else if (aboutTextArea.value.length === 0) {
      document.querySelector('.about-count').style.color = '#f00';
      document.querySelector('.submit-about').disabled = true;
    } else {
      document.querySelector('.about-count').style.color = '#212529';
      document.querySelector('.submit-about').disabled = false;
    }
  });
};

// This function updates the about section
const changeAbout = async (textarea, token, e) => {
  // Start the button loading animation
  startBtnLoadingAnimation(e.submitter);

  try {
    // Send a POST request to update the about section
    const response = await fetch(`/profile/add/about`, {
      method: 'POST',
      body: JSON.stringify({ about: textarea.value }),
      headers: {
        'X-CSRFToken': token,
      },
    });

    if (response.status !== 200) {
      throw new Error('The request was unsuccessful, try again later.');
    }

    const { message } = await response.json();

    // Close the modal and update the bio with the new about text
    closeMainModal();
    document.querySelector('.bio').textContent = message;
  } catch (error) {
    // Display an error message if the request was unsuccessful
    document.querySelector('.error-message').textContent = error;
    console.error(error);
  } finally {
    // Stop the button loading animation
    stopBtnLoadingAnimation();
  }
};

const editAbout = () => {
  addToMainModalHistory('Set an About', aboutForm, '10px');

  // Disable submit button
  document.querySelector('.submit-about').disabled = true;

  (async () => {
    const data = await getDataForEditProfile('/get/about');
    document.querySelector('.about').value = data.data;
  })();

  // Count about length
  document.querySelector('.about-count').textContent =
    document.querySelector('.about').value.length;

  aboutKeyUpHandler();
  aboutFormHandler();

  updateTopPushNotification();
};

// PROFILE IMAGE COMPONENT

const changeProfileImg = async (csrfToken, form, e) => {
  // Starts the loading animation for the submit button of the form.
  startBtnLoadingAnimation(e.submitter);

  try {
    // Send a POST request to the server to update the profile image with the new image data.
    const response = await fetch('/profile/add/image', {
      method: 'POST',
      body: form,
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });

    // If the status code of the response is not 200, then an error is thrown.
    if (response.status !== 200) {
      throw new Error('The request was unsuccessful, try again later.');
    }

    // The main modal is closed and the username is extracted from the URL path to fetch the updated profile image.
    closeMainModal();
    const username = window.location.pathname.split('/')[1];
    fetchProfileImage(username);
  } catch (error) {
    document.querySelector('.error-message').textContent = error;
    console.error(error);
  } finally {
    // Stops the loading animation for the submit button of the form.
    stopBtnLoadingAnimation();
  }
};

const cropImage = (aspectRatio = 1) => {
  // Initialize variables
  const result = document.querySelector('.result');
  const imageXAxis = document.querySelector('#x-axis');
  const imageYAxis = document.querySelector('#y-axis');
  const imageWidth = document.querySelector('#width');
  const imageHeight = document.querySelector('#height');

  // Saving image points
  const saveImageValue = (x, y, width, height) => {
    imageXAxis.value = x;
    imageYAxis.value = y;
    imageWidth.value = width;
    imageHeight.value = height;
  };

  // on change show image with crop options
  document.querySelector('#file-input').addEventListener('change', (e) => {
    if (e.target.files.length) {
      // start file reader
      const reader = new FileReader();

      reader.addEventListener('load', (e) => {
        if (e.target.result) {
          // create new image
          const img = document.createElement('img');
          img.style.maxWidth = '100%';
          img.id = 'image';
          img.src = e.target.result;

          // clean result before
          result.innerHTML = '';

          // append new image
          result.appendChild(img);

          // init cropper
          new Cropper(img, {
            aspectRatio: aspectRatio,
            crop(event) {
              saveImageValue(
                event.detail.x,
                event.detail.y,
                event.detail.width,
                event.detail.height
              );
            },
          });
        }
      });

      reader.readAsDataURL(e.target.files[0]);
    }
  });
};

const editProfileImg = () => {
  addToMainModalHistory('Set Profile Image', profileImgForm, '10px');

  cropImage();

  document
    .querySelector('.submit-profile-img')
    .addEventListener('submit', (event) => {
      event.preventDefault();

      // Get crop data
      const imageFile = document.querySelector('#file-input').files[0];
      const x = document.querySelector('#x-axis').value;
      const y = document.querySelector('#y-axis').value;
      const width = document.querySelector('#width').value;
      const height = document.querySelector('#height').value;

      // Send data to server
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('x', x);
      formData.append('y', y);
      formData.append('width', width);
      formData.append('height', height);

      const csrfToken = document.querySelector(
        'input[name="csrfmiddlewaretoken"]'
      ).value;

      changeProfileImg(csrfToken, formData, event);
    });

  updateTopPushNotification();
};

const profileImgForm = () => {
  const htmlString = `
    <form class='submit-profile-img' action='/post' method='post' enctype='multipart/form-data'>
      <div class='mb-3'>
        <input type='file' class='form-control input-frame' accept='.png, .jpg, .jpeg' name='image' id='file-input'>
      </div>
      <input type='hidden' name='x' id='x-axis'>
      <input type='hidden' name='y' id='y-axis'>
      <input type='hidden' name='width' id='width'>
      <input type='hidden' name='height' id='height'>
      <div class='result mb-3'></div>
      <div class='error-message'></div>
      <div class='mb-3'>
        <input type='submit' class='btn btn-primary w-100 submit-profile-img' value='Add profile image'>
        <button class='btn btn-primary w-100 d-none' disabled>
          <span class='spinner'></span>
        </button>
      </div>
    </form>
  `;

  const container = document.createElement('div');
  container.innerHTML = htmlString;
  return container;
};

// TOP BAR NOTIFICATION
// Event click handler
// This function sets up the event listeners for the 'Edit About' and 'Edit Profile Picture' buttons
const profileSetUpClickHandlers = () => {
  const editAboutBtn = document.querySelector('.edit-about');
  if (editAboutBtn) {
    editAboutBtn.addEventListener('click', editAbout);
  }

  const editProfileImgBtn = document.querySelector('.edit-profile-img');
  if (editProfileImgBtn) {
    editProfileImgBtn.addEventListener('click', editProfileImg);
  }
};

// This function sets up the event listener for the 'Complete Profile Setup' button and generates the container for the main modal
const completeProfileSetUp = (data) => {
  document
    .querySelector('.complete-profile-setup')
    .addEventListener('click', () => {
      addToMainModalHistory(
        'Finish Account Setup',
        () => {
          const container = document.createElement('div');
          container.className = 'complete-setup-container';

          // Generate the HTML for the container based on the user's profile setup status
          container.innerHTML = '';
          container.innerHTML += !data.bioSetUp
            ? `
      <div class='border-bottom border-dark px-2 py-3 d-flex justify-content-between edit-about'>
        <div>Tell us more about you!</div>
      </div> 
      `
            : '';

          container.innerHTML += !data.imageSetUp
            ? `
      <div class='border-bottom border-dark px-2 py-3 d-flex justify-content-between edit-profile-img'>
        <div>Set up your profile picture</div>
      </div>
      `
            : '';

          return container;
        },
        [{ func: profileSetUpClickHandlers, values: [] }]
      );
    });
};

// This function sets up the authentication buttons and their event listeners
const setUpAuthButtons = (container) => {
  container.style.display = 'flex';
  container.className = 'auth-actions-container';
  container.innerHTML = `
    <button class='sign-up btn btn-secondary btn-small'>Sign Up</button>
    <button class='sign-in btn btn-secondary-outline btn-small'>Sign In</button>
  `;

  document.querySelector('.sign-up').addEventListener('click', () => {
    window.location.href = '/register';
  });

  document.querySelector('.sign-in').addEventListener('click', () => {
    window.location.href = '/login';
  });
};

// This function updates the push notification and handles the different cases for the user's profile status
const updateTopPushNotification = () => {
  const pushTopNotification = document.querySelector('.push-notification');
  pushTopNotification.style.display = 'none';

  fetch('/notification/push/top')
    .then((response) => response.json())
    .then((data) => {
      if (data.currentStatus === 'profileNotComplete') {
        pushTopNotification.style.display = 'flex';
        pushTopNotification.innerHTML = `
        <p>We're almost finished setting up your profile! <span class='complete-profile-setup'>Press here to finish up.</span></p>
        `;

        completeProfileSetUp(data);
      } else if (data.currentStatus === 'notLoggedIn') {
        setUpAuthButtons(pushTopNotification);
      } else {
        pushTopNotification.style.display = 'none';
      }
    });
};

// This function checks if the user is currently viewing their own profile
// It does so by extracting the username from the URL and sending a GET request to the server
// The response status is checked to see if the user is authenticated, and if so, a CSS class is added to the profile button to highlight it
const highlightViewProfileButtonIfAuthenticated = () => {
  const url = window.location.pathname.split('/');

  if (url.length === 2) {
    const username = url[1];

    fetch(`/is-user-authenticated/${username}`)
      .then((response) => {
        if (response.status === 200) {
          document.querySelectorAll('.view-profile-btn').forEach((el) => {
            el.classList.add('selected');
          });
        }
      })
      .catch((error) => console.error(error));
  }
};

// UTILS

// Format date and time
const formattedDateTime = (timestamp) => {
  const date = new Date(timestamp);
  const userLocale = navigator.language;
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  const dateStr = date.toLocaleDateString(userLocale, options);

  const timeOptions = { hour: 'numeric', minute: 'numeric' };
  const timeStr = date.toLocaleTimeString(userLocale, timeOptions);

  const datetimeStr = `${dateStr}, ${timeStr}`;
  return datetimeStr;
};

const getCookie = (name) => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

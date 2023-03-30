document.addEventListener('DOMContentLoaded', () => {
  pushNotification();

  checkProfileAuthenticity();

  document.querySelector('.nav-controller').addEventListener('click', () => {
    rotateAnimation('sm');
    
    document.querySelectorAll('.nav-icon-wrapper').forEach((el, index) => {
      el.classList.add('hide');
      el.classList.remove('show');
      el.style.width = 0;
    });

    shrinkExpandAnimation();

    const navSm = document.querySelector('.nav-sm');
    navSm.addEventListener('animationend', () => {
      if (navSm.classList.contains('expand')) {
        document.querySelectorAll('.nav-icon-wrapper').forEach((el) => {
          el.classList.add('show');
          el.classList.remove('hide');
          el.style.width = '40px';
        })
      }
    })
  });

  document.querySelector('.nav-controller-lg').addEventListener('click', () => {
    rotateAnimation('lg');
    toggleShowAndHideIcons();
    setTimeout(shrinkExpandAnimationForLargeDevices, 100)
  });

  document.querySelectorAll('.view-profile-btn').forEach((el) => {
    el.addEventListener('click', () => {
      fetch('/get-username')
        .then((response) => response.json())
        .then(({ username }) => {
          window.location.href = `/${username}`;
        })
        .catch((error) => console.error(error));
    });
  });

  document.querySelectorAll('.home').forEach((el) => {
    el.addEventListener('click', () => window.location.href = '/home');
  });

  document.querySelectorAll('.add-new-event').forEach((el) => {
    el.addEventListener('click', () => window.location.href = '/new-event');
  });
});

let iconVisibilityStatus = 'visible'

const toggleShowAndHideIcons = () => {
  const iconsWrappers = document.querySelectorAll('.nav-icon-wrapper-lg');
  const navForLargeScreens = document.querySelector('.nav-lg');
  
  if (iconVisibilityStatus === 'visible') {
    hideIconsAnimations(iconsWrappers);
    navForLargeScreens.style.height = '90px';
    iconVisibilityStatus = 'hidden';
  }
  else {
    navForLargeScreens.style.height = '100%';
    setTimeout(() => {
      showIconsAnimations(iconsWrappers);
    }, 200);
    iconVisibilityStatus = 'visible';
  }
}

const showIconsAnimations = (wrappers) => {
  wrappers.forEach((el, index) => {
    setTimeout(() => {
      el.classList.remove('hide');
      el.classList.add('show');
    }, (index + 1) * 80); // calculate delay based on index
  });
}
 
const hideIconsAnimations = (wrappers) => {
  const reversedIconsWrappers = Array.prototype.slice.call(wrappers).reverse();
  
  reversedIconsWrappers.forEach((el, index) => {
    setTimeout(() => {
      el.classList.remove('show');
      el.classList.add('hide');
    }, (index + 1) * 90); // calculate delay based on index
  });
}

// ANIMATION

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

const shrinkExpandAnimationForLargeDevices = () => {
  const nav = document.querySelector('.animated-nav-icons-lg');
  if (nav.classList.contains('shrink-lg')) {
    nav.classList.remove('shrink-lg');
    nav.classList.add('expand-lg');
  } else {
    nav.classList.remove('expand-lg');
    nav.classList.add('shrink-lg');
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

const aboutFormHandler = () => {
  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();

    const aboutTextArea = document.querySelector('textarea');

    const csrfToken = document.querySelector(
      'input[name="csrfmiddlewaretoken"]'
    ).value;

    if (aboutTextArea.value.length > 200) {
      document.querySelector('.error-message').textContent =
        'The about must have 200 characters or less.';
      return false;
    } else if (aboutTextArea.value.length === 0) {
      document.querySelector('.error-message').textContent =
        'The about must have 1 character or more.';
      return false;
    }

    changeAbout(aboutTextArea, csrfToken, event);
  });
};

const aboutKeyUpHandler = () => {
  const aboutTextArea = document.querySelector('textarea');

  aboutTextArea.addEventListener('input', () => {
    document.querySelector('.about-count').textContent =
      aboutTextArea.value.length;

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

const changeAbout = (textarea, token, e) => {
  startBtnLoadingAnimation(e.submitter);
  
  fetch(`/profile/add/about`, {
    method: 'POST',
    body: JSON.stringify({ about: textarea.value }),
    headers: {
      'X-CSRFToken': token,
    },
  })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('The request was unsuccessful, try again later.');
      }
      return response.json();
    })
    .then((data) => {
      closeMainModal();
      document.querySelector('.bio').textContent = data.message;
    })
    .catch((error) => {
      document.querySelector('.error-message').textContent = error;
    })
    .finally(stopBtnLoadingAnimation);
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

  pushNotification();
};

// PROFILE IMAGE COMPONENT

const changeProfileImg = (csrfToken, form, e) => {
  startBtnLoadingAnimation(e.submitter);
  
  fetch('/profile/add/image', {
    method: 'POST',
    body: form,
    headers: {
      'X-CSRFToken': csrfToken,
    },
  })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('The request was unsuccessful, try again later.');
      }
      return response.json();
    })
    .then(() => {
      closeMainModal();
      const username = window.location.pathname.split('/')[1];
      fetchProfileImage(username);
    })
    .catch(
      (error) => (document.querySelector('.error-message').textContent = error)
    )
    .finally(stopBtnLoadingAnimation);
};

const cropImage = (aspectRatio=1) => {
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

  pushNotification();
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
const pushNotification = () => {
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

        // Event click handler
        const profileSetUpClickHandlers = () => {
          const editAboutBtn = document.querySelector('.edit-about');
          if (editAboutBtn) {
            editAboutBtn.addEventListener('click', editAbout);
          }

          const editProfileImgBtn = document.querySelector('.edit-profile-img');
          if (editProfileImgBtn) {
            editProfileImgBtn.addEventListener('click', editProfileImg);
          }
        }

        document.querySelector('.complete-profile-setup').addEventListener('click', () => {
          addToMainModalHistory('Finish Account Setup', () => {
            const container = document.createElement('div');
            container.className = 'complete-setup-container';

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
          }, [ { func: profileSetUpClickHandlers, values: [] } ]);
        });

      } else if (data.currentStatus === 'notLoggedIn') {
        pushTopNotification.style.display = 'flex';
        pushTopNotification.className = 'auth-actions-container';
        pushTopNotification.innerHTML = `
          <button class='sign-up btn btn-secondary btn-small'>Sign Up</button>
          <button class='sign-in btn btn-secondary-outline btn-small'>Sign In</button>
        `;

        document.querySelector('.sign-up').addEventListener('click', () => {
          window.location.href = '/register';
        });

        document.querySelector('.sign-in').addEventListener('click', () => {
          window.location.href = '/login';
        });
        
      } else {
        pushTopNotification.style.display = 'none';
      }
    });
};

// Check if the user is viewing their profile
const checkProfileAuthenticity = () => {
  const url =  window.location.pathname.split('/');

  if (url.length === 2) {
    const username = url[1];
  
    fetch(`/is-user-authenticated/${username}`)
      .then((response) => {
        if (response.status === 200) {
          document.querySelectorAll('.view-profile-btn').forEach((el) => {
            el.classList.add('selected');
          })
        }
      })
      .catch((error) => console.error(error));
  }
}

// Format date and time
const formattedDateTime = (timestamp) => {
  const date = new Date(timestamp);
  const userLocale = navigator.language;
  const options = { day: 'numeric', month: 'short', year: 'numeric' }
  const dateStr = date.toLocaleDateString(userLocale, options)

  const timeOptions = { hour: 'numeric', minute: 'numeric' }
  const timeStr = date.toLocaleTimeString(userLocale, timeOptions);

  const datetimeStr = `${dateStr}, ${timeStr}`;
  return datetimeStr;
}
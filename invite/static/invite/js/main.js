document.addEventListener('DOMContentLoaded', () => {
  pushNotification();
  document.querySelector('.nav-controller').addEventListener('click', () => {
    rotateAnimation('sm');
    shrinkExpandAnimation();
    showHideAnimation();
  });

  document.querySelector('.nav-controller-lg').addEventListener('click', () => {
    rotateAnimation('lg');
    shrinkExpandAnimationForLargeDevices();
    showHideAnimation();
  });

  document.querySelector('.edit-btn').addEventListener('click', () => {
    editProfile();
  })
});

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

const showHideAnimation = () => {
  document.querySelectorAll('.icon').forEach((element) => {
    if (element.classList.contains('show')) {
      element.classList.remove('show');
      element.classList.add('hide');
      element.addEventListener('animationend', () => {
        if (element.classList.contains('hide')) {
          element.style.display = 'none';
        }
      });
    } else {
      element.classList.remove('hide');
      element.classList.add('show');
      element.setAttribute(
        'style',
        `
        align-items: center;
        display: flex;
        justify-content: center;
      `
      );
    }
  });
};

const shrinkExpandAnimation = () => {
  const nav = document.querySelector('.nav-sm');
  if (nav.classList.contains('expand')) {
    nav.classList.remove('expand');
    nav.classList.add('shrink');
  } else {
    nav.classList.remove('shrink');
    nav.classList.add('expand');
  }
};

const shrinkExpandAnimationForLargeDevices = () => {
  const nav = document.querySelector('.nav-lg');
  if (nav.classList.contains('expand-lg')) {
    nav.classList.remove('expand-lg');
    nav.classList.add('shrink-lg');
  } else {
    nav.classList.remove('shrink-lg');
    nav.classList.add('expand-lg');
  }
};

// ABOUT COMPONENT

const aboutForm = () => {
  return `
    <form>
      <div class='mb-2 text-end'><span class='about-count'>0</span>/200</div>
      <textarea class='mb-3 about form-control input-frame' placeholder='Write a short description about you or your events' name='about'></textarea>
      <div class='mb-3 error-message'></div>
      <input type='submit' value='Add an About' class='btn btn-primary w-100 submit-about'>
    </form>
  `;
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

    changeAbout(aboutTextArea, csrfToken);
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

const changeAbout = (textarea, token) => {
  fetch(`/profile/add/about`, {
    method: 'POST',
    body: JSON.stringify({about: textarea.value}),
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
      document.querySelector('.bio').textContent = data.message;
      document.querySelector('.modal-page').style.display = 'none';
    })
    .catch((error) => {
      document.querySelector('.error-message').textContent = error;
    });
};

const editAbout = () => {
  const modalTitle = document.querySelectorAll('.modal-page-title');
  const modalPage = document.querySelector('.modal-page-content');
  modalTitle.forEach((title) => (title.textContent = 'Set an About'));

  modalPage.style.padding = '10px';
  modalPage.innerHTML = aboutForm();

  // Disable submit button
  document.querySelector('.submit-about').disabled = true;

  aboutKeyUpHandler();
  aboutFormHandler();

  pushNotification();
};

// PROFILE IMAGE COMPONENT

const changeProfileImg = (csrfToken, form) => {
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
      document.querySelector('.modal-page').style.display = 'none';
      fetchProfileImage();
    })
    .catch(
      (error) => (document.querySelector('.error-message').textContent = error)
    );
};

const cropImage = () => {
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
            aspectRatio: 1,
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
  const modalTitle = document.querySelectorAll('.modal-page-title');
  const modalPage = document.querySelector('.modal-page-content');
  modalTitle.forEach(
    (title) => (title.textContent = 'Set Profile Image')
  );

  modalPage.style.padding = '10px';
  modalPage.innerHTML = profileImgForm();

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

      changeProfileImg(csrfToken, formData);
    });

  pushNotification();
};

const profileImgForm = () => {
  return `
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
      <input type='submit' class='btn btn-primary w-100 submit-profile-img' value='Add profile image'>
    </form>
  `;
};

const pushNotification = () => {
  const pushTopNotification = document.querySelector('.push-notification');
  fetch('/notification/push/top')
    .then((response) => response.json())
    .then((data) => {
      if (data.currentStatus === 'profileNotComplete') {
        pushTopNotification.style.display = 'flex';
        pushTopNotification.innerHTML = `
        <p>We're almost finished setting up your profile! <span class='complete-profile-setup'>Press here to finish up.</span></p>
        `;

        document
          .querySelector('.complete-profile-setup')
          .addEventListener('click', () => {
            document.querySelector('.modal-page').style.display =
              'inline-block';
            const modalTitle = document.querySelectorAll('.modal-page-title');
            const modalPage = document.querySelector('.modal-page-content');
            modalTitle.forEach(
              (title) => (title.textContent = 'Complete profile setup')
            );
            document.querySelector('.modal-icon').innerHTML =
              "<i class='bi bi-person'></i>";

            // Clean up modalPage main content
            modalPage.innerHTML = '';

            modalPage.innerHTML += !data.bioSetUp
              ? `
            <div class='border-bottom border-dark px-2 py-3 d-flex justify-content-between edit-about'>
              <div>Add an About</div>
            </div> 
            `
              : '';

            modalPage.innerHTML += !data.imageSetUp
              ? `
            <div class='border-bottom border-dark px-2 py-3 d-flex justify-content-between edit-profile-img'>
              <div>Add a Profile Picture</div>
            </div>
            `
              : '';

            if (!data.bioSetUp) {
              document.querySelector('.edit-about').addEventListener('click', () => {
                editAbout();
              });
            }

            if (!data.imageSetUp) {
              document.querySelector('.edit-profile-img').addEventListener('click', () => {
                editProfileImg();
              });
            }

            document
              .querySelector('.modal-page-cancel')
              .addEventListener('click', () => {
                modalPage.innerHTML = '';
                document.querySelector('.modal-page').style.display = 'none';
              });
          });
      } else if (data.currentStatus === 'notLoggedIn') {
        pushTopNotification.style.display = 'flex';
        pushTopNotification.innerHTML = `<p><span><a href='/login'>Login</a></span></p>`;
      } else {
        pushTopNotification.style.display = 'none';
      }
    });
};

// EDIT PROFILE
const editProfile = () => {
  document.querySelector('.modal-page').style.display =
  'inline-block';
  const modalTitle = document.querySelectorAll('.modal-page-title');
  const modalPage = document.querySelector('.modal-page-content');
  modalTitle.forEach(
    (title) => (title.textContent = 'Edit Profile')
  );
  document.querySelector('.modal-icon').innerHTML =
    "<i class='bi bi-person'></i>";

  modalPage.innerHTML = '';

  document
  .querySelector('.modal-page-cancel')
  .addEventListener('click', () => {
    modalPage.innerHTML = '';
    document.querySelector('.modal-page').style.display = 'none';
  });

  modalPage.append(editProfileSection());
}

const editProfileResponseHandler = (response) => {
  if (response.status !== 200) {
    throw new Error('Request was unsuccessful, the user might not be authenticated. Try again later');
  }
  return response.json();
}

const editProfileGetErrorHandler = (error) => {
  console.log(error);
  return 'Error 404 (try reloading the page)';
}

const getDataForEditProfile = async (route) => {
  try {
    const response = await fetch(route);
    return editProfileResponseHandler(response);
  } catch (error) {
    return editProfileGetErrorHandler(error);
  }
}

const editProfileSection = () => {
  const editIcon = document.createElement('i');
  const img = document.createElement('img');
  const imgDiv = document.createElement('div');
  const imgWrapper = document.createElement('div');
  const section = document.createElement('section');

  img.classList = 'rounded-circle skeleton';
  imgDiv.className = 'rounded-circle';
  imgWrapper.className = 'text-center';
  editIcon.classList = 'bi bi-pencil-fill';
  section.className = 'edit-profile';

  
  (async () => {
    const data = await getDataForEditProfile('/get/profile_img');
    img.src = data.data;
    img.addEventListener('load', () => img.classList.remove('skeleton'));
  })();
  
  editIcon.addEventListener('click', editProfileImg);

  imgDiv.append(img);
  imgDiv.append(editIcon);
  imgWrapper.append(imgDiv);
  
  section.append(imgWrapper);

  for (let object of editProfileContent) {
    const wrapper = document.createElement('div');
    const outerDiv = document.createElement('div');
    const iconWrapper = document.createElement('div');
    const contentWrapper = document.createElement('div');
    const title = document.createElement('span');
    const content = document.createElement('span');
    const editPencilWrapper = document.createElement('div');

    wrapper.classList = 'border-bottom border-dark d-flex align-items-center justify-content-between stack';
    outerDiv.classList = 'd-flex align-items-center';
    contentWrapper.classList = 'd-flex flex-column';
    title.classList = 'font-body-tiny';
    content.classList = 'imp font-body edit-profile-data';

    iconWrapper.innerHTML = `<i class='${object.icon}'></i>`;
    editPencilWrapper.innerHTML = `<i class='bi bi-pencil-fill'></i>`
    title.textContent = object.title;
    (async () => {
      const data = await getDataForEditProfile(object.route);
      content.textContent = data.data;
    })();

    editPencilWrapper.addEventListener('click', object.action);

    contentWrapper.append(title);
    contentWrapper.append(content);
    outerDiv.append(iconWrapper);
    outerDiv.append(contentWrapper);
    wrapper.append(outerDiv);
    wrapper.append(editPencilWrapper);

    section.append(wrapper);
  }

  return section;
}

// EDIT NAME COMPONENT
const editFullNameForm = () => {
  return `
  <form>
    <input type='text' class='form-control input-frame mb-3 firstname' name='firstname' placeholder='First Name'>
    <input type='text' class='form-control input-frame mb-3 lastname' name='lastname' placeholder='Last Name'>
    <div class='error-message mb-3'></div>
    <input type='submit' class='btn btn-primary fullname-submit w-100' value='Edit Name'>
  </form>
  `
}

const editFullNameFormHandler = () => {
  const firstName = document.querySelector('.firstname');
  const lastName = document.querySelector('.lastname');
  const csrfToken = document.querySelector(
    'input[name="csrfmiddlewaretoken"]'
  ).value;

  document.querySelector('.firstname').addEventListener('input', () => {
    firstName.value = firstName.value.charAt(0).toUpperCase() + firstName.value.slice(1).toLowerCase().trim();
  })

  document.querySelector('.lastname').addEventListener('input', () => {
    lastName.value = lastName.value.charAt(0).toUpperCase() + lastName.value.slice(1).toLowerCase().trim();
  })

  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();

    if (firstName.value.length < 3 || lastName.value.length < 3){
      document.querySelector('.error-message').textContent = 'First/Last name should have 3 or more characters.';
      return false;
    }

    fetch('/profile/edit/fullname', {
      method: 'POST',
      body: JSON.stringify({firstName: firstName.value, lastName: lastName.value}),
      headers: {
        'X-CSRFToken': csrfToken,
      },
    })
      .then((response) => {
        if (response.status === 200) {
          document.querySelector('.modal-page').style.display = 'none';
          document.querySelector('.full-name').textContent = `${firstName.value} ${lastName.value}`;
        } else {
          throw new Error('Error: Request was unsuccessful, please try again later');
        }
      })
      .catch((error) => {
        document.querySelector('.error-message').textContent = error;
      })
  })
}

const editFullName = () => {
  document.querySelector('.modal-page').style.display = 'inline-block';
  
  const modalTitle = document.querySelectorAll('.modal-page-title');
  const modalPage = document.querySelector('.modal-page-content');
  modalTitle.forEach((title) => (title.textContent = 'Edit Full Name'));

  modalPage.style.padding = '10px';
  modalPage.innerHTML = editFullNameForm();

  (async () => {
    const data = await getDataForEditProfile('/get/name');
    const fullName = data.data.split(' ');
    document.querySelector('.firstname').value = fullName[0];
    document.querySelector('.lastname').value = fullName[1];
  })();

  editFullNameFormHandler();
}

// EDIT USERNAME COMPONENT 
const editUsernameForm = () => {
  return `
  <form>
    <input type='text' class='form-control input-frame mb-3 username-input' name='username' placeholder='username'>
    <div class='error-message mb-3'></div>
    <input type='submit' class='btn btn-primary w-100 username-submit' value='Edit Username'>
  </form>
  `
}

const editUsernameFormHandler = () => {
  const csrfToken = document.querySelector(
    'input[name="csrfmiddlewaretoken"]'
  ).value;
  const errorMessageContainer = document.querySelector('.error-message');
  const username = document.querySelector('.username-input');
  
  document.querySelector('.username-input').addEventListener('input', () => {
    username.value = username.value.toLowerCase().trim();

    if (username.value.length <= 3 || username.value.length >= 16) {
      document.querySelector('.username-submit').disabled = true;
    }
    else {
      document.querySelector('.username-submit').disabled = false;
    }
  })
  
  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    
    if (username.value.length <= 3 || username.value.length >= 16) {
      errorMessageContainer.textContent = 'Username length must be between 3 and 16 characters.';
      return false;
    }

    fetch('/profile/edit/username', {
      method: 'POST',
      body: JSON.stringify({username: username.value}),
      headers: {
        'X-CSRFToken': csrfToken,
      },
    })
      .then((response) => {
        if (response.status === 200) {
          window.location.replace(`/${username.value}`);
        } else {
          throw new Error('Username is taken, try a different one.');
        }
      })
      .catch((error) => {
        errorMessageContainer.textContent = error;
      })
  })
}

const editUsername = () => {
  document.querySelector('.modal-page').style.display = 'inline-block';
  
  const modalTitle = document.querySelectorAll('.modal-page-title');
  const modalPage = document.querySelector('.modal-page-content');
  modalTitle.forEach((title) => (title.textContent = 'Edit Username'));

  modalPage.style.padding = '10px';
  modalPage.innerHTML = editUsernameForm();

  (async () => {
    const data = await getDataForEditProfile('/get/username');
    document.querySelector('.username-input').value = data.data;
  })();

  editUsernameFormHandler();
}

// EDIT EMAIL COMPONENT
const editEmailForm = () => {
  return `
  <form>
    <input type='email' class='form-control input-frame email-input mb-3' required>
    <div class='error-message mb-3'></div>
    <input type='submit' class='btn btn-primary w-100 mb-3' value='Edit Email'>
  </form>
  `
}

const editEmailFormHandler = () => {
  const csrfToken = document.querySelector(
    'input[name="csrfmiddlewaretoken"]'
  ).value;
  const email = document.querySelector('.email-input');
  const errorMessageContainer = document.querySelector('.error-message');

  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();

    fetch('/profile/edit/email', {
      method: 'POST',
      body: JSON.stringify({email: email.value}),
      headers: {
        'X-CSRFToken': csrfToken,
      },
    })
      .then((response) => {
        if (response.status === 200) {
          errorMessageContainer.textContent = `
          The code has been sent to your email.
          Reload the page to confirm your email.
          NOTE: Before reloading the page, ensure you have received the code, otherwise reset your email.
          `;

          const parent = document.querySelector('form');
          const resetEmail = document.createElement('div');
          resetEmail.onclick = editEmail();
          resetEmail.style.color = '#3ec70b';
          resetEmail.style.textAlign = 'center';
          resetEmail.textContent = 'Reset Password';
          resetEmail.className = 'mb-30';

          const lastChild = parent.lastChild;
          parent.insertBefore(resetEmail, lastChild);
        } else {
          throw new Error('Email is taken, try using another one.');
        }
      })
      .catch((error) => {
        errorMessageContainer.textContent = error;
      })
  })
}

const editEmail = () => {
  document.querySelector('.modal-page').style.display = 'inline-block';
  
  const modalTitle = document.querySelectorAll('.modal-page-title');
  const modalPage = document.querySelector('.modal-page-content');
  modalTitle.forEach((title) => (title.textContent = 'Edit email'));

  modalPage.style.padding = '10px';
  modalPage.innerHTML = editEmailForm();

  (async () => {
    const data = await getDataForEditProfile('/get/email');
    document.querySelector('.email-input').value = data.data;
  })();

  editEmailFormHandler();
}

//////////////
const editProfileContent = [
  {icon: 'bi bi-person', title: 'Name', content: getDataForEditProfile, route: '/get/name', action: editFullName},
  {icon: 'bi bi-at', title: 'Username', content: getDataForEditProfile, route: '/get/username', action: editUsername},
  {icon: 'bi bi-info', title: 'About', content: getDataForEditProfile, route: '/get/about', action: editAbout},
  {icon: 'bi bi-envelope-at', title: 'Email', content: getDataForEditProfile, route: '/get/email', action: editEmail}
]
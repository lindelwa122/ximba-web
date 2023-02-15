document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.edit-btn').addEventListener('click', editProfile);
})

// EDIT PROFILE
const editProfile = () => {  
  addToMainModalHistory('Edit Profile', editProfileSection);
};

const editProfileResponseHandler = (response) => {
  if (response.status !== 200) {
    throw new Error(
      'Request was unsuccessful, the user might not be authenticated. Try again later'
    );
  }

  return response.json();
};

const editProfileGetErrorHandler = (error) => {
  console.log(error);
  return 'Status code 404 (try reloading the page)';
};

const getDataForEditProfile = async (route) => {
  try {
    const response = await fetch(route);
    return editProfileResponseHandler(response);
  } catch (error) {
    return editProfileGetErrorHandler(error);
  }
};

const editProfileSection = () => {
  const editIcon = document.createElement('i');
  const img = document.createElement('img');
  const imgDiv = document.createElement('div');
  const imgWrapper = document.createElement('div');
  const section = document.createElement('section');

  editIcon.classList = 'bi bi-pencil-fill';
  img.classList = 'skeleton';
  imgDiv.className = 'img-container';
  imgWrapper.className = 'text-center';
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

    wrapper.classList =
      'border-bottom border-dark d-flex align-items-center justify-content-between stack';
    outerDiv.classList = 'd-flex align-items-center';
    contentWrapper.classList = 'd-flex flex-column';
    title.classList = 'font-body-tiny';
    content.classList =
      'imp font-body edit-profile-data skeleton skeleton-text';

    iconWrapper.innerHTML = `<i class='${object.icon}'></i>`;
    editPencilWrapper.innerHTML = `<i class='bi bi-pencil-fill'></i>`;
    title.textContent = object.title;
    (async () => {
      const data = await getDataForEditProfile(object.route);
      content.classList.remove('skeleton', 'skeleton-text');
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
};

// EDIT EMAIL COMPONENT
const editEmailForm = () => {
  const htmlString =  `
  <form>
    <input type='email' class='form-control input-frame email-input mb-3' required>
    <div class='error-message mb-3'></div>
    <div class='mb-3'>
      <input type='submit' class='btn btn-primary w-100 mb-3' value='Edit Email'>
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

const editEmailFormHandler = () => {
  const csrfToken = document.querySelector(
    'input[name="csrfmiddlewaretoken"]'
  ).value;
  const email = document.querySelector('.email-input');
  const errorMessageContainer = document.querySelector('.error-message');

  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();

    startBtnLoadingAnimation(event.submitter);

    fetch('/profile/edit/email', {
      method: 'POST',
      body: JSON.stringify({ email: email.value }),
      headers: {
        'X-CSRFToken': csrfToken,
      },
    })
      .then((response) => {
        if (response.status === 200) {
          errorMessageContainer.textContent = `
          A confirmation code will be sent to your email.
          Please reload the page to verify your email address.
          Important: Before reloading, please double-check that you have entered the correct email. If not, simply reset your email information.
          `;

          const parent = document.querySelector('form');
          const resetEmail = document.createElement('div');
          resetEmail.className = 'mb-30';
          resetEmail.onclick = editEmail;
          resetEmail.style.color = '#3ec70b';
          resetEmail.style.cursor = 'pointer';
          resetEmail.style.textAlign = 'center';
          resetEmail.textContent = 'Reset Email';

          const lastChild = parent.lastChild;
          parent.insertBefore(resetEmail, lastChild);
        } else {
          throw new Error('Email address is taken, try using another one.');
        }
      })
      .catch((error) => {
        errorMessageContainer.textContent = error;
      })
      .finally(stopBtnLoadingAnimation);
  });
};

const editEmail = () => {
  addToMainModalHistory('Edit Email', editEmailForm, '10px');

  (async () => {
    const data = await getDataForEditProfile('/get/email');
    document.querySelector('.email-input').value = data.data;
  })();

  editEmailFormHandler();
};

// EDIT NAME COMPONENT
const editFullNameForm = () => {
  const htmlString = `
  <form>
    <input type='text' class='form-control input-frame mb-3 firstname' name='firstname' placeholder='First Name'>
    <input type='text' class='form-control input-frame mb-3 lastname' name='lastname' placeholder='Last Name'>
    <div class='error-message mb-3'></div>
    <div class='mb-3'>
      <input type='submit' class='btn btn-primary fullname-submit w-100' value='Edit Name'>
      <button class='btn btn-primary w-100 d-none' disabled>
        <span class='spinner'></span>
      </button>
    </div>
  </form>
  `;

  const container = document.createElement('div');
  container.innerHTML = htmlString;
  return container
};

const editFullNameFormHandler = () => {
  const firstName = document.querySelector('.firstname');
  const lastName = document.querySelector('.lastname');
  const csrfToken = document.querySelector(
    'input[name="csrfmiddlewaretoken"]'
  ).value;

  document.querySelector('.firstname').addEventListener('input', () => {
    firstName.value =
      firstName.value.charAt(0).toUpperCase() +
      firstName.value.slice(1).toLowerCase().trim();
  });

  document.querySelector('.lastname').addEventListener('input', () => {
    lastName.value =
      lastName.value.charAt(0).toUpperCase() +
      lastName.value.slice(1).toLowerCase().trim();
  });

  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();

    if (firstName.value.length < 3 || lastName.value.length < 3) {
      document.querySelector('.error-message').textContent =
        'First/Last name should have 3 or more characters.';
      return false;
    }

    startBtnLoadingAnimation(event.submitter);

    fetch('/profile/edit/fullname', {
      method: 'POST',
      body: JSON.stringify({
        firstName: firstName.value,
        lastName: lastName.value,
      }),
      headers: {
        'X-CSRFToken': csrfToken,
      },
    })
      .then((response) => {
        if (response.status === 200) {
          document.querySelector('.modal-page').style.display = 'none';
          document.querySelector(
            '.full-name'
          ).textContent = `${firstName.value} ${lastName.value}`;
        } else {
          throw new Error(
            'Error: Request was unsuccessful, please try again later'
          );
        }
      })
      .catch((error) => {
        document.querySelector('.error-message').textContent = error;
      })
      .finally(stopBtnLoadingAnimation);
  });
};

const editFullName = () => {
  addToMainModalHistory('Edit Full Name', editFullNameForm, '10px');

  (async () => {
    const data = await getDataForEditProfile('/get/name');
    const fullName = data.data.split(' ');
    document.querySelector('.firstname').value = fullName[0];
    document.querySelector('.lastname').value = fullName[1];
  })();

  editFullNameFormHandler();
};

// EDIT USERNAME COMPONENT
const editUsernameForm = () => {
  const htmlString = `
  <form>
    <input type='text' class='form-control input-frame mb-3 username-input' name='username' placeholder='username'>
    <div class='error-message mb-3'></div>
    <div class='mb-3'>
      <input type='submit' class='btn btn-primary w-100 username-submit' value='Edit Username'>
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
    } else {
      document.querySelector('.username-submit').disabled = false;
    }
  });

  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();

    if (username.value.length <= 3 || username.value.length >= 16) {
      errorMessageContainer.textContent =
        'Username length must be between 3 and 16 characters.';
      return false;
    }

    startBtnLoadingAnimation(event.submitter);

    fetch('/profile/edit/username', {
      method: 'POST',
      body: JSON.stringify({ username: username.value }),
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
      .finally(stopBtnLoadingAnimation);
  });
};

const editUsername = () => {
  addToMainModalHistory('Edit Username', editUsernameForm, '10px');

  (async () => {
    const data = await getDataForEditProfile('/get/username');
    document.querySelector('.username-input').value = data.data;
  })();

  editUsernameFormHandler();
};

// An array containing content to be displayed on the edit profile modal section
const editProfileContent = [
  {
    icon: 'bi bi-person',
    title: 'Name',
    content: getDataForEditProfile,
    route: '/get/name',
    action: editFullName,
  },
  {
    icon: 'bi bi-at',
    title: 'Username',
    content: getDataForEditProfile,
    route: '/get/username',
    action: editUsername,
  },
  {
    icon: 'bi bi-info',
    title: 'About',
    content: getDataForEditProfile,
    route: '/get/about',
    action: editAbout,
  },
  {
    icon: 'bi bi-envelope-at',
    title: 'Email',
    content: getDataForEditProfile,
    route: '/get/email',
    action: editEmail,
  },
];

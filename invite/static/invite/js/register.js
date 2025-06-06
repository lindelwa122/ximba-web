document.addEventListener('DOMContentLoaded', () => {
  validate_password_strength();
  validateUsername();
  confirmPassword();

  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    validateForm(event);
  });

  const capitalizeFirstLetter = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const firstName = document.querySelector('.firstname');
  firstName.addEventListener('input', () => {
    firstName.value = capitalizeFirstLetter(firstName.value);
  });

  const lastName = document.querySelector('.lastname');
  lastName.addEventListener('input', () => {
    lastName.value = capitalizeFirstLetter(lastName.value);
  });

  const password = document.querySelector('.password');
  password.addEventListener('input', () => {
    isPasswordConfirmed()
      ? (document.querySelector('.confirm').style.color = '#3ec70b')
      : (document.querySelector('.confirm').style.color = '#212529');
  });

  changeEventDescription();
  setTimeout(changeFormHeaderText, 1000);
  imageLoadHandler();
});

const validateUsername = () => {
  const username = document.querySelector('.username');

  username.addEventListener('focus', () => {
    document.querySelector('.username-help').classList.remove('d-none');
  });

  username.addEventListener('blur', () => {
    document.querySelector('.username-help').classList.add('d-none');
  });

  username.addEventListener('input', () => {
    username.value = username.value.toLowerCase().trim();

    username.value.length >= 3 && username.value.length <= 16
      ? (document.querySelector('.user-count').style.color = '#3ec70b')
      : (document.querySelector('.user-count').style.color = '#212529');

    hasSymbol(username.value)
      ? (document.querySelector('.user').style.color = '#f00')
      : (document.querySelector('.user').style.color = '#3ec70b');

    if (username.value.length === 0) {
      document.querySelector('.user').style.color = '#212529';
    }
  });
};

const validateForm = (e) => {
  const confirmPassword = document.querySelector('.confirm-password');
  const password = document.querySelector('.password');
  const username = document.querySelector('.username');
  let isFormValid = true;

  // Remove the invalid input fields
  document.querySelectorAll('.input-frame').forEach((input) => {
    input.classList.remove('is-invalid');
  });

  // Hide every invalid feedback
  document.querySelectorAll('.error-message').forEach((el) => {
    if (!el.classList.contains('d-none')) {
      el.classList.add('d-none');
    }
  });

  // Ensure no input field is empty
  document.querySelectorAll('.input-frame').forEach((input) => {
    if (input.value.length === 0) {
      const inputName = input.classList[0];

      if (inputName === 'firstname' || inputName === 'lastname') {
        errorContainer = document.querySelector('.names-empty');
        errorContainer.style.display = 'block';
      } else {
        errorContainer = document.querySelector(`.${inputName}-empty`);
      }

      formErrorRender(input, errorContainer, 'Every input field is required');
      isFormValid = false;
    }
  });

  if (!isFormValid) return;

  // Define isPasswordInvalid as list because it creates a very long, unreadable if statement
  const isPasswordInvalid = [
    password.value.length < 8,
    password.value.length > 16,
    !hasLowerCase(password.value),
    !hasUpperCase(password.value),
    !hasNumber(password.value),
    !hasSymbol(password.value),
  ];

  // Ensure password is valid
  isPasswordInvalid.forEach((element) => {
    if (element === true) {
      const errorContainer = document.querySelector('.password-invalid');
      formErrorRender(password, errorContainer, 'Password is invalid**');
      isFormValid = false;
    }
  });

  // Exit if some input is empty of password invalid
  // This works but is not the best solution
  // I will improve this later
  if (!isFormValid) return;

  // Ensure username is valid
  if (
    username.value.length < 3 ||
    username.value.length > 16 ||
    hasSymbol(username.value)
  ) {
    formErrorRender(username, errorContainer, 'Username is invalid**');
    return false;
  }

  // Ensure password matches
  if (password.value !== confirmPassword.value) {
    const errorContainer = document.querySelector('.confirm-password-invalid');
    formErrorRender(
      confirmPassword,
      errorContainer,
      'Password does not match**'
    );
    return false;
  }


  startBtnLoadingAnimation(e.submitter);
  sendFormDataToServer('/register', '/home');
};

const changeEventDescription = () => {
  const adjectives = [
    'amazing',
    'awesome',
    'beautiful',
    'breathtaking',
    'captivating',
    'charming',
    'colorful',
    'creative',
    'delightful',
    'energetic',
    'exciting',
    'exhilarating',
    'extraordinary',
    'fabulous',
    'fantastic',
    'fun',
    'funky',
    'glamorous',
    'grand',
    'happening',
    'hottest',
    'inspiring',
    'joyful',
    'lively',
    'magical',
    'memorable',
    'mind-blowing',
    'magnificent',
    'outstanding',
    'remarkable',
    'sensational',
    'spectacular',
    'stunning',
    'superb',
    'surprising',
    'thrilling',
    'unforgettable',
    'uplifting',
    'vibrant',
    'wonderful',
    'youthful',
    'zany',
    'zesty',
  ];

  setTimeout(() => {
    for (const adj of adjectives) {
      setTimeout(() => {
        document.querySelector('.events-description').textContent = adj;
      }, 1000 * calcWordsSpeed(adjectives.indexOf(adj)));
    }
  }, 4000);
};

const calcWordsSpeed = (current) => {
  if (current <= 1) {
    return 1;
  }

  return calcWordsSpeed(current - 1) * 0.95 + 1;
};

const changeFormHeaderText = () => {
  const headerText = [
    'Say goodbye to boring weekends with our app.',
    'Expand your social circle and meet new friends.',
    'Create unforgettable memories.',
    'Join us now and start exploring!',
  ];

  const formHeader = document.querySelector('.form-header');

  setTimeout(() => {
    for (const text of headerText) {
      setTimeout(() => {
        formHeader.classList.add('change-text');

        formHeader.addEventListener('transitionend', () => {
          formHeader.classList.remove('change-text');
          formHeader.textContent = text;
        });
      }, 7000 * (headerText.indexOf(text) + 1));
    }
  }, 20000);
};

const imageLoadHandler = () => {
  const imgWrapper = document.querySelector('.img-wrapper');

  imgWrapper.childNodes.forEach((child) => {
    if (child.complete) {
      child.classList.remove('skeleton');
    } else {
      child.addEventListener('load', () => {
        child.classList.remove('skeleton');
      });
    }
  });
};

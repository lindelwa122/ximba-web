document.addEventListener('DOMContentLoaded', () => {
  validate_password_strength();
  validateUsername();
  confirmPassword();

  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    validateForm();
  });
});

const validate_password_strength = () => {
  const password = document.querySelector('.password');

  password.addEventListener('focus', () => {
    document.querySelector('.password-help').classList.remove('d-none');
  });

  password.addEventListener('input', () => {
    password.value.length >= 8 && password.value.length <= 16
      ? (document.querySelector('.char').style.color = '#3ec70b')
      : (document.querySelector('.char').style.color = '#212529');

    hasLowerCase(password.value)
      ? (document.querySelector('.lower').style.color = '#3ec70b')
      : (document.querySelector('.lower').style.color = '#212529');

    hasUpperCase(password.value)
      ? (document.querySelector('.upper').style.color = '#3ec70b')
      : (document.querySelector('.upper').style.color = '#212529');

    hasNumber(password.value)
      ? (document.querySelector('.number').style.color = '#3ec70b')
      : (document.querySelector('.number').style.color = '#212529');

    hasSymbol(password.value)
      ? (document.querySelector('.symbol').style.color = '#3ec70b')
      : (document.querySelector('.symbol').style.color = '#212529');
  });
};

const validateUsername = () => {
  const username = document.querySelector('.username');

  username.addEventListener('focus', () => {
    document.querySelector('.username-help').classList.remove('d-none');
  });

  username.addEventListener('input', () => {
    username.value = username.value.toLowerCase().trim();

    username.value.length >= 3 && username.value.length <= 16
      ? (document.querySelector('.user-count').style.color = '#3ec70b')
      : (document.querySelector('.user-count').style.color = '#212529');

    hasSymbol(username.value)
      ? (document.querySelector('.user').style.color = '#f00')
      : (document.querySelector('.user').style.color = '#3ec70b');
  });
};

const confirmPassword = () => {
  const confirm = document.querySelector('.confirm-password');

  confirm.addEventListener('focus', () => {
    document.querySelector('.confirm-help').classList.remove('d-none');
  });

  confirm.addEventListener('input', () => {
    isPasswordConfirmed()
      ? (document.querySelector('.confirm').style.color = '#3ec70b')
      : (document.querySelector('.confirm').style.color = '#212529');
  });
};

const validateForm = () => {
  const confirmPassword = document.querySelector('.confirm-password');
  const errorContainer = document.querySelector('.error-message');
  const password = document.querySelector('.password');
  const username = document.querySelector('.username');
  let isFormValid = true;

  // Ensure no input field is empty
  document.querySelectorAll('.input-frame').forEach((input) => {
    if (input.value.length === 0) {
      formErrorRender(input, errorContainer, 'Every input field is required**');
      isFormValid = false;
    }
  });

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
    formErrorRender(
      confirmPassword,
      errorContainer,
      'Password does not match**'
    );
    return false;
  }

  sendFormDataToServer('/register', '/confirm', errorContainer);
};

const isPasswordConfirmed = () => {
  return (
    document.querySelector('.password').value ===
    document.querySelector('.confirm-password').value
  );
};

const hasLowerCase = (str) => {
  return str.toUpperCase() !== str;
};

const hasUpperCase = (str) => {
  return str.toLowerCase() !== str;
};

const hasNumber = (str) => {
  let regex = /\d/g;
  return regex.test(str);
};

const hasSymbol = (str) => {
  return str.match(/[|\\/~^:,;?!&%$#@*+]/) !== null;
};

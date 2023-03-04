document.addEventListener('DOMContentLoaded', () => {
  validate_password_strength();
  validateUsername();
  confirmPassword();

  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    validateForm(event);
  });
});

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

const validateForm = (e) => {
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

  startBtnLoadingAnimation(e.submitter);
  sendFormDataToServer('/register', '/confirm', errorContainer);
};
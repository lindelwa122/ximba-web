document.addEventListener('DOMContentLoaded', () => {
  validate_password_strength();
  confirmPassword();
})

const validateForm = () => {
  const confirmPassword = document.querySelector('.confirm-password');
  const errorContainer = document.querySelector('.error-message');
  const password = document.querySelector('.password');
  let isFormValid = true;

  // Ensure no input field is empty
  isFormValid = Array.from(document.querySelectorAll('.input-frame')).every((input) => {
    if (input.value.length === 0) {
      errorContainer.innerText = 'Every input field is required**';
      input.style.borderColor = '#f00';
      return false;
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
  isFormValid = isPasswordInvalid.every((element) => {
    if (element === true) {
      errorContainer.innerText = 'Password is invalid**';
      password.style.borderColor = '#f00';
      return false;
    }
  });

  // Exit if some input is empty of password invalid
  // This works but is not the best solution
  // I will improve this later
  if (!isFormValid) return;

  console.log(document.querySelectorAll('.input-frame'));

  // Ensure username is valid
  if (
    username.value.length < 3 ||
    username.value.length > 16 ||
    hasSymbol(username.value)
  ) {
    errorContainer.innerText = 'Username is invalid**';
    username.style.borderColor = '#f00';
    return false;
  }

  // Ensure password matches
  if (password.value !== confirmPassword.value) {
    errorContainer.innerText = 'Password does not match**';
    confirmPassword.style.borderColor = '#f00';
    return false;
  }

  sendFormDataToServer('/new_password', '/index', errorContainer);
};

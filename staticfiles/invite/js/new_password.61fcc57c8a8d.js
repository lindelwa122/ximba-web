document.addEventListener('DOMContentLoaded', () => {
  validate_password_strength();
  confirmPassword();

  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    validateForm();
  });
});

const validateForm = () => {
  const confirmPassword = document.querySelector('.confirm-password');
  const errorContainer = document.querySelector('.error-message');
  const password = document.querySelector('.password');
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

  // Ensure password matches
  if (password.value !== confirmPassword.value) {
    formErrorRender(
      confirmPassword,
      errorContainer,
      'Password does not match**'
    );
    return false;
  }

  sendFormDataToServer(window.location.pathname, '/login', errorContainer);
};

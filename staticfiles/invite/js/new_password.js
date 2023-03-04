document.addEventListener('DOMContentLoaded', () => {
  validate_password_strength();
  confirmPassword();

  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    validateForm(event);
  });

  const password = document.querySelector('.password');
  password.addEventListener('input', () => {
    isPasswordConfirmed()
      ? (document.querySelector('.confirm').style.color = '#3ec70b')
      : (document.querySelector('.confirm').style.color = '#212529');
  });
});

const validateForm = (e) => {
  const confirmPassword = document.querySelector('.confirm-password');
  let errorContainer;
  const password = document.querySelector('.password');
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
      errorContainer = document.querySelector(`.${inputName}-empty`);

      formErrorRender(input, errorContainer);
      isFormValid = false;
    }
  });

  if (!isFormValid) {
    return;
  }

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
      let errorContainer = document.querySelector('.password-invalid');
      formErrorRender(password, errorContainer);
      isFormValid = false;
    }
  });

  // Exit if some input is empty of password invalid
  // This works but is not the best solution
  // I will improve this later
  if (!isFormValid) return;

  // Ensure password matches
  if (password.value !== confirmPassword.value) {
    errorContainer = document.querySelector('.confirm-password-invalid');
    formErrorRender(confirmPassword, errorContainer);
    return false;
  }

  startBtnLoadingAnimation(e.submitter);
  sendFormDataToServer(window.location.pathname, '/login');
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    validateForm();
  });
});

const validateForm = () => {
  const code = document.querySelector('.code');
  const errorContainer = document.querySelector('.error-message');

  if (code.value === '') {
    formErrorRender(
      code,
      errorContainer,
      "Code mustn't be empty check your emails for a code"
    );
    return false;
  }

  if (code.value.length !== 6) {
    formErrorRender(
      code,
      errorContainer,
      'Code must be 6 digits, check your emails for a correct code'
    );
    return false;
  }

  if (isNaN(code.value)) {
    formErrorRender(
      code,
      errorContainer,
      'Code must only be digits, check your emails for a correct code'
    );
    return false;
  }

  sendFormDataToServer('/confirm_email', '/index', errorContainer);
};

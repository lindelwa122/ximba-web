document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    validateForm(event);
  });
});

const validateForm = (e) => {
  const code = document.querySelector('.code');
  let errorContainer;

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

  if (code.value === '') {
    errorContainer = document.querySelector('.code-empty');
    formErrorRender(code, errorContainer);
    return false;
  }

  if (code.value.length !== 6) {
    errorContainer = document.querySelector('.code-long');
    formErrorRender(code, errorContainer);
    return false;
  }

  if (isNaN(code.value)) {
    errorContainer = document.querySelector('.code-nan');
    formErrorRender(code, errorContainer);
    return false;
  }

  startBtnLoadingAnimation(e.submitter);
  sendFormDataToServer('/confirm', '/');
};

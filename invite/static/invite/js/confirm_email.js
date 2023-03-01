document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    validateForm(event);
  });

  const resendCode = document.querySelector('.resend-code');
  resendCode.addEventListener('click', () => {
    resendCode.textContent = 'Sending Code...';
    resendCode.classList.add('disabled');
    fetch('/resend-code')
      .then((response) => {
        if (response.status === 200) {
          alert('A new code has been sent to your email');
          return
        }
        throw new Error('Couldn\'t send code. Check your internet connection and try again later');
      })
      .catch((error) => {
        alert(error);
        console.error(error);
      })
      .finally(() => {
        resendCode.textContent = 'Send Code.';
        resendCode.classList.remove('disabled');
      });
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

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    let invalid = false;
    const errorContainer = document.querySelector('.error-message');
    document.querySelectorAll('.input-frame').forEach((input) => {
      if (input.value.length === 0) {
        formErrorRender(input, errorContainer);
        invalid = true;
      }
    });

    if (!invalid) {
      startBtnLoadingAnimation(event.submitter);
      sendFormDataToServer('/login', '/home');
    }
  });

  // Change text in the form-header
  const formHeader = document.querySelector('.form-header');

  setTimeout(() => {
    formHeader.classList.add('change-text');

    formHeader.addEventListener('transitionend', () => {
      formHeader.classList.remove('change-text');
      formHeader.textContent = 'Your one-stop-shop for all the hottest events.';
    });
  }, 10000);
});

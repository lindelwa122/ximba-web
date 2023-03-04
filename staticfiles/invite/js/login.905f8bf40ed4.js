document.addEventListener('DOMContentLoaded', () => {
  console.log('Form is being submitted');
  console.log(document.querySelector('form'));
  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    let invalid = false;
    const errorContainer = document.querySelector('.error-message');
    document.querySelectorAll('.input-frame').forEach((input) => {
      if (input.value.length === 0) {
        formErrorRender(
          input,
          errorContainer,
          'Every input field is required**'
        );
        invalid = true;
      }
    });

    if (!invalid) {
      startBtnLoadingAnimation(event.submitter);
      sendFormDataToServer('/login', '/', errorContainer);
    }
  });
});

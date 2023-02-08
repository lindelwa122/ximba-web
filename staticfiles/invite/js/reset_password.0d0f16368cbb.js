document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    sendFormDataToServer(
      '/reset_password',
      '/reset_password',
      document.querySelector('.error-message')
    );
  });
});

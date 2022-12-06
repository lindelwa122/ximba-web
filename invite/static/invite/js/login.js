document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('form').addEventListener('submit', () => {
    sendFormDataToServer('/login', '/index', document.querySelector('error-message'));
  })
})
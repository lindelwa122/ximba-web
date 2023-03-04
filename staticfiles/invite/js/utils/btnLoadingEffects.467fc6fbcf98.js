document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.submit-button').forEach((button, index) => {
    button.addEventListener('click', (e) => {
      startBtnLoadingAnimation(e, index);
    });
  });
});

const startBtnLoadingAnimation = (event, index = 0) => {
  let spinner;
  const button = event.currentTarget === undefined ? event : event.currentTarget;

  if (button.nodeName === 'BUTTON') {
    const text = button.children[0];
    text.style.display = 'none';
    spinner = button.children[1];
  } else if (button.nodeName === 'INPUT') {
    button.style.display = 'none';
    spinnerContainer = button.nextElementSibling;
    spinnerContainer.classList.remove('d-none');
    spinner = spinnerContainer.children[0];
  }
  
  // Disable the button
  button.disabled = true;
  spinner.style.display = 'inline-block';

  // Store the index in localstorage for stopping the animation later on
  localStorage.setItem('clickedButtonIndex', index);
};

const stopBtnLoadingAnimation = () => {
  const index = localStorage.getItem('clickedButtonIndex');
  const allSubmitButtons = document.querySelectorAll('.submit-button');
  const button = allSubmitButtons.length !== 0 ? allSubmitButtons[index] : document.querySelector('input[type="submit"]');
  let spinner;

  if (button.nodeName === 'BUTTON') {
    const text = button.children[0];
    text.style.display = 'inline-block';
    spinner = button.children[1];
  } else if (button.nodeName === 'INPUT') {  
    spinnerContainer = button.nextElementSibling;
    spinnerContainer.classList.add('d-none');
    spinner = spinnerContainer.children[0];
    button.style.display = 'inline-block';
  }

  // Enable button
  button.removeAttribute('disabled');
  spinner.style.display = 'none';
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.submit-button').forEach((button, index) => {
    button.addEventListener('click', (e) => {
      if (!button.classList.contains('no-immediate-load')) {
        startBtnLoadingAnimation(e, index);
      }
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
    // Store the index in localstorage for stopping the animation later on
    localStorage.setItem('clickedButtonIndex', index);
  } else if (button.nodeName === 'INPUT') {
    button.style.display = 'none';
    spinnerContainer = button.nextElementSibling;
    spinnerContainer.classList.remove('d-none');
    spinner = spinnerContainer.children[0];
  }
  
  // Disable the button
  button.disabled = true;
  spinner.style.display = 'inline-block';

};

const stopBtnLoadingAnimation = () => {
  const index = localStorage.getItem('clickedButtonIndex');
  const allSubmitButtons = document.querySelectorAll('.submit-button');
  const button = index ? allSubmitButtons[index] : document.querySelector('input[type="submit"]');

  console.log(index);
  console.log(button);

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

  // Clear localStorage
  localStorage.removeItem('clickedButtonIndex');

  // Enable button
  button.removeAttribute('disabled');
  spinner.style.display = 'none';
};

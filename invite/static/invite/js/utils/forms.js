// Renders form errors
const formErrorRender = (inputContainer, errorContainer, message) => {
  inputContainer.style.borderColor = '#f00';
  errorContainer.innerText = message;
};

// Sends form data to the server
const sendFormDataToServer = (
  routeTo,
  routeNext,
  errorContainer,
  method = 'POST'
) => {
  const aj = new XMLHttpRequest();
  const data = {};
  // const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;

  aj.addEventListener('readystatechange', () => {
    if (aj.readyState === 4 && aj.status === 200) {
      window.location(routeNext);
    } else if (aj.readyState === 4 && aj.status !== 200) {
      // TODO
    }
  });

  // Collect form data
  document.querySelectorAll('.input-frame').forEach((element) => {
    data[element.classList[0]] = element.value;
  });

  aj.open(method, routeTo, true);
  aj.setRequestHeader('Data-type', 'json');
  aj.setRequestHeader('Content-type', 'application/json');
  // aj.setRequestHeader('X-CSRFToken', csrfToken);
  aj.send(JSON.stringify(data));
};

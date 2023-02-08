const validate_password_strength = () => {
  const password = document.querySelector('.password');

  password.addEventListener('focus', () => {
    document.querySelector('.password-help').classList.remove('d-none');
  });

  password.addEventListener('input', () => {
    password.value.length >= 8 && password.value.length <= 16
      ? (document.querySelector('.char').style.color = '#3ec70b')
      : (document.querySelector('.char').style.color = '#212529');

    hasLowerCase(password.value)
      ? (document.querySelector('.lower').style.color = '#3ec70b')
      : (document.querySelector('.lower').style.color = '#212529');

    hasUpperCase(password.value)
      ? (document.querySelector('.upper').style.color = '#3ec70b')
      : (document.querySelector('.upper').style.color = '#212529');

    hasNumber(password.value)
      ? (document.querySelector('.number').style.color = '#3ec70b')
      : (document.querySelector('.number').style.color = '#212529');

    hasSymbol(password.value)
      ? (document.querySelector('.symbol').style.color = '#3ec70b')
      : (document.querySelector('.symbol').style.color = '#212529');
  });
};

const confirmPassword = () => {
  const confirm = document.querySelector('.confirm-password');

  confirm.addEventListener('focus', () => {
    document.querySelector('.confirm-help').classList.remove('d-none');
  });

  confirm.addEventListener('input', () => {
    isPasswordConfirmed()
      ? (document.querySelector('.confirm').style.color = '#3ec70b')
      : (document.querySelector('.confirm').style.color = '#212529');
  });
};

const hasLowerCase = (str) => {
  return str.toUpperCase() !== str;
};

const hasUpperCase = (str) => {
  return str.toLowerCase() !== str;
};

const hasNumber = (str) => {
  const regex = /\d/g;
  return regex.test(str);
};

const hasSymbol = (str) => {
  return str.match(/[|\\/~^:,;?!&%$#@*+]/) !== null;
};

const isPasswordConfirmed = () => {
  return (
    document.querySelector('.password').value ===
    document.querySelector('.confirm-password').value
  );
};

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
  const csrfToken = document.querySelector(
    'input[name="csrfmiddlewaretoken"]'
  ).value;

  aj.addEventListener('readystatechange', () => {
    if (aj.readyState === 4 && aj.status === 200) {
      window.location.href = routeNext;
    } else if (aj.readyState === 4 && aj.status !== 200) {
      errorContainer.innerText = JSON.parse(aj.response).message;
    }
  });

  // Collect form data
  document.querySelectorAll('.input-frame').forEach((element) => {
    data[element.classList[0]] = element.value;
  });

  aj.open(method, routeTo, true);
  aj.setRequestHeader('Data-type', 'json');
  aj.setRequestHeader('Content-type', 'application/json');
  aj.setRequestHeader('X-CSRFToken', csrfToken);
  aj.send(JSON.stringify(data));
};

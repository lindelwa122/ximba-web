const validate_password_strength = () => {
  const password = document.querySelector('.password');

  password.addEventListener('focus', () => {
    document.querySelector('.password-help').classList.remove('d-none');
  });

  password.addEventListener('blur', () => {
    document.querySelector('.password-help').classList.add('d-none');
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

  confirm.addEventListener('blur', () => {
    document.querySelector('.confirm-help').classList.add('d-none');
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
const formErrorRender = (inputContainer, errorContainer) => {
  inputContainer.classList.add('is-invalid');
  errorContainer.classList.remove('d-none');
};

// Sends form data to the server
const sendFormDataToServer = (routeTo, routeNext, method = 'POST') => {
  const data = {};
  const csrfToken = document.querySelector(
    'input[name="csrfmiddlewaretoken"]'
  ).value;

  // Collect form data
  document.querySelectorAll('.input-frame').forEach((element) => {
    element.classList.remove('is-invalid');
    data[element.classList[0]] = element.value;
  });

  document.querySelectorAll('.error-message').forEach((element) => {
    if (!element.classList.contains('d-none')) {
      element.classList.add('d-none');
    }
  });

  fetch(routeTo, {
    method: method,
    body: JSON.stringify(data),
    headers: {
      'X-CSRFToken': csrfToken,
    },
  })
    .then((response) => {
      // Remove the loading animation
      stopBtnLoadingAnimation();

      if (response.status === 200) {
        window.location.href = routeNext;
      }
      return response.json();
    })
    .then(({ error_type }) => {
      console.log(error_type);
      formErrorHandler(error_type);
    })
    .catch((error) => {
      console.error(error);
    });
};

const formErrorHandler = (errorType) => {
  let errorContainer;
  let passwordField = document.querySelector('.password');
  let confirmPasswordField = document.querySelector('.confirm-password');
  let emailField = document.querySelector('.email');
  let confirmCodeField = document.querySelector('.code');

  switch (errorType) {
    case 'confirm_code_expired':
      errorContainer = document.querySelector('.code-expired');
      formErrorRender(confirmCodeField, errorContainer);
      throw new Error('Code incorrect.');

    case 'confirm_code_not_match':
      errorContainer = document.querySelector('.code-invalid');
      formErrorRender(confirmCodeField, errorContainer);
      throw new Error('Code incorrect.');

    case 'confirm_invalid':
      errorContainer = document.querySelector('.confirm-password-invalid');
      formErrorRender(confirmPasswordField, errorContainer);
      throw new Error("Passwords don't match.");

    case 'empty':
      const inputFields = document.querySelectorAll('.input-frame');
      document.querySelectorAll('.feedback-empty').forEach((el, index) => {
        formErrorRender(inputFields[index], el);
      });
      throw new Error('Form empty');

    case 'link_sent':
      errorContainer = document.querySelector('.link-sent');
      errorContainer.style.color = '#3ec70b';
      emailField.style.borderColor = '#3ec70b';
      formErrorRender(emailField, errorContainer);
      throw new Error('Link sent');

    case 'login':
      errorContainer = document.querySelector('.error-message');
      errorContainer.textContent =
        'Username/Password incorrect. Try resetting your password.';
      document.querySelectorAll('.input-frame').forEach((input) => {
        formErrorRender(input, errorContainer);
      });
      throw new Error('Username/Password incorrect.');

    case 'mail_404':
      errorContainer = document.querySelector('.email-404');
      formErrorRender(emailField, errorContainer);
      throw new Error('Email not found on our databases');

    case 'mail_taken':
      errorContainer = document.querySelector('.email-taken');
      formErrorRender(emailField, errorContainer);
      throw new Error('Email is already taken');

    case 'password_invalid':
      errorContainer = document.querySelector('.password-invalid');
      formErrorRender(passwordField, errorContainer);
      throw new Error('Password is invalid');

    case 'username_taken':
      let usernameField = document.querySelector('.username');
      errorContainer = document.querySelector('.username-taken');
      formErrorRender(usernameField, errorContainer);
      throw new Error('Username is already taken');
  }
};

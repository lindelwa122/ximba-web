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
  let regex = /\d/g;
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
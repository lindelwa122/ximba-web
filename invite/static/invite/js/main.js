document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.nav-controller').addEventListener('click', () => {
    rotateAnimation('sm');
    shrinkExpandAnimation();
    showHideAnimation();
  });

  document.querySelector('.nav-controller-lg').addEventListener('click', () => {
    rotateAnimation('lg');
    shrinkExpandAnimationForLargeDevices();
    showHideAnimation();
  });
});

const rotateAnimation = (device) => {
  const navController =
    device === 'sm'
      ? document.querySelector('.nav-controller')
      : document.querySelector('.nav-controller-lg');
      
  if (navController.classList.contains('rotate')) {
    navController.classList.remove('rotate');
    navController.classList.add('rotate-back');
  } else {
    navController.classList.remove('rotate-back');
    navController.classList.add('rotate');
  }
};

const shrinkExpandAnimation = () => {
  const nav = document.querySelector('.nav-sm');
  if (nav.classList.contains('expand')) {
    nav.classList.remove('expand');
    nav.classList.add('shrink');
  } else {
    nav.classList.remove('shrink');
    nav.classList.add('expand');
  }
};

const shrinkExpandAnimationForLargeDevices = () => {
  const nav = document.querySelector('.nav-lg');
  if (nav.classList.contains('expand-lg')) {
    nav.classList.remove('expand-lg');
    nav.classList.add('shrink-lg');
  } else {
    nav.classList.remove('shrink-lg');
    nav.classList.add('expand-lg');
  }
};

const showHideAnimation = () => {
  document.querySelectorAll('.icon').forEach((element) => {
    if (element.classList.contains('show')) {
      element.classList.remove('show');
      element.classList.add('hide');
      element.addEventListener('animationend', () => {
        if (element.classList.contains('hide')) {
          element.style.display = 'none';
        }
      });
    } else {
      element.classList.remove('hide');
      element.classList.add('show');
      element.setAttribute(
        'style',
        `
        align-items: center;
        display: flex;
        justify-content: center;
      `
      );
    }
  });
};

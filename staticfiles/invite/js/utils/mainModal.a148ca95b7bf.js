const mainModalHistory = [];
let index = 0;

const addContentToMainModal = (title, content, callBack) => {
  const modalPage = document.querySelector('.modal-page');
  
  // Disable scrolling
  document.querySelector('body').classList.add('modal-open');

  // Add the overlay
  document.querySelector('.modal-overlay').classList.add('active');

  // Disable scrolling while the modal is still transitioning
  modalPage.style.overflow = 'hidden';
  
  // Enable scrolling when the transition is over.
  // The reason I don't listen for the 'transitionend' event is 
  // because I get undesired effects
  setInterval(() => {
    modalPage.style.overflow = 'auto';
  }, 1000);

  // Display the modal
  modalPage.classList.add('show');

  const modalTitle = document.querySelectorAll('.modal-page-title');
  const modalPageContent = document.querySelector('.modal-page-content');
  // Set the title of the modal
  modalTitle.forEach((t) => (t.textContent = title));

  // Clear the old content
  modalPageContent.innerHTML = '';

  // Append the new content
  modalPageContent.append(content());

  // Execute function
  for (const item of callBack || []) {
    const {func, values} = item;
    
    if (typeof func === 'function') {
      func(...values);
    }
  }
}

const addToMainModalHistory = (title, content, callBack=null) => {
  mainModalHistory.push({title: title, content: content, callBack: callBack});
  index = mainModalHistory.length - 1;
  
  // Add content to the modal
  addContentToMainModal(title, content, callBack);

  // Add go-back event listener
  document.querySelectorAll('.modal-go-back').forEach((el) => {
    el.addEventListener('click', goBackInMainModalHistory);
  });
    
  // Add cancel (remove-modal) event listener
  document.querySelectorAll('.modal-page-cancel').forEach((x) => {
    x.addEventListener('click', closeMainModal);
  });
}

const closeMainModal = () => {
  const modalPage = document.querySelector('.modal-page');

  // Activate page again
  const activatePage = () => {
    // Remove the modal overlay
    document.querySelector('.modal-overlay').classList.remove('active');

    // Enable scrolling
    document.querySelector('body').classList.remove('modal-open');

    // Remove the title
    document.querySelectorAll('.modal-page-title').forEach(t => t.textContent = '');

    // Clear the content
    document.querySelector('.modal-page-content').innerHTML = '';

    // Remove the event listener
    modalPage.removeEventListener('transitionend', activatePage);
  }

  modalPage.addEventListener('transitionend', activatePage);

  // Close the modal
  modalPage.classList.remove('show');

  // Remove the select class name on the navigation bar
  document.querySelectorAll('.nav-icon-wrapper-lg').forEach((el) => {
    el.classList.remove('selected');
    checkProfileAuthenticity();
  })

  // Resetting modal history
  mainModalHistory.length = 0;
  index = 0;

  // Remove go-back event listener
  document.querySelectorAll('.modal-go-back').forEach((el) => {
    el.removeEventListener('click', goBackInMainModalHistory);
  });
}

const goBackInMainModalHistory = () => {
  if (index === 0) {
    closeMainModal();
    return;
  }

  index = index - 1;

  const current = mainModalHistory[index]
  
  mainModalHistory.splice(index);
  mainModalHistory.push(current);
  
  addContentToMainModal(current.title, current.content, current.callBack);
}

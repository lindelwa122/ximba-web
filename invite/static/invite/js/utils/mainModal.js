const mainModalHistory = [];
let index = 0;

const addContentToMainModal = (title, content, padding) => {
  document.querySelector('.modal-page').style.display = 'inline-block';

  const modalTitle = document.querySelectorAll('.modal-page-title');
  const modalPage = document.querySelector('.modal-page-content');
  modalTitle.forEach((t) => (t.textContent = title));

  modalPage.style.padding = padding;
  modalPage.innerHTML = '';
  modalPage.append(content());
}

const addToMainModalHistory = (title, content, padding = 0) => {
  mainModalHistory.push({title: title, content: content, padding: padding});
  index = mainModalHistory.length - 1;

  console.log(mainModalHistory);
  console.log(index);
  
  // Add content to the modal
  addContentToMainModal(title, content, padding);

  // Add go-back event listener
  document.querySelectorAll('.modal-go-back').forEach((el) => {
    el.addEventListener('click', goBackInMainModalHistory);
  })
    
  // Add cancel (remove-modal) event listener
  document.querySelector('.modal-page-cancel').addEventListener('click', closeMainModal);
}

const closeMainModal = () => {
  document.querySelectorAll('.modal-page-title').forEach(t => t.textContent = '');
  document.querySelector('.modal-page-content').innerHTML = '';
  document.querySelector('.modal-page').style.display = 'none';

  // Resetting modal history
  mainModalHistory.length = 0;
  index = 0;

  // Remove go-back event listener
  document.querySelectorAll('.modal-go-back').forEach((el) => {
    el.removeEventListener('click', goBackInMainModalHistory);
  });
}

const goBackInMainModalHistory = () => {
  console.log(mainModalHistory);

  if (index === 0) {
    closeMainModal();
    return;
  }

  index = index - 1;

  const current = mainModalHistory[index]
  
  mainModalHistory.splice(index);
  mainModalHistory.push(current);
  
  addContentToMainModal(current.title, current.content, current.padding);
}

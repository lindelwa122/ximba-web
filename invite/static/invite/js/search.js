document.querySelectorAll('.search-btn').forEach((el) => {
  el.addEventListener('click', () => {
    // TODO
    addToMainModalHistory('Search', searchContent, '10px');
  });
});

const searchContent = () => {
  // Creating Elements
  const container = document.createElement('div');
  const searchInput = document.createElement('input');
  const recents = document.createElement('div');
  const searched = document.createElement('div');

  // Appending
  container.append(recents);
  container.append(searched);
  container.append(searchInput);
  // Adding Classes

  container.classList = 'search-container';
  searchInput.classList = 'search-input';
  recents.classList = 'search-recents';
  recents.innerHTML = `
  <h2>Recents</h2>
  <div class='d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom border-dark'>
  <div>
    <div class='d-flex align-items-center'>
      <img
        src='https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=581&q=80'
        width='15%' alt='A Cake' />
      <div class='ms-2'>Soccer Tournament</div>
    </div>
  </div>
  <div class='close'>
  <i class='fa-solid fa-xmark'></i>
</div>
</div>

  <div class='d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom border-dark'>
  <div>
    <div class='d-flex align-items-center'>
      <img
        src='https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=581&q=80'
        width='15%' alt='A Cake' />
      <div class='ms-2'>Soccer Tournament</div>
    </div>

  </div>

  <div class='close'>
    <i class='fa-solid fa-xmark'></i>
  </div>
</div>
  <div class='d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom border-dark'>
  <div>
    <div class='d-flex align-items-center'>
      <img
        src='https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=581&q=80'
        width='15%' alt='A Cake' />
      <div class='ms-2'>Soccer Tournament</div>
    </div>
  </div>
  <div class='close'>
  <i class='fa-solid fa-xmark'></i>
</div>
</div>
  `;

  searched.classList = 'searched';
  searched.innerHTML = `<h2>Searched</h2>`;
  searchInput.addEventListener('focus', () => {
    searchInput.style.top = '14%';
    recents.style.height = '0';
    recents.style.visibility = 'hidden';
    searched.style.height = '100%';
    searched.style.visibility = 'visible';
  });
  return container;
};

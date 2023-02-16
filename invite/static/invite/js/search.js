document.querySelectorAll('.search-btn').forEach((el) => {
  el.addEventListener('click', () => {
    addToMainModalHistory('Recents', searchContent, '10px');

    document.querySelector('.search-input').addEventListener('focus', () => {
      document.querySelector('.search-input-container').classList.add('move-to-top');

      document.querySelector('.move-to-top').addEventListener('animationend', () => {
        document.querySelector('.move-to-top').style.top = '10px';

        // Change the title of the modal
        document.querySelectorAll('.modal-page-title').forEach((title) => {
          title.textContent = 'Search';
        });
      })
    });
  });
});

const searchContent = () => {
  // Creating Elements
  const container = document.createElement('div');

  container.className = 'search-container';

  container.innerHTML = `
    <div class='search-input-container'>
      <input type='search' class='form-control input-frame search-input' placeholder="Try  'jane',  'cape town',  'wedding'">
      <div class='search-icon-wrapper'>
        <i class='bi bi-search'></i>
      </div>
    </div>
  `

  return container;
};

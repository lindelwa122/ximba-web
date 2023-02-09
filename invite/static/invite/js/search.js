document.querySelectorAll('.search-btn').forEach((el) => {
  el.addEventListener('click', () => {
    // TODO
  });
});

const searchContent = () => {
  // Creating Elements
  const container = document.createElement('div');
  const searchInput = document.createElement('input');
  const recents = document.createElement('div');
  const searched = document.createElement('div');
  const dimmy1 = document.createElement('div');
  const dimmy2 = document.createElement('div');
  const dummy = document.createElement('div');
  const searchTabs = document.createElement('div');
  // Appending
  container.appendChild(searchInput);
  container.appendChild(recents);
  container.appendChild(searched);
  recents.appendChild(dimmy1);
  recents.appendChild(dimmy2);
  searched.appendChild(searchTabs);
  searched.appendChild(dummy);
  // Adding Classes
  container.classList = 'edit-profile';
  searchInput.classList = 'search-input';
  container.classList = 'search-recents';
  container.classList = 'search-tabs';
  container.classList = 'search-users';
  dimmy1.classList = 'dummy';
  dimmy2.classList = 'dummy';
  dummy.classList = 'dummy';
  console.log(container);
  return container;
};
addToMainModalHistory('Search', searchContent, '10px');

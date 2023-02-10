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
  const dimmy1 = document.createElement('div');
  const dimmy2 = document.createElement('div');
  const searchTabs = document.createElement('ul');
  const accounts = document.createElement('li');
  const area = document.createElement('li');
  const events = document.createElement('li');
  const tags = document.createElement('li');
  const past = document.createElement('li');
  const upcoming = document.createElement('li');
  accounts.innerText = 'Accounts';
  area.innerText = 'Area';
  events.innerText = 'Events';
  tags.innerText = 'Tags';
  past.innerText = 'Past';
  upcoming.innerText = 'Upcoming';

  // Appending
  container.append(searchInput);
  container.append(recents);
  recents.append(dimmy1);
  recents.append(dimmy2);
  container.append(searched);
  container.append(searchTabs);
  searchTabs.appendChild(accounts);
  searchTabs.appendChild(area);
  searchTabs.appendChild(events);
  searchTabs.appendChild(tags);
  searchTabs.appendChild(past);
  searchTabs.appendChild(upcoming);
  console.log(searchTabs);
  // Adding Classes

  container.classList = 'search-container';
  searchInput.classList = 'search-input';
  recents.classList = 'search-recents';
  recents.innerHTML = `<h2>Recents</h2>`;
  searchTabs.classList = 'search-tabs';
  searched.classList = 'searched';
  searched.innerHTML = `<h2>Searched</h2>`;

  dimmy1.classList = 'dummy';
  dimmy2.classList = 'dummy';
  console.log(container);
  searchInput.addEventListener('focus', () => {
    searchInput.style.bottom = '76%';
    recents.style.height = '0';
  });
  return container;
};

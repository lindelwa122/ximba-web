const htmlContent = [];

// Draft
// This function saves a draft to the server
const saveDraft = async (url, data, method) => {
  try {
    const response = await fetch(`${url}/draft/save`, {
      method: method,
      body: encodeURIComponent(JSON.stringify(data)),
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
      },
    });

    // If the draft is successfully saved, show an alert message
    if (response.status === 200) {
      alert('Draft saved!');

      // If the method is POST, redirect the user to the home page
      if (method === 'POST') {
        window.location.href = '/home';
      }
    } else {
      // If the draft couldn't be saved, show an error message
      alert("An error occurred and we couldn't save your draft");
    }
  } catch (error) {
    // If an error occurred while saving the draft, show an error message and log the error to the console
    alert("An error occurred and we couldn't save your draft");
    console.error(error);
  }
};

// This function retrieves a saved draft from the server
const getDraft = async (url) => {
  try {
    const response = await fetch(`${url}/get/draft`);

    // If the draft is not found, throw an error
    if (response.status !== 200) {
      throw new Error('Draft Not Found');
    }

    // Parse the response and render the draft
    const { info } = await response.json();
    const draftList = JSON.parse(JSON.parse(info));
    draftList.forEach((item) => htmlContent.push(item));
    renderDraft(draftList);
  } catch (error) {
    // If an error occurred while retrieving the draft, show an error message
    alert(
      "Sorry, we couldn't fetch your draft. Please check your internet connection and reload the page"
    );
  }
};

// This function renders a draft in the UI
const renderDraft = (draftArr) => {
  if (draftArr.length > 0) {
    // Enable saved buttons
    document.querySelector('.save-draft').disabled = false;
    document.querySelector('.save-event-info').disabled = false;
  }

  // Iterate over the items in the draft and create the HTML elements
  draftArr.map((item) => {
    const [selector, value] = Object.entries(item)[0];

    // Creating the container
    const container = document.createElement('div');
    container.className = selector === 'p' ? 'p-wrapper' : 'h-wrapper';
    container.dataset.index = draftArr.indexOf(item);

    // Creating the html content
    const html = document.createElement(selector);
    html.innerHTML = value;
    html.className = selector === 'p' ? '' : 'title';

    // Creating controls
    const controls = document.createElement('div');
    controls.classList =
      selector === 'p' ? 'paragraph-controls mb-3' : 'heading-controls mb-3';
    const type = selector === 'p' ? 'p' : 'h';
    controls.innerHTML = `
      <button class='btn btn-primary btn-small edit-btn ${type} me-2'>Edit</button>
      <button class='btn btn-danger btn-small delete-btn ${type}'>Delete</button>
    `;

    // Append the HTML elements to the container and add it to the UI
    container.append(html, controls);
    document.querySelector('.text-container').appendChild(container);
  });
};

const publishEvent = (url, data) => {
  fetch(`${url}/draft/save`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
    },
  })
    .then((response) => {
      if (response.status === 200) {
        alert('Event Published!');

        fetch('/get-username')
          .then((response) => response.json())
          .then(({ username }) => (window.location.href = `/${username}`))
          .catch((error) => console.error(error));
      } else {
        alert("An error occurred and we couldn't save your draft");
      }
    })
    .catch((error) => {
      alert(
        "An error occurred and we couldn't publish your event. Please check your internet connection and try again later"
      );
      console.error(error);
    });
};

// This function runs when the DOM is loaded and executes a set of tasks
document.addEventListener('DOMContentLoaded', () => {
  // Remove the "selected" class from all the navigation icons
  document.querySelectorAll('.nav-icon-wrapper-lg').forEach((icon) => {
    icon.classList.remove('selected');
  });

  // Add click event handler to the "Add More Event Info" button
  addMoreEventInfoClickHandler();

  // Add input event handler to all editable content elements
  inputEventHandler();

  // Get the current page URL and add click event handlers to the "Save Draft" and "Save Event Info" buttons
  const url = window.location.pathname;
  document.querySelector('.save-draft').addEventListener('click', () => {
    saveDraft(url, htmlContent, 'PUT');
  });

  document.querySelector('.save-event-info').addEventListener('click', () => {
    saveDraft(url, htmlContent, 'POST');
  });

  // Load any existing drafts for the current page
  getDraft(url);

  // Add click event handler to the "Preview" button and toggle the display of various elements
  const previewBtn = document.querySelector('.preview-event-info');
  previewBtn.addEventListener('click', () => {
    previewBtn.textContent =
      previewBtn.textContent === 'Preview' ? 'Edit' : 'Preview';

    document.querySelector('.add').classList.toggle('d-none');

    const pControls = document.querySelectorAll('.paragraph-controls');

    if (pControls.length > 0) {
      pControls.forEach((ele) => {
        ele.classList.toggle('d-none');
      });
    }

    const hControls = document.querySelectorAll('.heading-controls');
    if (hControls.length > 0) {
      hControls.forEach((ele) => {
        ele.classList.toggle('d-none');
      });
    }

    const saveButtonWrapper = document.querySelectorAll('.save-button-wrapper');
    if (saveButtonWrapper.length > 0) {
      saveButtonWrapper.forEach((ele) => {
        ele.classList.toggle('d-none');
      });
    }
  });
});

const addMoreEventInfoClickHandler = () => {
  document.querySelector('.main-content').addEventListener('click', (event) => {
    const targetClassList = event.target.classList;
    const promptContainer = document.querySelector('.prompt-type');
    const add = document.querySelector('.add');
    const textContainer = document.querySelector('.text-container');

    const showPrompt = () => {
      const toggleIcon = add.querySelector('.bi');
      toggleIcon.classList.replace('bi-plus', 'bi-dash');
      promptContainer.style.display = 'block';
      promptContainer.innerHTML = promptInfoType();
    };

    const hidePrompt = () => {
      const toggleIcon = add.querySelector('.bi');
      toggleIcon.classList.replace('bi-dash', 'bi-plus');
      promptContainer.style.display = 'none';
    };

    if (
      targetClassList.contains('add') ||
      targetClassList.contains('add-icon')
    ) {
      const toggleIcon = add.querySelector('.bi');
      toggleIcon.classList.contains('bi-plus') ? showPrompt() : hidePrompt();
      return;
    }

    if (targetClassList.contains('add-heading')) {
      if (!isSpaceAvailable('heading')) {
        alert('You can only add up to 5 headings.');
        return;
      }

      promptContainer.innerHTML = headingPrompt();
      return;
    }

    if (targetClassList.contains('heading')) {
      const headingInput = addHeading(targetClassList[0], 'create');
      textContainer.appendChild(headingInput);
      hidePrompt();
      return;
    }

    if (targetClassList.contains('save-heading')) {
      const container = event.target.closest('.heading-container');
      const { wrapper, saved } = addHeading(null, 'save', container);

      if (!saved) {
        alert('The size of the heading must be between 1 to 35 characters.');
        return;
      }

      textContainer.lastChild.remove();
      textContainer.appendChild(wrapper);

      // Update save and save draft buttons state
      if (htmlContent.length > 0 && htmlContent.length < 5) {
        document.querySelector('.save-event-info').disabled = false;
        document.querySelector('.save-draft').disabled = false;
      }

      return;
    }

    if (targetClassList.contains('add-paragraph')) {
      if (!isSpaceAvailable('paragraph')) {
        alert('You can only add up to 5 paragraphs.');
        return;
      }

      const paragraph = addParagraph('create');
      textContainer.appendChild(paragraph);
      hidePrompt();
      return;
    }

    if (targetClassList.contains('save-paragraph')) {
      const container = event.target.closest('.paragraph-container');
      const { wrapper, saved } = addParagraph('save', container);

      if (!saved) {
        alert(
          'The size of the paragraph must be between 1 to 2000 characters.'
        );
        return;
      }

      textContainer.lastChild.remove();
      textContainer.appendChild(wrapper);

      // Update save and save draft buttons state
      if (htmlContent.length > 0 && htmlContent.length < 5) {
        document.querySelector('.save-event-info').disabled = false;
        document.querySelector('.save-draft').disabled = false;
      }

      return;
    }

    if (targetClassList.contains('edit-btn')) {
      const type = targetClassList.contains('h') ? 'h' : 'p';
      const container = event.target.closest(`.${type}-wrapper`);
      editSaveToggleContent(type, event.target, container);
      return;
    }

    if (targetClassList.contains('save-btn')) {
      const type = targetClassList.contains('h') ? 'h' : 'p';
      const container = event.target.closest(`.${type}-wrapper`);
      if (!editContent(container)) {
        alert(
          "Sorry, we couldn't save your content. If this keeps happening, save your draft and reload the page"
        );
        return;
      }
      editSaveToggleContent(type, event.target, container);
      return;
    }

    if (targetClassList.contains('delete-btn')) {
      const del = confirm(
        'Are you sure you want to delete this text? This action cannot be undone.'
      );
      if (del) {
        const type = targetClassList.contains('h') ? 'h' : 'p';
        const container = event.target.closest(`.${type}-wrapper`);
        deleteContent(container);
        container.remove();
      }
    }

    if (targetClassList.contains('remove-textarea')) {
      const container = event.target.closest('.paragraph-container');
      const removeContainer = confirm(
        'The input box including its content will be removed. Are you sure about this?'
      );
      if (removeContainer) {
        container.remove();
      }
    }

    if (targetClassList.contains('remove-input')) {
      const container = event.target.closest('.heading-container');
      const removeContainer = confirm(
        'The input box including its content will be removed. Are you sure about this?'
      );
      if (removeContainer) {
        container.remove();
      }
    }
  });
};

const editContent = (tag) => {
  const index = tag.dataset.index;
  const newValue = tag.children[0].textContent;
  const tagName = tag.children[0].tagName.toLowerCase();

  const item = htmlContent[parseInt(index)];
  if (item[tagName]) {
    item[tagName] = newValue;
    return true;
  } else {
    return false;
  }
};

const deleteContent = (tag) => {
  const index = tag.dataset.index;
  // Remove content
  htmlContent.splice(parseInt(index), 1);

  const textContainer = document.querySelector('.text-container');
  const children = textContainer.children;

  // Update index
  for (let x = 0; x < children.length; x++) {
    children[x].dataset.index = x;
  }

  // Update save and save draft buttons state
  if (htmlContent.length === 0 || htmlContent.length > 5) {
    document.querySelector('.save-event-info').disabled = true;
    document.querySelector('.save-draft').disabled = true;
  }
};

const isSpaceAvailable = (selector) => {
  let count = 0;

  switch (selector) {
    case 'heading':
      htmlContent.forEach((obj) => {
        if (obj['h1'] || obj['h2'] || obj['h3']) {
          count++;
        }
      });

      return count < 5 ? true : false;

    case 'paragraph':
      htmlContent.forEach((obj) => {
        if (obj['p']) {
          count++;
        }
      });

      return count < 5 ? true : false;

    default:
      return false;
  }
};

const inputEventHandler = () => {
  document.querySelector('.main-content').addEventListener('input', (event) => {
    if (event.target.tagName === 'TEXTAREA') {
      const container = event.target.closest('.paragraph-container');
      const textarea = container.querySelector('textarea');
      const count = container.querySelector('.paragraph-char-count');
      count.textContent = textarea.value.length;
      count.style.color = textarea.value.length > 2000 ? '#f00' : '#212529';
    }

    if (event.target.tagName === 'INPUT') {
      const container = event.target.closest('.heading-container');
      const input = container.querySelector('input');
      const count = container.querySelector('.heading-char-count');
      count.textContent = input.value.length;
      count.style.color = input.value.length > 35 ? '#f00' : '#212529';
    }
  });
};

const editSaveToggleContent = (type, btn, container) => {
  const content =
    type === 'p'
      ? container.querySelector('p')
      : container.querySelector('.title');

  const maxLength = type === 'p' ? 2000 : 35;

  if (
    content.textContent.length === 0 ||
    content.textContent.length > maxLength
  ) {
    alert(
      `The size of this text must be between 1 to ${maxLength} characters.`
    );
    return;
  }

  btn.classList.toggle('edit-btn');
  btn.classList.toggle('save-btn');
  btn.classList.toggle('btn-primary');
  btn.classList.toggle('btn-secondary');
  btn.textContent = btn.textContent === 'Save' ? 'Edit' : 'Save';
  content.classList.toggle('edit-block');

  content.contentEditable =
    content.contentEditable === 'inherit' ? true : 'inherit';
};

const promptInfoType = () => {
  return `
    <div class='add-heading border-bottom border-dark'>Add a Heading</div>
    <div class='add-paragraph'>Add a Paragraph</div>
  `;
};

const addParagraph = (method, clickedContainer = null) => {
  if (method === 'create') {
    const container = document.createElement('div');
    container.classList = 'paragraph-container mb-3';

    const textAreaContainer = document.createElement('div');
    textAreaContainer.className = 'textarea';

    textAreaContainer.innerHTML = `
      <div class='text-end'><span class='paragraph-char-count'>0</span>/2000</span>
      <textarea class='form-control input-frame mb-1'></textarea>
    `;

    const actionBtnsContainer = document.createElement('div');
    actionBtnsContainer.classList = 'heading-buttons buttons-container';

    actionBtnsContainer.innerHTML = `
      <div class='d-flex justify-content-end save-button-wrapper'>
        <button class='btn btn-secondary-outline btn-small remove-textarea me-2'>Remove</button>
        <button class='btn btn-secondary btn-small save-paragraph'>Save</button>
      </div>
    `;

    container.append(textAreaContainer, actionBtnsContainer);
    return container;
  }

  if (method === 'save') {
    const textarea = clickedContainer.querySelector('textarea');

    if (textarea.value.length === 0 || textarea.value.length > 2000) {
      const container = null;
      const saved = false;
      return { container, saved };
    }

    const paragraphText = textarea.value;
    const text = document.createTextNode(paragraphText);

    const wrapper = document.createElement('div');
    wrapper.className = 'p-wrapper';
    wrapper.dataset.index = htmlContent.length;
    const p = document.createElement('p');

    const obj = { p: textarea.value.trim() };
    htmlContent.push(obj);

    const paragraphControls = document.createElement('div');
    paragraphControls.classList = 'paragraph-controls mb-3';
    paragraphControls.innerHTML = `
      <button class='btn btn-primary btn-small edit-btn p me-2'>Edit</div>
      <button class='btn btn-danger btn-small delete-btn p'>Delete</div>
    `;

    p.appendChild(text);
    wrapper.append(p, paragraphControls);

    const saved = true;
    return { wrapper, saved };
  }
};

const addHeading = (level, method, clickedContainer = null) => {
  if (method === 'create') {
    const container = document.createElement('div');
    container.classList = 'heading-container mb-3';

    const heading = document.createElement('div');
    heading.className = 'heading-content';

    heading.innerHTML = `
      <div class='text-end'><span class='heading-char-count'>0</span>/35</span>
      <input class='form-control input-frame mb-1' data-heading='${level}' />
    `;

    const actionBtnsContainer = document.createElement('div');
    actionBtnsContainer.classList = 'heading-buttons buttons-container';

    actionBtnsContainer.innerHTML = `
      <div class='d-flex justify-content-end save-button-wrapper'>
        <button class='btn btn-secondary-outline btn-small remove-input me-2'>Remove</button>
        <button class='btn btn-secondary btn-small save-heading'>Save</button>
      </div>
    `;

    container.append(heading, actionBtnsContainer);
    return container;
  }

  if (method === 'save') {
    const wrapper = document.createElement('div');
    wrapper.className = 'h-wrapper';

    const input = clickedContainer.querySelector('input');
    if (input.value.length === 0 || input.value.length > 35) {
      const title = null;
      const saved = false;
      return { title, saved };
    }

    const headingText = document.createTextNode(input.value);
    const headingLevel = input.dataset.heading;

    // Add heading to htmlContent list
    wrapper.dataset.index = htmlContent.length;
    const obj = { [headingLevel]: input.value.trim() };
    htmlContent.push(obj);

    const headingControls = document.createElement('div');
    headingControls.classList = 'heading-controls mb-3';
    headingControls.innerHTML = `
      <button class='btn btn-primary btn-small edit-btn h me-2'>Edit</div>
      <button class='btn btn-danger btn-small delete-btn h'>Delete</div>
    `;

    const heading = document.createElement(headingLevel);
    heading.className = 'title';
    heading.appendChild(headingText);

    wrapper.append(heading, headingControls);

    const saved = true;
    return { wrapper, saved };
  }
};

const headingPrompt = () => {
  return `
    <div class='border-bottom border-dark'>
      <h1 class='h1 heading'>Add Heading 1</h1>
    </div>
    <div class='border-bottom border-dark'>
      <h2 class='h2 heading'>Add Heading 2</h2>
    </div>
    <div>
      <h3 class='h3 heading'>Add Heading 3</h3>
    </div>
  `;
};

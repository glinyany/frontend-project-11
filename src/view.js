const buttonHandler = (isBlocked, input, button) => {
  if (isBlocked) {
    input.setAttribute('readonly', '');
    button.setAttribute('disabled', '');
  } else {
    input.removeAttribute('readonly');
    button.removeAttribute('disabled');
  }
};

const renderErrors = (value, input, feedback, i18n) => {
  if (value === 'null') {
    input.classList.remove('is-invalid');
    input.value = '';
    feedback.textContent = i18n.t('success');
    feedback.classList.replace('text-danger', 'text-success');
  } else {
    input.classList.add('is-invalid');
    feedback.classList.replace('text-success', 'text-danger');
    feedback.textContent = i18n.t(value);
  }
  input.focus();
};

const renderFeeds = (feeds, container, i18n) => {
  container.innerHTML = '';

  const card = document.createElement('div');
  const cardBody = document.createElement('div');
  const h2 = document.createElement('h2');
  const ul = document.createElement('ul');

  card.classList.add('card', 'border-0');
  cardBody.classList.add('card-body');
  h2.classList.add('card-title', 'h4');
  h2.textContent = i18n.t('cards.feeds');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  card.append(cardBody, ul);
  cardBody.append(h2);

  feeds.forEach((feed) => {
    const { title, description } = feed;

    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');
    ul.append(li);

    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = title;

    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = description;
    li.append(h3, p);
  });
  container.append(card);
};

const renderOpenedPosts = (state) => {
  state.postsProcess.clickedElements.forEach((target) => {
    console.log('RENDERING POSTS:', target.dataset.id);
    const element = document.querySelector(`[data-id="${target.dataset.id}"]`);
    element.classList.replace('fw-bold', 'fw-normal');
  });
};

const renderPosts = (state, container, i18n) => {
  const { posts } = state;
  container.innerHTML = '';

  const card = document.createElement('div');
  const cardBody = document.createElement('div');
  const h2 = document.createElement('h2');
  const ul = document.createElement('ul');

  card.classList.add('card', 'border-0');
  cardBody.classList.add('card-body');
  h2.classList.add('card-title', 'h4');
  h2.textContent = i18n.t('cards.posts');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  card.append(cardBody, ul);
  cardBody.append(h2);
  posts.map((el) => el.forEach((post) => {
    const { id, title, url } = post;

    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

    const a = document.createElement('a');
    a.textContent = title;
    a.dataset.id = id;
    a.setAttribute('href', url);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.classList.add('fw-bold');

    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.dataset.id = id;
    button.dataset.bsToggle = 'modal';
    button.dataset.bsTarget = '#modal';
    button.textContent = i18n.t('cards.button');

    li.append(a, button);
    ul.append(li);
  }));

  container.append(card);
  renderOpenedPosts(state);
};

const renderModal = (state, value) => {
  const titleElement = document.querySelector('.modal-title');
  const descriptionElement = document.querySelector('.modal-body');
  const footer = document.querySelector('.modal-footer');
  const readFullBtn = footer.querySelector('a');
  const clickedPostId = value;

  state.posts.map((arr) => arr.forEach((post) => {
    if (post.id === clickedPostId) {
      const { title, description, url } = post;
      titleElement.textContent = title;
      descriptionElement.textContent = description;
      readFullBtn.setAttribute('href', url);
    }
  }));
};

export default (state, path, value, i18next, elements) => {
  const {
    input, submitBtn, feedback, feedsContainer, postsContainer,
  } = elements;

  if (path === 'formState.error') renderErrors(value, input, feedback, i18next);
  if (path === 'formState.isBlocked') buttonHandler(state.formState.isBlocked, input, submitBtn);
  if (path === 'feeds') renderFeeds(state.feeds, feedsContainer, i18next);
  if (path === 'posts') renderPosts(state, postsContainer, i18next);
  if (path === 'postsProcess.clickedElements') renderOpenedPosts(state);
  if (path === 'postsProcess.openedModalId') renderModal(state, value);
};

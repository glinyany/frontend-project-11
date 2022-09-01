const buttonHandler = (isBlocked, input, button) => {
  if (isBlocked) {
    input.setAttribute('readonly', '');
    button.setAttribute('disabled', '');
  } else {
    input.removeAttribute('readonly');
    button.removeAttribute('disabled');
  }
}

const renderErrors = (errorType, input, feedback, i18n) => {
  console.log("Rendering ERR:", errorType);
  if (errorType === 'required') return
  if (errorType === 'null') {
    input.classList.remove('is-invalid');
    input.value = '';
    feedback.textContent = i18n.t('success');
    feedback.classList.replace('text-danger', 'text-success');
    input.focus();
    return;
  }
  input.classList.add('is-invalid');
  feedback.textContent = i18n.t(`errors.${errorType}`);
  feedback.classList.replace('text-success', 'text-danger');
};

const renderFeeds = (feeds, container, i18n) => {
  const card = document.createElement('div');
  const title = document.createElement('div');
  const h2 = document.createElement('h2');
  const ul = document.createElement('ul');

  title.classList.add('card-body');
  h2.classList.add('card-title', 'h4');
  h2.textContent = i18n.t('cards.feeds');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  card.append(title);
  title.append(h2);

  feeds.map((feed) => {
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
  container.append(card, ul);

  console.log(container, card)
};

export default (state, path, i18next, elements) => {
  console.log('view.path:', path);
  const { input, submitBtn, feedback, feedsContainer, postsContainer } = elements;

  if (path === 'error') renderErrors(state.error, input, feedback, i18next);
  if (path === 'formState.isBlocked') buttonHandler(state.formState.isBlocked, input, submitBtn);
  if (path === 'feeds') {
    console.log('Feeds coming:', state.feeds)
    renderFeeds(state.feeds, feedsContainer, i18next);
  }
  //if (path === 'posts') renderPosts(state.posts, postsContainer, i18next);

}


import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import view from './view';
import ru from './locales/ru.js';
import parser from './parser.js';
import 'bootstrap';

const makeRequest = (url) => {
  const encodedUrl = encodeURIComponent(url);
  const proxy = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodedUrl}`;

  return axios.get(proxy)
    .then(({ data }) => {
      return data.contents;
    })
    .catch(() => { throw Error('errors.request'); });
};

const blockForm = (watchedState) => {
  watchedState.formState.isBlocked = true;
};

const unlockForm = (watchedState, response) => {
  watchedState.formState.isBlocked = false;
  watchedState.error = 'null';
  return response;
};

export default () => {
  i18next.init({
    lng: 'ru',
    resources: { ru },
  })

  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.getElementById('url-input'),
    submitBtn: document.querySelector('button[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    feedsContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
  };
  
  const state = {
    formState: {
      inputValue: '',
      isBlocked: false,
    },
    err: null,
    feeds: [],
    posts: [],
  };

  const watchedState = onChange(state, (path) => {
    view(state, path, i18next, elements);
  });

  elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const formData = new FormData(e.target);
    const inputValue = formData.get('url').trim();

    const schema = yup
      .string()
      .url()
      .notOneOf(state.feeds.map((feed) => feed.link))
      .required();

    schema.validate(inputValue)
    .then(() => watchedState.formState.inputValue = inputValue)
    .then(() => blockForm(watchedState))
    .then(() => makeRequest(inputValue))
    .then((response) => unlockForm(watchedState, response))
    .then((response) => parser(response))
    .then((parserResonse) => {
      const { feedObject, feedsPosts } = parserResonse;
      feedObject.link = watchedState.formState.inputValue;
      watchedState.feeds = [...watchedState.feeds, feedObject];
      watchedState.posts = [...watchedState.posts, feedsPosts];
    })
    .catch((err) => { 
      console.log('!catch:', err.type);
      watchedState.error = err.type;
    });
  });
  // elements.container.addEventListener();
};

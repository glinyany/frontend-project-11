import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import view from './view.js';
import ru from './locales/ru.js';
import parser from './parser.js';
import 'bootstrap';
import _ from 'lodash';

const makeRequest = (url) => {
  const encodedUrl = encodeURIComponent(url);
  const proxy = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodedUrl}`;

  return axios.get(proxy)
    .then(({ data }) => {
      return data.contents;
    })
    .catch(() => { throw Error('errors.request'); });
};

const updateData = (watchedState, parsedResponse, posts) => {
  console.log('Updating data..');
  const { feedsPosts } = parsedResponse; // Все посты(старые + новые)

  const existingIds = []; // ID существующих постов
  posts.map(post => post.map(el => existingIds.push(el.id)))
  console.log('__EXST POSTS__:\n', existingIds)

  const newPosts = feedsPosts.filter((post) => {
    console.log(post.id, '***', existingIds);
    return !existingIds.includes(post.id)
  });
  
  console.log(`#New posts: ${newPosts.length}\n`, newPosts)
  if (!_.isEmpty(newPosts)) watchedState.posts.push(newPosts)
};

const refreshData = (watchedState, url, posts) => 
  Promise.resolve(url)
  .then(() => makeRequest(url))
  .then((response) => parser(response)) // parse
  .then((parsedResponse) => updateData(watchedState, parsedResponse, posts))
  .then((setTimeout(() => refreshData(watchedState, url, posts), 5000)));

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
    .then((parsedResponse) => {
      const { feedObject, feedsPosts } = parsedResponse;
      feedObject.link = watchedState.formState.inputValue;
      watchedState.feeds.push(feedObject);
      watchedState.posts.push(feedsPosts);
      // watchedState.feeds = [...state.feeds, feedObject];
      // watchedState.posts = [...state.posts, feedsPosts];
    })
    .then(() => setTimeout(refreshData(watchedState, inputValue, state.posts), 5000))
    .catch((err) => { 
      console.log('!catch:', err.type);
      watchedState.error = err.type;
    });
  });
  // elements.container.addEventListener();
};

/**
http://lorem-rss.herokuapp.com/feed?unit=second&interval=5
https://ru.hexlet.io/lessons.rss

*/
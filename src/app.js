/* eslint-disable no-return-assign */
import onChange from 'on-change';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
import view from './view.js';
import ru from './locales/ru.js';
import parser from './parser.js';
import 'bootstrap';

const makeRequest = (url) => {
  const encodedUrl = encodeURIComponent(url);
  const proxy = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodedUrl}`;

  return axios.get(proxy)
    .then(({ data }) => data.contents)
    .catch(() => { throw Error('errors.request'); });
};

const updateData = (watchedState, parsedResponse, posts) => {
  const { feedsPosts } = parsedResponse;
  const existingIds = [];

  posts.map((post) => post.map((el) => existingIds.push(el.id)));
  const newPosts = feedsPosts.filter((post) => !existingIds.includes(post.id));

  if (!_.isEmpty(newPosts)) watchedState.posts.push(newPosts);
};

const blockForm = (watchedState) => {
  watchedState.formState.isBlocked = true;
};

const unlockForm = (watchedState, response) => {
  watchedState.formState.isBlocked = false;
  watchedState.formState.error = 'no errors';
  return response;
};

export default () => {
  i18next.init({
    lng: 'ru',
    resources: { ru },
  });

  const form = document.querySelector('.rss-form');
  const input = document.getElementById('url-input');
  const submitBtn = document.querySelector('.px-sm-5');
  const feedback = document.querySelector('.feedback');
  const feedsContainer = document.querySelector('.feeds');
  const postsContainer = document.querySelector('.posts');

  const elements = {
    form,
    input,
    submitBtn,
    feedback,
    feedsContainer,
    postsContainer,
  };

  const initialState = {
    formState: {
      error: null,
      isBlocked: false,
    },
    postsProcess: {
      openedModalId: null,
      clickedElements: [],
      error: null,
    },
    feeds: [],
    posts: [],
    urls: [],
  };

  const watchedState = onChange(initialState, (path, value) => {
    view(initialState, path, value, i18next, elements);
  });

  elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const inputValue = formData.get('url').trim();

    const schema = yup
      .string('errors.empty')
      .url('errors.url')
      .notOneOf(watchedState.urls, 'errors.exist')
      .required();

    schema.validate(inputValue)
      .then(() => blockForm(watchedState))
      .then(() => makeRequest(inputValue))
      .then((response) => unlockForm(watchedState, response))
      .then((response) => parser(response, i18next))
      .then((parsedResponse) => {
        if (!watchedState.urls.includes(inputValue)) watchedState.urls.push(inputValue);
        const { feedObject, feedsPosts } = parsedResponse;
        feedObject.link = watchedState.formState.inputValue;
        watchedState.feeds.push(feedObject);
        watchedState.posts.push(feedsPosts);
      })
      .catch((err) => {
        console.log('поймал ошибку:\n', err.message);
        // watchedState.formState.error = i18next.t(err.message);
        watchedState.formState.error = err.message;
      });
  });

  elements.postsContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
      if (!watchedState.postsProcess.clickedElements.includes(e.target)) {
        watchedState.postsProcess.clickedElements.push(e.target);
        if (e.target.tagName === 'BUTTON') watchedState.postsProcess.openedModalId = e.target.dataset.id;
      }
    }
  });

  const getUpdatedPosts = () => {
    const promises = watchedState.urls.map((url) => makeRequest(url)
      .then((response) => parser(response))
      .then((parsedResponse) => updateData(watchedState, parsedResponse, watchedState.posts))
      .catch((err) => {
        watchedState.postsProcess.error = err.message;
      }));
    Promise.all(promises).finally(() => setTimeout(() => getUpdatedPosts(), 5000));
  };
  getUpdatedPosts();
};

/**
links:

http://lorem-rss.herokuapp.com/feed?unit=second&interval=5
https://ru.hexlet.io/lessons.rss

*/

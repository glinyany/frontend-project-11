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

const getErrorCode = (e) => {
  if (e.isParsingError) return 'errors.parse';
  if (e.isAxiosError) return 'errors.request';
  if (e.message === 'already exist') return 'errors.exist';
  if (e.message === 'should be url') return 'errors.url';
  if (e.message === 'empty') return 'errors.empty';

  return 'unknown error';
};

const makeRequest = (url) => {
  const encodedUrl = encodeURIComponent(url);
  const proxy = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodedUrl}`;

  return axios.get(proxy)
    .then(({ data }) => data.contents);
};

const updateData = (watchedState, parsedResponse, posts) => {
  const { feedsPosts } = parsedResponse;
  const existingIds = [];

  posts.map((post) => post.map((el) => existingIds.push(el.id)));
  const newPosts = feedsPosts.filter((post) => !existingIds.includes(post.id));

  if (!_.isEmpty(newPosts)) watchedState.posts.push(newPosts);
};

const getUpdatedPosts = (watchedState) => {
  const urls = watchedState.feeds.map((feed) => feed.link);

  const promises = urls.map((url) => makeRequest(url)
    .then((response) => parser(response))
    .then((parsedResponse) => updateData(watchedState, parsedResponse, watchedState.posts))
    .catch((err) => {
      watchedState.loadingProcess.error = getErrorCode(err);
    }));
  Promise.all(promises).finally(() => setTimeout(() => getUpdatedPosts(watchedState), 5000));
};

const blockForm = (watchedState) => {
  watchedState.formState.isBlocked = true;
  watchedState.formState.isValid = false;
};

const unlockForm = (watchedState, response) => {
  watchedState.formState.isBlocked = false;
  watchedState.formState.isValid = true;
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
      isValid: false,
    },
    uiState: {
      openedModalId: null,
      clickedElements: [],
    },
    loadingProcess: {
      error: null,
    },
    feeds: [],
    posts: [],
  };

  const watchedState = onChange(initialState, (path, value) => {
    view(initialState, path, value, i18next, elements);
  });

  elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const inputValue = formData.get('url').trim();
    const urls = watchedState.feeds.map((feed) => feed.link);

    const schema = yup
      .string('empty')
      .url('should be url')
      .notOneOf(urls, 'already exist')
      .required();

    schema.validate(inputValue)
      .then(() => blockForm(watchedState))
      .then(() => makeRequest(inputValue))
      .then((response) => unlockForm(watchedState, response))
      .then((response) => parser(response))
      .then((parsedResponse) => {
        const { feedObject, feedsPosts } = parsedResponse;
        feedObject.id = _.uniqueId('feed_');
        feedObject.link = inputValue;

        watchedState.feeds.push(feedObject);
        watchedState.posts.push(feedsPosts);
      })
      .catch((err) => {
        watchedState.loadingProcess.error = getErrorCode(err);
      });
  });

  elements.postsContainer.addEventListener('click', (e) => {
    if (e.target.dataset.id) {
      watchedState.uiState.clickedElements.push(e.target);
      if (e.target.tagName === 'BUTTON') watchedState.uiState.openedModalId = e.target.dataset.id;
    }
  });

  getUpdatedPosts(watchedState);
};

/**
links:

http://lorem-rss.herokuapp.com/feed?unit=second&interval=5
https://ru.hexlet.io/lessons.rss

*/

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
  if (e.isParsingError) return 'noRss';
  if (e.isAxiosError) return 'network';

  return e.message;
};

const makeRequest = (url) => {
  const encodedUrl = encodeURIComponent(url);
  const proxy = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodedUrl}`;

  return axios.get(proxy)
    .then(({ data }) => data.contents);
};

const updateData = (watchedState, parsedResponse, posts) => {
  const { feedsPosts } = parsedResponse;

  const existingUrls = posts.map((post) => post.url);
  const newPosts = feedsPosts.filter((newPost) => !existingUrls.includes(newPost.url));

  newPosts.forEach((post) => post.id = _.uniqueId('post_'));

  if (!_.isEmpty(newPosts)) watchedState.posts = [...watchedState.posts, ...newPosts];
};

const getUpdatedPosts = (watchedState) => {
  const urls = watchedState.feeds.map((feed) => feed.link);

  const promises = urls.map((url) => makeRequest(url)
    .then((response) => {
      const parsedResponse = parser(response);
      return updateData(watchedState, parsedResponse, watchedState.posts);
    })
    .catch((err) => {
      watchedState.loadingProcess.error = getErrorCode(err);
    }));
  Promise.all(promises).finally(() => setTimeout(() => getUpdatedPosts(watchedState), 5000));
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
      isValid: false,
    },
    uiState: {
      openedModalId: null,
      clickedElements: [],
    },
    loadingProcess: {
      error: null,
      status: 'idle',
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
      .string('required')
      .url('notUrl')
      .notOneOf(urls, 'exist')
      .required();

    schema.validate(inputValue)
      .then(() => {
        watchedState.loadingProcess.status = 'loading';
        watchedState.formState.isValid = false;
        return makeRequest(inputValue);
      })
      .then((response) => {
        watchedState.loadingProcess.status = 'filling';
        watchedState.formState.isValid = true;

        const { feedObject, feedsPosts } = parser(response);
        feedObject.id = _.uniqueId('feed_');
        feedObject.link = inputValue;

        feedsPosts.forEach((post) => post.id = _.uniqueId('post_'));

        watchedState.feeds.push(feedObject);
        watchedState.posts = [...watchedState.posts, ...feedsPosts];
      })
      .catch((err) => {
        watchedState.loadingProcess.status = 'failed';
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

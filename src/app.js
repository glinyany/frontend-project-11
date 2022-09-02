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
  const { feedsPosts } = parsedResponse;
  const existingIds = []; 

  posts.map(post => post.map(el => existingIds.push(el.id)))
  const newPosts = feedsPosts.filter((post) => {
    return !existingIds.includes(post.id)
  });

  if (!_.isEmpty(newPosts)) watchedState.posts.push(newPosts)

  watchedState.refreshTime = watchedState.refreshTime + 1;
  console.log('__EXST POSTS__:\n', existingIds, `\nNew posts:${newPosts.length}`, newPosts, '\nRefresh Times:', watchedState.refreshTime);
};

const refreshData = (watchedState, url, posts) => 
  Promise.resolve(url)
  .then(() => makeRequest(url))
  .then((response) => parser(response)) 
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

const addButtonListeners = (watchedState) => {
  const container = document.querySelector('.posts');
  const titles = container.querySelectorAll('a');
  const buttons = container.querySelectorAll('button');
  const els = [...titles, ...buttons];

  els.forEach((el) => 
    el.addEventListener('click', (e) => {
      const postId = el.dataset.id;
      watchedState.userClick.elementType = e.target.tagName;
      watchedState.userClick.openedPostId = postId;
      if (!watchedState.userClick.clickedElements.includes(postId)) watchedState.userClick.clickedElements.push(postId);
      console.log('#Clicked elements list:', watchedState.userClick.clickedElements)
  }));
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
    userClick: {
      openedPostId: null,
      elementType: null,
      clickedElements: [],
    },
    refreshTime: 0,
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
    })
    .then(() => {
      console.log('add btns!!!')
      addButtonListeners(watchedState)
    })
    .then(() => setTimeout(refreshData(watchedState, inputValue, state.posts, state), 5000))
    .catch((err) => { 
      console.log('!catch:', err.type);
      watchedState.error = err.type;
    });
  });
};

/**

http://lorem-rss.herokuapp.com/feed?unit=second&interval=5
https://ru.hexlet.io/lessons.rss
*/
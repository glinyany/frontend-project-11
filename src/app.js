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
      console.log("$$$", data.contents);
      return data.contents;
    })
    .catch(() => { throw Error('errors.request'); });
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
  };
  
  const state = {
    formState: {
      inputValue: '',
      isValid: true, // unused rn
    },
    formProcess: {
      status: null,
      error: null,
    },
    feeds: [],
    posts: [],
  };

  const watchedState = onChange(state, (path) => {
    view(state, path, i18next, elements);
  });

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
  
    const formData = new FormData(e.target);
    const inputValue = formData.get('url').trim();

    const schema = yup
      .string()
      .url()
      .required()
      .notOneOf(state.feeds.map(feed => feed.link));

    schema.validate(inputValue)
    .then(() => {
      watchedState.formState.inputValue = inputValue;
      watchedState.formProcess.error = 'null';
      watchedState.formProcess.status = 'working';
    })
    .then(() => makeRequest(inputValue))
    .then((response) => parser(response))
    .then((parserResonse) => {
      const { feedObject, feedsPosts } = parserResonse;
      watchedState.feeds = [...watchedState.feeds, feedObject];
      watchedState.posts = [...watchedState.posts, feedsPosts];
      console.log(watchedState);
    })
    .catch((err) => {  
      switch (err.type) {
        case 'url':
          watchedState.formProcess.error = 'url';
          watchedState.formProcess.status = 'failed';
          console.log('#Validation Failed with error:', err.type);
          break;
        case 'notOneOf':
          watchedState.formProcess.error = 'notUniq';
          watchedState.formProcess.status = 'failed';
          console.log('#Validation Failed with error:', err.type);
          break;
        default:
          throw Error (`Unknown type of Error: ${err.message}`);
      };
    });
  });
  // elements.container.addEventListener();
};

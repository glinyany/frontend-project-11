export default (response) => {
  try {
    const parser = new DOMParser();
    const dom = parser.parseFromString(response, 'text/xml');

    const feedObject = {
      title: dom.querySelector('title').textContent,
      description: dom.querySelector('description').textContent,
    };

    const unparsedItems = Array.from(dom.querySelectorAll('item'));
    const feedsPosts = unparsedItems.map((post) => {
      const postObject = {
        id: post.querySelector('guid').textContent, //
        title: post.querySelector('title').textContent,
        description: post.querySelector('description').textContent,
        url: post.querySelector('link').textContent,
      };
      return postObject;
    });
    return { feedObject, feedsPosts };
  } catch {
    throw Error('errors.parse');
  }
};

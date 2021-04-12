export const useFetchXML = function ({ url, title, callback }) {
  const [{ isFetching, list }, dispatch] = React.useReducer(callback, {
    isFetching: false,
    list: ['item'],
  });
  const xhr = React.useRef(new XMLHttpRequest());
  React.useEffect(() => {
    xhr.current.onload = function () {
      xhr.current.responseXML.documentElement
        .querySelectorAll('Url')
        .forEach((elem) => dispatch(elem.textContent));
    };
    xhr.current.onerror = (e) => dispatch('error:' + e.message);
    xhr.current.open('GET', url);
    xhr.current.responseType = 'document';
    dispatch('starting');
    xhr.current.send();
    return function cleanup() {
      xhr.current = null;
    };
  }, [url]);
  return { isFetching, list };
};

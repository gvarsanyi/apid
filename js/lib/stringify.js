module.exports = function(obj, space) {
  var cache, fn;
  cache = [];
  fn = function(key, value) {
    if (typeof value === 'object' && value) {
      if (cache.indexOf(value) !== -1) {
        return;
      }
      cache.push(value);
    }
    return value;
  };
  return JSON.stringify(obj, fn, space);
};

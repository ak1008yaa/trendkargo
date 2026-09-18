const crypto = require('crypto');

function configuredToken() {
  return process.env.ADMIN_TOKEN || '';
}

function validCredentials(username, password) {
  const expected = configuredToken();
  if (!expected || username !== (process.env.ADMIN_USER || 'admin') || !password) return false;
  const left = Buffer.from(String(password));
  const right = Buffer.from(String(expected));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function isAuthenticated(req) {
  return req.headers.cookie?.split(';').some((item) => item.trim() === 'tc_auth=true');
}

module.exports = { validCredentials, isAuthenticated };

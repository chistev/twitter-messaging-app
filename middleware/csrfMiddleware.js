const Tokens = require('csrf');
const tokens = new Tokens();

const csrfMiddleware = (req, res, next) => {
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = tokens.secretSync();
  }

  req.csrfToken = () => tokens.create(req.session.csrfSecret);

  next();
};

const csrfVerifyMiddleware = (req, res, next) => {
  const token = req.body._csrf || req.query._csrf || req.headers['csrf-token'];

  if (!tokens.verify(req.session.csrfSecret, token)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

module.exports = {
  csrfMiddleware,
  csrfVerifyMiddleware,
};

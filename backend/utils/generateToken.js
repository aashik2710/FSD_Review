const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mining_super_secure_jwt_secret_key_2026_x89f', {
    expiresIn: '30d'
  });
};

module.exports = generateToken;

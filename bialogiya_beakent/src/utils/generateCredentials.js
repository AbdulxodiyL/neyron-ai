const { v4: uuidv4 } = require('uuid');

const generateUsername = (name) => {
  const base = name
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '');
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}${suffix}`;
};

const generatePassword = (length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

module.exports = { generateUsername, generatePassword };

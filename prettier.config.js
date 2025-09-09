const vercelPrettierConfig = require('@vercel/style-guide/prettier');

module.exports = {
  ...vercelPrettierConfig,
  plugins: ['prettier-plugin-tailwindcss'],
};

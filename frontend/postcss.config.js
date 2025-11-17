// postcss.config.js
module.exports = {
  plugins: {
    // new PostCSS adapter for Tailwind (required since the PostCSS plugin moved)
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};

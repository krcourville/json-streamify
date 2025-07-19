module.exports = {
  // Formatting rules
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,

  // TypeScript specific
  arrowParens: 'avoid',
  bracketSpacing: true,
  endOfLine: 'lf',

  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        singleQuote: false,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'preserve',
      },
    },
  ],
};

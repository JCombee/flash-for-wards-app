module.exports = {
  root: true,
  extends: ['@electron-toolkit/eslint-config-ts/recommended'],
  ignorePatterns: ['out', 'dist', 'node_modules', '*.cjs', '*.config.js', '*.config.ts'],
  rules: {
    // components and hooks rely on inferred return types throughout
    '@typescript-eslint/explicit-function-return-type': 'off'
  }
}

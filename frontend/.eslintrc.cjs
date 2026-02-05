module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
    ],
    env: {
        browser: true,
        es2020: true,
    },
    rules: {
        // 允许 any 类型（渐进式迁移）
        '@typescript-eslint/no-explicit-any': 'warn',
        // 允许未使用的变量以下划线开头
        '@typescript-eslint/no-unused-vars': ['error', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
        }],
        // 强制使用一致的类型导入
        '@typescript-eslint/consistent-type-imports': 'error',
    },
    ignorePatterns: ['node_modules/', 'dist/'],
};

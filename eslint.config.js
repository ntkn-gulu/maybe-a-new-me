import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import react_hooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
    { ignores: ['dist', 'dev-dist', 'node_modules'] },
    {
        files: ['**/*.{ts,tsx,js}'],
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
        },
        plugins: {
            '@stylistic': stylistic,
            'react-hooks': react_hooks,
        },
        rules: {
            // Project convention: Allman braces (opening brace on its own line)
            '@stylistic/brace-style': ['error', 'allman', { allowSingleLine: true }],
            '@stylistic/indent': ['error', 4, { SwitchCase: 1 }],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
        },
    },
);

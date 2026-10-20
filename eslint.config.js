import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['src/**/*.ts'],
    rules: {
      // 显式可见性修饰符，避免依赖默认值（作业要求“字段封装”）
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',
          overrides: { constructors: 'off', methods: 'off' },
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      // 输出统一走 process.stdout，禁止散落的 console
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      // 下划线前缀表示"接口要求但实现未用到"，例如 Command.undo 的默认实现
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['test/**/*.ts', '*.config.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);

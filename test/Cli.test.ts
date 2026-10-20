import { spawnSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

interface CliResult {
  readonly stdout: string;
  readonly status: number | null;
}

/** 真跑一次 CLI 进程，验证只有 REPL 关心的两件事：提示符与 `error:` 前缀。 */
class CliRunner {
  public static run(input: string): CliResult {
    const result = spawnSync('node_modules/.bin/tsx', ['src/index.ts'], {
      input,
      encoding: 'utf8',
      timeout: 30_000,
    });
    return { stdout: result.stdout ?? '', status: result.status };
  }
}

describe('CLI 进程', () => {
  it('启动横幅与提示符符合约定', () => {
    const result = CliRunner.run('exit\n');
    expect(result.stdout).toContain("svg-editor 0.1 — type 'help' for commands");
    expect(result.stdout).toContain('svg> ');
    expect(result.status).toBe(0);
  });

  it('错误统一带 error: 前缀，且只带一次', () => {
    const result = CliRunner.run('bogus\nexit\n');
    expect(result.stdout).toContain('error: unknown command: bogus');
    expect(result.stdout).not.toContain('error: error:');
  });

  it('注释行与空行被跳过，不产生输出', () => {
    const result = CliRunner.run('# 这是注释\n\ninit 100 100\nexit\n');
    expect(result.stdout).toContain('canvas 100x100 created');
    expect(result.stdout).not.toContain('这是注释');
  });

  it('命令失败不终止会话', () => {
    const result = CliRunner.run('init 100 100\nbogus\ncreate rect r1 0 0 1 1\nexit\n');
    expect(result.stdout).toContain('error: unknown command: bogus');
    expect(result.stdout).toContain('rect#r1 created');
    expect(result.status).toBe(0);
  });
});

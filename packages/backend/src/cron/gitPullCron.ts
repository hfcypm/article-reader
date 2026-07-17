const INTERVAL_MS = 3 * 60 * 60 * 1000;

const GIT_DIR = Bun.env.GIT_REPO_DIR || process.cwd().replace(/\/packages\/backend.*$/, '');
const FRONTEND_DIR = `${GIT_DIR}/packages/frontend`;

async function gitExec(args: string[]): Promise<string | null> {
  try {
    const proc = Bun.spawn(['git', ...args], {
      cwd: GIT_DIR,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    return output.trim() || 'OK';
  } catch {
    return null;
  }
}

async function restartServices(): Promise<void> {
  console.log('[GIT-CRON] 正在重启前后端服务...');

  // 后端：退出当前进程，bun --watch 会自动重启
  console.log('[GIT-CRON] 后端进程即将退出，由 bun --watch 自动重启');

  // 前端：touch vite.config.ts 触发 Vite 重启
  try {
    const now = new Date();
    await Bun.spawn(['touch', '-t', now.toISOString().replace(/[-:T]/g, '').slice(0, 12), `${FRONTEND_DIR}/vite.config.ts`]).exited;
    console.log('[GIT-CRON] 已触发前端 Vite 重启');
  } catch {
    // ignore
  }

  // 延迟一小段时间后退出，确保日志已输出
  setTimeout(() => process.exit(0), 500);
}

async function runGitPull(): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`[GIT-CRON] ${timestamp} 开始拉取远程代码...`);

  const stashed = (await gitExec(['stash', 'push', '-u', '-m', 'auto-cron-stash'])) !== null;

  const result = await gitExec(['pull', '--rebase', 'origin', 'master']);
  if (result !== null) {
    console.log(`[GIT-CRON] ${timestamp} 拉取成功: ${result}`);
    if (stashed) await gitExec(['stash', 'pop']);
    console.log('[GIT-CRON] 代码已同步，准备重启服务...');
    await restartServices();
    return;
  }

  await gitExec(['rebase', '--abort']);

  if (stashed) {
    await gitExec(['stash', 'pop']);
  }

  console.error(`[GIT-CRON] ${timestamp} 拉取失败，保留本地代码不动`);
}

export function startGitPullCron(): () => void {
  console.log(`[GIT-CRON] 定时拉取已启动，间隔 ${INTERVAL_MS / 3600000} 小时，仓库目录: ${GIT_DIR}`);

  const timer = setInterval(() => runGitPull(), INTERVAL_MS);

  return () => clearInterval(timer);
}

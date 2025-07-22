// 快速驗證修復
const { execSync } = require('child_process');

console.log('🧪 執行專案路由測試...');
try {
  const result = execSync('npx vitest run tests/server/routes/projects.test.ts --reporter=basic', {
    encoding: 'utf8',
    cwd: process.cwd()
  });
  console.log('✅ 測試結果：', result);
} catch (error) {
  console.log('❌ 測試失敗：', error.message);
  if (error.stdout) {
    console.log('stdout:', error.stdout);
  }
  if (error.stderr) {
    console.log('stderr:', error.stderr);
  }
}

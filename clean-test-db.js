const fs = require('fs');
const path = require('path');

// 清理測試資料庫
const testDbPath = path.join(__dirname, 'prisma', 'prisma', 'test.db');

if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
    console.log('✅ 測試資料庫已清理');
} else {
    console.log('ℹ️ 測試資料庫不存在');
}

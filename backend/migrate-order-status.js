/**
 * migrate-order-status.js
 * 
 * Chạy TRƯỚC khi prisma db push:
 * 1. Đổi cột orderStatus sang VARCHAR (tạm thời) để tránh lỗi enum cast
 * 2. Remap giá trị cũ → giá trị mới
 * 3. Thêm REFUNDED vào enum paymentStatus
 * 
 * Mapping:
 *   PENDING    → PENDING_CONFIRMATION
 *   PROCESSING → CONFIRMED
 *   SHIPPING   → DELIVERING
 *   DELIVERED  → DELIVERED   (giữ nguyên)
 *   COMPLETED  → DELIVERED   (đã giao = hoàn thành)
 *   CANCELLED  → CANCELLED   (giữ nguyên)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('🔄 Bắt đầu migrate Order Status...\n');

  try {
    // ── Bước 1: Đổi orderStatus thành VARCHAR để thoát khỏi enum constraint ──
    console.log('Step 1: Chuyển orderStatus → VARCHAR(50)...');
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`order\` MODIFY COLUMN \`orderStatus\` VARCHAR(50) NOT NULL DEFAULT 'PENDING_CONFIRMATION'`
    );
    console.log('  ✅ Done\n');

    // ── Bước 2: Remap giá trị cũ → mới ───────────────────────────────────────
    console.log('Step 2: Remap status values...');
    const mappings = [
      ['PENDING',    'PENDING_CONFIRMATION'],
      ['PROCESSING', 'CONFIRMED'],
      ['SHIPPING',   'DELIVERING'],
      ['COMPLETED',  'DELIVERED'],
      // DELIVERED và CANCELLED giữ nguyên
    ];

    for (const [oldVal, newVal] of mappings) {
      const result = await prisma.$executeRawUnsafe(
        `UPDATE \`order\` SET \`orderStatus\` = ? WHERE \`orderStatus\` = ?`,
        newVal, oldVal
      );
      console.log(`  ${oldVal} → ${newVal}: ${result} row(s) updated`);
    }
    console.log('  ✅ Done\n');

    // ── Bước 3: Thêm REFUNDED vào enum paymentStatus ─────────────────────────
    console.log('Step 3: Cập nhật enum paymentStatus (thêm REFUNDED)...');
    await prisma.$executeRawUnsafe(
      `ALTER TABLE \`order\` MODIFY COLUMN \`paymentStatus\` ENUM('PENDING','PAID','REFUNDED','FAILED') NOT NULL DEFAULT 'PENDING'`
    );
    console.log('  ✅ Done\n');

    // ── Bước 4: Kiểm tra kết quả ──────────────────────────────────────────────
    const orders = await prisma.$queryRawUnsafe(
      `SELECT orderStatus, COUNT(*) as count FROM \`order\` GROUP BY orderStatus`
    );
    console.log('📊 Phân bố orderStatus sau khi remap:');
    for (const row of orders) {
      console.log(`  ${row.orderStatus}: ${row.count}`);
    }

    console.log('\n✅ Migration hoàn tất! Bây giờ có thể chạy: prisma db push');
  } catch (err) {
    console.error('❌ Lỗi migration:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();

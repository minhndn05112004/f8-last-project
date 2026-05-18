const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ─── Clean existing data ────────────────────────────────────────────────────
  await prisma.message.deleteMany();
  await prisma.supportRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.news.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing data');

  // ─── Users ──────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  const staffPassword = await bcrypt.hash('Staff@123', 12);
  const userPassword = await bcrypt.hash('User@123', 12);

  const admin = await prisma.user.create({
    data: {
      fullName: 'Super Admin',
      email: 'admin@meatshop.vn',
      password: hashedPassword,
      phone: '0901234567',
      address: '123 Đường Lê Lợi, Q.1, TP.HCM',
      role: 'ADMIN',
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      fullName: 'Nguyễn Văn Staff',
      email: 'staff1@meatshop.vn',
      password: staffPassword,
      phone: '0912345678',
      address: '456 Đường Nguyễn Huệ, Q.1, TP.HCM',
      role: 'STAFF',
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      fullName: 'Trần Thị Staff',
      email: 'staff2@meatshop.vn',
      password: staffPassword,
      phone: '0923456789',
      address: '789 Đường Trần Hưng Đạo, Q.5, TP.HCM',
      role: 'STAFF',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      fullName: 'Lê Văn Khách',
      email: 'user1@gmail.com',
      password: userPassword,
      phone: '0934567890',
      address: '100 Đường Đinh Tiên Hoàng, Q.BT, TP.HCM',
      role: 'USER',
    },
  });

  console.log('👥 Created users:', { admin: admin.email, staff1: staff1.email, staff2: staff2.email });

  // ─── Categories ─────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Thịt Bò Nhập Khẩu', slug: 'thit-bo-nhap-khau' } }),
    prisma.category.create({ data: { name: 'Thịt Heo Nhập Khẩu', slug: 'thit-heo-nhap-khau' } }),
    prisma.category.create({ data: { name: 'Hải Sản Cao Cấp', slug: 'hai-san-cao-cap' } }),
    prisma.category.create({ data: { name: 'Thực Phẩm Chế Biến', slug: 'thuc-pham-che-bien' } }),
  ]);

  const [catBo, catHeo, catHaiSan, catCheB] = categories;
  console.log('📦 Created categories:', categories.map((c) => c.name));

  // ─── Products ────────────────────────────────────────────────────────────────
  const products = [
    {
      name: 'Thịt Bò Wagyu A5 Nhật Bản',
      slug: 'thit-bo-wagyu-a5-nhat-ban',
      description: 'Thịt bò Wagyu hạng A5 - đẳng cấp cao nhất của Nhật Bản.',
      price: 1850000,
      salePrice: 1650000,
      stock: 50,
      categoryId: catBo.id,
      createdById: admin.id,
    },
    {
      name: 'Thịt Heo Iberico Tây Ban Nha',
      slug: 'thit-heo-iberico-tay-ban-nha',
      description: 'Heo Iberico - "Wagyu của thịt heo".',
      price: 780000,
      salePrice: 720000,
      stock: 60,
      categoryId: catHeo.id,
      createdById: admin.id,
    },
  ];

  for (const productData of products) {
    await prisma.product.create({ data: { ...productData, images: '[]' } });
  }

  console.log(`🥩 Created ${products.length} products`);

  // ─── Support Request ─────────────────────────────────────────────────────────
  const supportRequest = await prisma.supportRequest.create({
    data: {
      userId: user1.id,
      assignedStaffId: staff1.id,
      status: 'ACTIVE',
    },
  });

  await prisma.message.createMany({
    data: [
      {
        supportRequestId: supportRequest.id,
        senderId: user1.id,
        content: 'Xin chào! Tôi muốn hỏi về thịt bò Wagyu A5 ạ.',
      },
      {
        supportRequestId: supportRequest.id,
        senderId: staff1.id,
        content: 'Chào bạn! Chúng tôi có Wagyu A5 nhập trực tiếp từ Kobe, Nhật Bản.',
      },
    ],
  });

  console.log('💬 Created demo support request with messages');

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

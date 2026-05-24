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
  await prisma.cart.deleteMany();
  await prisma.news.deleteMany();
  await prisma.productTagOnProduct.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productTag.deleteMany();
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
      isVerified: true,
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
      isVerified: true,
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
      isVerified: true,
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
      isVerified: true,
    },
  });

  console.log('👥 Created users:', { admin: admin.email, staff1: staff1.email, staff2: staff2.email });

  // ─── Tags ─────────────────────────────────────────────────────────────
  const tags = await Promise.all([
    prisma.productTag.create({ data: { name: 'Thịt Bò', slug: 'thit-bo' } }),
    prisma.productTag.create({ data: { name: 'Thịt Heo', slug: 'thit-heo' } }),
    prisma.productTag.create({ data: { name: 'Thịt Gà', slug: 'thit-ga' } }),
    prisma.productTag.create({ data: { name: 'Xúc xích', slug: 'xuc-xich' } }),
    prisma.productTag.create({ data: { name: 'Đồ hộp', slug: 'do-hop' } }),
    prisma.productTag.create({ data: { name: 'Nhập khẩu', slug: 'nhap-khau' } }),
    prisma.productTag.create({ data: { name: 'Khuyến mãi', slug: 'khuyen-mai' } }),
  ]);

  const [tagBo, tagHeo, tagGa, tagXucXich, tagDoHop, tagNhapKhau, tagKhuyenMai] = tags;
  console.log('🏷️ Created tags:', tags.map((t) => t.name));

  // ─── Products ────────────────────────────────────────────────────────────────
  const products = [
    {
      name: 'Thịt Bò Wagyu A5 Nhật Bản',
      slug: 'thit-bo-wagyu-a5-nhat-ban',
      description: 'Thịt bò Wagyu hạng A5 - đẳng cấp cao nhất của Nhật Bản với vân mỡ cẩm thạch tuyệt đẹp.',
      shortDescription: 'Thịt bò Wagyu A5 thượng hạng nhập khẩu Nhật Bản.',
      price: 1850000,
      salePrice: 1650000,
      stock: 50,
      sku: 'BO-WAGYU-A5',
      isPublished: true,
      createdById: admin.id,
      tagIds: [tagBo.id, tagNhapKhau.id, tagKhuyenMai.id],
    },
    {
      name: 'Thịt Heo Iberico Tây Ban Nha',
      slug: 'thit-heo-iberico-tay-ban-nha',
      description: 'Heo Iberico - "Wagyu của thịt heo", ăn hạt dẻ sồi hữu cơ.',
      shortDescription: 'Thịt heo Iberico nhập khẩu từ Tây Ban Nha.',
      price: 780000,
      salePrice: 720000,
      stock: 60,
      sku: 'HEO-IBERICO',
      isPublished: true,
      createdById: admin.id,
      tagIds: [tagHeo.id, tagNhapKhau.id],
    },
    {
      name: 'Xúc xích Đức Bratwurst',
      slug: 'xuc-xich-duc-bratwurst',
      description: 'Xúc xích Bratwurst truyền thống kiểu Đức làm từ thịt heo và gia vị thượng hạng.',
      shortDescription: 'Xúc xích Bratwurst chuẩn vị Đức.',
      price: 180000,
      salePrice: 150000,
      stock: 120,
      sku: 'XX-BRATWURST',
      isPublished: true,
      createdById: admin.id,
      tagIds: [tagXucXich.id, tagNhapKhau.id, tagKhuyenMai.id],
    },
    {
      name: 'Thịt Gà Tây Nguyên Con Xông Khói',
      slug: 'thit-ga-tay-nguyen-con-xong-khoi',
      description: 'Thịt gà tây nguyên con xông khói chuẩn vị Mỹ, thơm ngon khó cưỡng.',
      shortDescription: 'Gà tây nguyên con xông khói nhập khẩu.',
      price: 1200000,
      salePrice: null,
      stock: 15,
      sku: 'GA-TAY-XK',
      isPublished: true,
      createdById: admin.id,
      tagIds: [tagGa.id, tagNhapKhau.id],
    },
    {
      name: 'Đồ Hộp Cá Hồi Sốt Cà Tulip',
      slug: 'do-hop-ca-hoi-sot-ca-tulip',
      description: 'Cá hồi sốt cà hộp Tulip thương hiệu nổi tiếng Đan Mạch.',
      shortDescription: 'Cá hồi sốt cà Tulip Đan Mạch.',
      price: 850000,
      salePrice: 80000,
      stock: 200,
      sku: 'DH-CAHOI-TULIP',
      isPublished: true,
      createdById: admin.id,
      tagIds: [tagDoHop.id, tagNhapKhau.id],
    }
  ];

  for (const p of products) {
    const { tagIds, ...productData } = p;
    await prisma.product.create({
      data: {
        ...productData,
        images: '[]',
        tags: {
          create: tagIds.map(tagId => ({ tagId }))
        }
      }
    });
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


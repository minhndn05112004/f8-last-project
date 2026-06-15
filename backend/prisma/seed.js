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
  const tagsData = [
    { name: 'Thịt Bò', slug: 'thit-bo' },
    { name: 'Thịt Heo', slug: 'thit-heo' },
    { name: 'Thịt Gà', slug: 'thit-ga' },
    { name: 'Thịt Vịt', slug: 'thit-vit' },
    { name: 'Thịt Hỗn Hợp', slug: 'thit-hon-hop' },
    { name: 'Nhập Khẩu', slug: 'nhap-khau' },
    { name: 'Khuyến Mãi', slug: 'khuyen-mai' },
    { name: 'Bán Chạy', slug: 'ban-chay' }
  ];

  const tags = {};
  for (const tag of tagsData) {
    const createdTag = await prisma.productTag.create({ data: tag });
    tags[tag.slug] = createdTag;
  }
  console.log('🏷️ Created tags:', Object.keys(tags));

  // ─── 25 Products ─────────────────────────────────────────────────────────────
  const products = [
    // --- Category: Beef (thit-bo) ---
    {
      name: 'Bắp Bò Úc Nhập Khẩu Anthony',
      slug: 'bap-bo-uc-nhap-khau-anthony',
      description: 'Bắp bò Úc nhập khẩu chính ngạch từ các trang trại chuẩn organic tại Úc. Phần thịt có các đường gân xen kẽ, khi chế biến tạo độ giòn sần sật, ngọt nước và không bị dai. Rất phù hợp cho các món lẩu, hầm, kho hoặc ngâm nước mắm.',
      shortDescription: 'Bắp bò Úc tươi ngon giòn sần sật, phù hợp cho món lẩu và hầm.',
      price: 260000,
      salePrice: 229000,
      stock: 75,
      sku: 'BO-ANTHONY-001',
      thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1551028150-64b9f398f678?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-bo', 'nhap-khau', 'khuyen-mai']
    },
    {
      name: 'Thăn Vai Bò Mỹ Premium',
      slug: 'than-vai-bo-my-premium',
      description: 'Thăn vai bò Mỹ (Ribeye) hạng Prime với vân mỡ đều đặn như cẩm thạch. Thịt siêu mềm mọng, thơm béo đặc trưng của bò ăn ngũ cốc. Thích hợp nhất cho món bít tết áp chảo hoặc nướng BBQ.',
      shortDescription: 'Thăn vai bò Mỹ vân mỡ cẩm thạch, lý tưởng cho steak thượng hạng.',
      price: 450000,
      salePrice: null,
      stock: 50,
      sku: 'BO-ANTHONY-002',
      thumbnail: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-bo', 'nhap-khau', 'ban-chay']
    },
    {
      name: 'Ba Chỉ Bò Mỹ Cuộn Lẩu',
      slug: 'ba-chi-bo-my-cuon-lau',
      description: 'Ba chỉ bò Mỹ thái lát mỏng cuộn tròn đẹp mắt, độ dày tiêu chuẩn 2mm cho món nhúng lẩu chín nhanh mà vẫn giữ nguyên vị ngọt béo. Tỷ lệ nạc mỡ cân đối không gây ngấy.',
      shortDescription: 'Ba chỉ bò Mỹ thái lát cuộn tròn nhúng lẩu béo ngậy ngọt thịt.',
      price: 180000,
      salePrice: 149000,
      stock: 120,
      sku: 'BO-ANTHONY-003',
      thumbnail: 'https://images.unsplash.com/photo-1551028150-64b9f398f678?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1551028150-64b9f398f678?w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-bo', 'nhap-khau', 'khuyen-mai', 'ban-chay']
    },
    {
      name: 'Dẻ Sườn Bò Mỹ Lọc Sạch',
      slug: 'de-suon-bo-my-loc-sach',
      description: 'Phần thịt dẻ sườn nằm giữa các xương sườn bò Mỹ, được lọc sạch mỡ thừa và màng gân dai. Hương vị đậm đà nhờ các thớ mỡ đan xen, thích hợp để nướng lu, kho tiêu hoặc nấu sốt vang.',
      shortDescription: 'Dẻ sườn bò Mỹ đậm đà, béo ngậy thích hợp nướng hoặc sốt vang.',
      price: 380000,
      salePrice: null,
      stock: 60,
      sku: 'BO-ANTHONY-004',
      thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-bo', 'nhap-khau']
    },
    {
      name: 'Lõi Vai Bò Mỹ Thượng Hạng',
      slug: 'loi-vai-bo-my-thuong-hang',
      description: 'Lõi vai bò Mỹ (Top Blade) có một sợi gân mỏng chạy dọc ở giữa miếng thịt, tạo cảm giác giòn nhẹ khi nhai. Thịt rất ngọt, ít mỡ nhưng không hề bị khô. Phù hợp làm steak, nướng hoặc thái mỏng xào.',
      shortDescription: 'Lõi vai bò Mỹ mềm ngọt có gân giòn nhẹ, thích hợp làm steak.',
      price: 390000,
      salePrice: 350000,
      stock: 45,
      sku: 'BO-ANTHONY-005',
      thumbnail: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1551028150-64b9f398f678?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-bo', 'nhap-khau', 'khuyen-mai']
    },

    // --- Category: Pork (thit-heo) ---
    {
      name: 'Ba Chỉ Heo Có Sườn Sạch',
      slug: 'ba-chi-heo-co-suon-sach',
      description: 'Thịt ba chỉ heo sạch Anthony nuôi theo chuẩn VietGAP, cho thịt thơm và không ra nước khi nấu. Ba chỉ có phần sườn non liền kề tăng thêm độ ngon ngọt khi làm món kho, luộc hoặc chiên giòn.',
      shortDescription: 'Ba chỉ heo tươi ngon chuẩn VietGAP thơm mềm ngậy vị.',
      price: 165000,
      salePrice: 145000,
      stock: 80,
      sku: 'HEO-ANTHONY-001',
      thumbnail: 'https://images.unsplash.com/photo-1602489114002-6b40000f086b?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1602489114002-6b40000f086b?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-heo', 'khuyen-mai', 'ban-chay']
    },
    {
      name: 'Sườn Non Heo Kinh Đô Anthony',
      slug: 'suon-non-heo-kinh-do-anthony',
      description: 'Sườn non heo nhiều thịt, xương nhỏ dẹt, sụn trắng giòn. Rất thích hợp để làm các món sườn xào chua ngọt, sườn rim tiêu hay canh sườn hầm bí đỏ ngọt mát cho gia đình.',
      shortDescription: 'Sườn non heo nhiều thịt xương nhỏ dẹt thơm ngon ngọt xương.',
      price: 210000,
      salePrice: null,
      stock: 65,
      sku: 'HEO-ANTHONY-002',
      thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-heo', 'ban-chay']
    },
    {
      name: 'Nạc Vai Heo Sạch Tiêu Chuẩn',
      slug: 'nac-vai-heo-sach-tieu-chuan',
      description: 'Thịt nạc vai heo dai giòn nhẹ, thớ thịt dày dặn và có tỉ lệ nạc cao. Phù hợp để xay nhỏ làm chả lá lốt, nem rán hoặc băm nấu canh rau củ thanh mát.',
      shortDescription: 'Thịt nạc vai heo thớ dày dai giòn vừa phải cho món xào băm.',
      price: 135000,
      salePrice: 119000,
      stock: 100,
      sku: 'HEO-ANTHONY-003',
      thumbnail: 'https://images.unsplash.com/photo-1602489114002-6b40000f086b?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1602489114002-6b40000f086b?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-heo', 'khuyen-mai']
    },
    {
      name: 'Nạc Dăm Heo Mềm Ngọt',
      slug: 'nac-dam-heo-mem-ngot',
      description: 'Thịt nạc dăm heo sạch có các vân mỡ nhỏ xen kẽ bên trong thớ nạc làm cho miếng thịt cực kỳ mềm và ngọt khi nấu, hoàn toàn không bị khô xơ. Thích hợp làm món thịt kho tàu, ram mặn ngọt hoặc nướng lò.',
      shortDescription: 'Thịt nạc dăm heo mềm ngọt không bị khô khi chiên nướng.',
      price: 155000,
      salePrice: null,
      stock: 90,
      sku: 'HEO-ANTHONY-004',
      thumbnail: 'https://images.unsplash.com/photo-1602489114002-6b40000f086b?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1602489114002-6b40000f086b?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-heo']
    },
    {
      name: 'Chân Giò Heo Rút Xương Cuộn Chỉ',
      slug: 'chan-gio-heo-rut-xuong-cuon-chi',
      description: 'Chân giò heo tươi ngon được lọc sạch xương bên trong và cuộn tròn chắc chắn bằng chỉ thực phẩm. Khi luộc chín thái lát mỏng tạo hình tròn đẹp mắt, da giòn sần sật thịt ngọt đậm đà.',
      shortDescription: 'Chân giò rút xương cuộn chỉ da giòn thịt ngọt ngào cuốn hút.',
      price: 140000,
      salePrice: 125000,
      stock: 55,
      sku: 'HEO-ANTHONY-005',
      thumbnail: 'https://images.unsplash.com/photo-1602489114002-6b40000f086b?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1602489114002-6b40000f086b?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-heo', 'khuyen-mai']
    },

    // --- Category: Chicken (thit-ga) ---
    {
      name: 'Ức Gà Phi Lê Không Da Ăn Kiêng',
      slug: 'uc-ga-phi-le-khong-da-an-kieng',
      description: 'Ức gà phi lê đã được làm sạch da và mỡ thừa, là nguồn protein dồi dào ít béo hoàn hảo cho chế độ ăn kiêng, tập gym hoặc eat-clean. Thịt gà tươi mềm, không hôi.',
      shortDescription: 'Ức gà phi lê không da sạch mỡ giàu protein cho người tập gym.',
      price: 85000,
      salePrice: 75000,
      stock: 150,
      sku: 'GA-ANTHONY-001',
      thumbnail: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-ga', 'khuyen-mai', 'ban-chay']
    },
    {
      name: 'Đùi Tỏi Gà Tươi Sạch Anthony',
      slug: 'dui-toi-ga-tuoi-sach-anthony',
      description: 'Đùi tỏi gà tươi ngon chắc thịt, lớp da vàng óng tự nhiên. Rất thích hợp làm món gà chiên mắm, đùi gà nướng mật ong hay hầm nấm bổ dưỡng cho gia đình.',
      shortDescription: 'Đùi tỏi gà tươi chắc thịt đậm vị chiên rán hay nướng ngon tuyệt.',
      price: 95000,
      salePrice: null,
      stock: 110,
      sku: 'GA-ANTHONY-002',
      thumbnail: 'https://images.unsplash.com/photo-1587593817642-8b9f07654784?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1587593817642-8b9f07654784?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-ga']
    },
    {
      name: 'Cánh Gà Công Nghiệp Nhập Khẩu',
      slug: 'canh-ga-cong-nghiep-nhap-khau',
      description: 'Cánh gà nhập khẩu tiêu chuẩn quốc tế, kích cỡ đồng đều, thịt dày béo ngọt. Thích hợp làm món cánh gà chiên nước mắm thần thánh hay cánh gà sốt cay kiểu Hàn Quốc.',
      shortDescription: 'Cánh gà dày thịt dai béo, chuẩn vị chiên nước mắm bơ tỏi.',
      price: 110000,
      salePrice: 99000,
      stock: 130,
      sku: 'GA-ANTHONY-003',
      thumbnail: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-ga', 'nhap-khau', 'khuyen-mai']
    },
    {
      name: 'Gà Ta Thả Vườn Nguyên Con',
      slug: 'ga-ta-tha-vuon-nguyen-con',
      description: 'Gà ta nuôi thả vườn tự nhiên tại các vùng đồi cao, ăn ngô thóc nên thịt rất dai ngon ngọt đậm, da vàng giòn tự nhiên. Hoàn hảo cho món gà luộc cúng, gà hấp hành hay nấu cháo hành tăm.',
      shortDescription: 'Gà ta thả vườn nguyên con thịt dai ngọt đậm đà da vàng giòn.',
      price: 185000,
      salePrice: null,
      stock: 40,
      sku: 'GA-ANTHONY-004',
      thumbnail: 'https://images.unsplash.com/photo-1587593817642-8b9f07654784?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1587593817642-8b9f07654784?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-ga', 'ban-chay']
    },
    {
      name: 'Má Đùi Gà Thảo Mộc Thơm Ngon',
      slug: 'ma-dui-ga-thao-moc-thom-ngon',
      description: 'Má đùi gà thảo mộc được nuôi bằng thức ăn bổ sung thảo dược tự nhiên giúp thịt thơm ngon hơn, giảm lượng mỡ thừa tích tụ dưới da. Cực kỳ an toàn và giàu giá trị dinh dưỡng.',
      shortDescription: 'Má đùi gà thảo mộc thơm ngọt ít mỡ an toàn cho cả gia đình.',
      price: 105000,
      salePrice: 89000,
      stock: 95,
      sku: 'GA-ANTHONY-005',
      thumbnail: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-ga', 'khuyen-mai']
    },

    // --- Category: Duck (thit-vit) ---
    {
      name: 'Vịt Cỏ Vân Đình Nguyên Con Sạch',
      slug: 'vit-co-van-dinh-nguyen-con-sach',
      description: 'Vịt cỏ Vân Đình nổi tiếng xương nhỏ thịt dày, thơm ngon, ít mỡ và không bị hôi. Vịt đã được làm lông sạch sẽ, loại bỏ tuyến hôi. Rất ngon khi làm món vịt quay lu, vịt om sấu hay vịt nấu chao.',
      shortDescription: 'Vịt cỏ Vân Đình trứ danh nhiều nạc xương nhỏ không hôi tanh.',
      price: 170000,
      salePrice: 149000,
      stock: 45,
      sku: 'VIT-ANTHONY-001',
      thumbnail: 'https://images.unsplash.com/photo-1516685018646-549198525c1b?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1516685018646-549198525c1b?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-vit', 'khuyen-mai', 'ban-chay']
    },
    {
      name: 'Lườn Vịt Pháp Áp Chảo Thượng Hạng',
      slug: 'luon-vit-phap-ap-chao-thuong-hang',
      description: 'Phần lườn vịt Pháp nhập khẩu với lớp mỡ da mỏng giòn và phần nạc đỏ hồng mềm mại ngọt thơm như thịt bò. Là nguyên liệu cao cấp chuyên dùng cho các nhà hàng chuẩn Âu món lườn vịt áp chảo sốt cam.',
      shortDescription: 'Lườn vịt Pháp nhập khẩu thượng hạng cho món áp chảo kiểu Âu.',
      price: 290000,
      salePrice: null,
      stock: 30,
      sku: 'VIT-ANTHONY-002',
      thumbnail: 'https://images.unsplash.com/photo-1516685018646-549198525c1b?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1516685018646-549198525c1b?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-vit', 'nhap-khau', 'ban-chay']
    },
    {
      name: 'Đùi Vịt Góc Tư Tươi Sạch',
      slug: 'dui-vit-goc-tu-tuoi-sach',
      description: 'Đùi vịt góc tư tươi ngon, thịt săn chắc, thích hợp làm món vịt kho gừng đậm vị đưa cơm hoặc đùi vịt hầm nấm ấm nồng ngày mưa gió.',
      shortDescription: 'Đùi vịt góc tư thịt chắc đậm đà ngon cơm khi kho gừng sả.',
      price: 85000,
      salePrice: 75000,
      stock: 80,
      sku: 'VIT-ANTHONY-003',
      thumbnail: 'https://images.unsplash.com/photo-1516685018646-549198525c1b?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1516685018646-549198525c1b?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-vit', 'khuyen-mai']
    },
    {
      name: 'Cánh Vịt Tươi Làm Sạch',
      slug: 'canh-vit-tuoi-lam-sach',
      description: 'Cánh vịt tươi sống được làm sạch cẩn thận, nhiều thịt và sụn giòn sần sật. Thích hợp cho các món cánh vịt khìa nước dừa, cánh vịt chiên mắm tỏi hoặc cánh vịt luộc chấm muối tiêu chanh.',
      shortDescription: 'Cánh vịt nhiều thịt và sụn giòn ngon làm cánh vịt khìa nước dừa.',
      price: 90000,
      salePrice: null,
      stock: 70,
      sku: 'VIT-ANTHONY-004',
      thumbnail: 'https://images.unsplash.com/photo-1516685018646-549198525c1b?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1516685018646-549198525c1b?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-vit']
    },
    {
      name: 'Nạc Đùi Vịt Rút Xương',
      slug: 'nac-dui-vit-rut-xuong',
      description: 'Phần nạc từ đùi vịt đã được rút bỏ xương hoàn toàn, thịt săn chắc béo ngọt tự nhiên. Rất tiện lợi để thái mỏng xào lăn cùng sả ớt, làm lẩu vịt hoặc cuốn lá lốt nướng bùi béo.',
      shortDescription: 'Nạc đùi vịt rút xương tươi ngon tiện lợi chế biến xào sả ớt.',
      price: 160000,
      salePrice: 145000,
      stock: 50,
      sku: 'VIT-ANTHONY-005',
      thumbnail: 'https://images.unsplash.com/photo-1516685018646-549198525c1b?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1516685018646-549198525c1b?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-vit', 'khuyen-mai']
    },

    // --- Category: Mixed Raw Meats (thit-hon-hop) ---
    {
      name: 'Combo Thịt Lẩu Thập Cẩm Tiện Lợi (Bò & Heo)',
      slug: 'combo-thit-lau-thap-cam-tien-loi-bo-heo',
      description: 'Combo thịt lẩu tiện lợi bao gồm 300g Ba chỉ bò Mỹ cuộn lẩu và 300g Ba chỉ heo sạch thái lát nhúng lẩu. Rút ngắn thời gian chuẩn bị bữa tiệc lẩu ấm áp cho gia đình từ 3-4 người ăn.',
      shortDescription: 'Combo thịt bò ba chỉ Mỹ và ba chỉ heo tươi thái lát nhúng lẩu tiện lợi.',
      price: 320000,
      salePrice: 289000,
      stock: 60,
      sku: 'MIX-ANTHONY-001',
      thumbnail: 'https://images.unsplash.com/photo-1551028150-64b9f398f678?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1551028150-64b9f398f678?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-hon-hop', 'khuyen-mai', 'ban-chay']
    },
    {
      name: 'Thịt Băm Hỗn Hợp Đặc Biệt (Bò & Heo Xay)',
      slug: 'thit-bam-hon-hop-dac-biet-bo-heo-xay',
      description: 'Thịt bò Mỹ và thịt heo sạch VietGAP xay nhuyễn phối trộn theo tỉ lệ vàng 3 bò : 7 heo giúp chả mềm mọng không khô xơ, béo thơm tự nhiên. Thích hợp làm xíu mại sốt cà, làm nhân nem hoặc đút lò.',
      shortDescription: 'Thịt bò heo băm trộn tỉ lệ vàng cho món xíu mại nem cuốn.',
      price: 125000,
      salePrice: null,
      stock: 100,
      sku: 'MIX-ANTHONY-002',
      thumbnail: 'https://images.unsplash.com/photo-1551028150-64b9f398f678?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1551028150-64b9f398f678?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-hon-hop']
    },
    {
      name: 'Sét Thịt Nướng BBQ Gia Đình Anthony',
      slug: 'set-thit-nuong-bbq-gia-dinh-anthony',
      description: 'Set thịt nướng BBQ gồm: 300g Dẻ sườn bò Mỹ, 300g Nạc dăm heo sốt ướp BBQ đặc biệt và 200g Đùi gà rút xương. Kèm theo gói sốt ướp thịt chuẩn Hàn Quốc siêu ngon của Anthony Shop.',
      shortDescription: 'Set BBQ gồm dẻ sườn bò Mỹ, heo dăm sốt và đùi gà rút xương kèm sốt.',
      price: 590000,
      salePrice: 499000,
      stock: 40,
      sku: 'MIX-ANTHONY-003',
      thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1551028150-64b9f398f678?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-hon-hop', 'khuyen-mai', 'ban-chay']
    },
    {
      name: 'Combo Súp Thịt Bổ Dưỡng Cho Bé',
      slug: 'combo-sup-thit-bo-duong-cho-be',
      description: 'Combo dành riêng cho bé yêu ăn dặm gồm 150g Lõi vai bò Mỹ xay mịn, 150g Ức gà thảo mộc xắt nhỏ hạt lựu. Đảm bảo nguồn dinh dưỡng dồi dào, an toàn tuyệt đối và dễ tiêu hóa cho trẻ nhỏ.',
      shortDescription: 'Thịt lõi vai bò và ức gà thảo mộc xắt nhỏ xay mịn nấu cháo súp bé ăn dặm.',
      price: 150000,
      salePrice: null,
      stock: 50,
      sku: 'MIX-ANTHONY-004',
      thumbnail: 'https://images.unsplash.com/photo-1551028150-64b9f398f678?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1551028150-64b9f398f678?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-hon-hop']
    },
    {
      name: 'Xiên Que Thịt Hỗn Hợp Ướp Sẵn Gia Vị',
      slug: 'xien-que-thit-hon-hop-uop-san-gia-vi',
      description: 'Thịt heo, gà xắt miếng vừa ăn xiên xen kẽ cùng ớt chuông, hành tây, được tẩm ướp sốt sả ớt đậm vị truyền thống. Chỉ cần nướng than hoa hoặc nồi chiên không dầu là có ngay đĩa mồi bén ngọt vị thịt.',
      shortDescription: 'Xiên que thịt heo gà ướp sốt đậm đà xen kẽ ớt chuông hành tây nướng ngon.',
      price: 115000,
      salePrice: 99000,
      stock: 85,
      sku: 'MIX-ANTHONY-005',
      thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop'],
      tagSlugs: ['thit-hon-hop', 'khuyen-mai']
    }
  ];

  for (const p of products) {
    const { tagSlugs, ...productData } = p;
    const tagIds = tagSlugs.map(slug => tags[slug].id);
    await prisma.product.create({
      data: {
        ...productData,
        images: JSON.stringify(productData.images),
        isPublished: true,
        createdById: admin.id,
        tags: {
          create: tagIds.map(tagId => ({ tagId }))
        }
      }
    });
  }

  console.log(`🥩 Created ${products.length} products successfully!`);

  // ─── 10 News Articles ────────────────────────────────────────────────────────
  const newsArticles = [
    {
      title: 'Bí quyết nhận biết thịt bò Mỹ nhập khẩu chính ngạch',
      slug: 'bi-quyet-nhan-biet-thit-bo-my-nhap-khau-chinh-ngach',
      excerpt: 'Thịt bò Mỹ ngày càng phổ biến tại Việt Nam, tuy nhiên không phải ai cũng biết cách chọn đúng thịt nhập khẩu chính ngạch chất lượng cao.',
      content: 'Thịt bò Mỹ nhập khẩu chính ngạch luôn là lựa chọn hàng đầu của những người sành ăn bởi chất lượng thịt vượt trội và quy trình kiểm tra nghiêm ngặt. Để phân biệt được thịt chính ngạch, người tiêu dùng cần quan sát các đặc điểm bên ngoài và nhãn mác sản phẩm.\n\nĐầu tiên, thịt bò Mỹ chính hãng phải có tem nhãn phụ bằng tiếng Việt ghi rõ nguồn gốc xuất xứ, tên nhà nhập khẩu, hạn sử dụng rõ ràng. Trên tem phụ thường có phân hạng của Bộ Nông nghiệp Mỹ (USDA). Vân mỡ cẩm thạch (Marbling) xen kẽ thớ nạc đỏ tươi cũng là nét đặc trưng dễ nhận biết nhất. Khi rã đông đúng cách, thịt bò Mỹ nhập khẩu chuẩn không bị chảy nhiều nước màu đỏ đậm và giữ nguyên cấu trúc thớ thịt chắc mịn.\n\nTại Anthony Shop, chúng tôi cam kết toàn bộ sản phẩm thịt bò đều đạt chứng nhận USDA chất lượng cao nhất, nhập khẩu trực tiếp bằng đường hàng không và bảo quản lạnh chuẩn cấp đông hàng hải.',
      thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
      isPublished: true,
      createdById: admin.id
    },
    {
      title: 'Hướng dẫn phân biệt thịt heo sạch chuẩn hữu cơ',
      slug: 'huong-dan-phan-biet-thit-heo-sach-chuan-huu-co',
      excerpt: 'Làm sao để nhận biết được thịt heo sạch, an toàn, không chứa chất tăng trọng giữa thị trường thịt bão hòa? Xem ngay mẹo phân biệt nhanh từ chuyên gia.',
      content: 'Thịt heo là món ăn quen thuộc hàng ngày của các gia đình Việt. Tuy nhiên, việc nhận biết thịt heo sạch không chứa dư lượng kháng sinh hay chất tạo nạc là một thách thức không hề nhỏ. Theo các chuyên gia ẩm thực, có 3 yếu tố quan trọng nhất để đánh giá bằng mắt và tay thường.\n\nMàu sắc của thịt heo sạch chuẩn hữu cơ thường có màu hồng nhạt đến đỏ thẫm nhẹ, mỡ heo dày màu trắng đục đặc trưng chứ không trắng ngà hay ngả vàng. Khi ấn tay vào bề mặt thịt, thịt có độ đàn hồi cực kỳ tốt, không để lại vết lõm, bề mặt khô ráo không nhớt dính. Khi luộc, nước canh thịt heo sạch trong veo, bọt nổi màu trắng và có mùi thơm ngậy đặc trưng tự nhiên.\n\nNgược lại, thịt heo nuôi công nghiệp chứa chất tăng trọng thường ra rất nhiều nước đục khi đun nấu, bọt đen và mùi hôi tanh khó chịu. Hãy thông thái bảo vệ sức khỏe gia đình bằng việc mua sắm tại các chuỗi thực phẩm uy tín như Anthony Shop.',
      thumbnail: 'https://images.unsplash.com/photo-1602489114002-6b40000f086b?w=800&auto=format&fit=crop',
      isPublished: true,
      createdById: admin.id
    },
    {
      title: 'Cách ướp sườn heo nướng mềm tan không bị khô',
      slug: 'cach-uop-suon-heo-nuong-mem-tan-khong-bi-kho',
      excerpt: 'Món sườn heo nướng của bạn thường bị khô xơ và dai? Khám phá ngay công thức ướp sườn độc quyền từ đầu bếp Anthony Shop.',
      content: 'Sườn nướng là món khoái khẩu của cả người lớn lẫn trẻ nhỏ trong các bữa tiệc cuối tuần. Tuy nhiên, nếu ướp sườn không đúng cách, sườn sau khi nướng sẽ bị dai và khô cứng. Để khắc phục điều này, bạn cần áp dụng mẹo nhỏ dùng nước cốt hành tỏi và sữa đặc.\n\nBí quyết đầu tiên là không dùng trực tiếp xác hành tỏi băm để ướp, vì xác hành tỏi rất dễ bị cháy khét trên than hoa tạo vị đắng. Hãy vắt lấy nước cốt để ướp. Thêm vào đó, thay vì dùng đường cát, bạn hãy dùng mật ong tự nhiên kết hợp một muỗng sữa đặc. Sữa đặc sẽ làm các thớ cơ sườn heo mềm ra và giữ nước cực kỳ tốt khi nướng ở nhiệt độ cao.\n\nThời gian ướp tối thiểu là 2 tiếng trong ngăn mát tủ lạnh, tốt nhất là ướp qua đêm để gia vị thấm sâu vào tận xương. Khi nướng, nhớ quét thêm một lớp dầu ăn mỏng lên bề mặt sườn để giữ độ bóng mọng ngon mắt.',
      thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
      isPublished: true,
      createdById: admin.id
    },
    {
      title: 'Mẹo áp chảo lườn vịt Pháp da giòn rụm, thịt mọng nước',
      slug: 'meo-ap-chao-luon-vit-phap-da-gion-rum-thit-mong-nuoc',
      excerpt: 'Lườn vịt Pháp áp chảo sốt cam là món ăn đẳng cấp nhà hàng Âu. Dưới đây là hướng dẫn chi tiết giúp bạn tự làm món ngon này tại nhà.',
      content: 'Lườn vịt Pháp nổi tiếng với thớ thịt đỏ mềm và lớp mỡ da béo ngậy. Để có món lườn vịt áp chảo hoàn hảo với lớp da giòn tan như bim bim và phần thịt bên trong hồng hào mọng nước (medium-rare), bạn cần chú ý kỹ thuật dùng chảo lạnh.\n\nĐầu tiên, dùng dao khía các đường xéo hình kim cương lên phần da vịt nhưng không chạm vào phần thịt nạc. Ướp nhẹ nhàng hai mặt với chút muối tiêu xay. Khi bắt đầu chiên, hãy đặt miếng vịt mặt da úp xuống chiếc chảo hoàn toàn lạnh (không cho thêm dầu ăn vì mỡ vịt tự tiết ra rất nhiều). Bật lửa nhỏ vừa để mỡ vịt tan dần và da vịt giòn rụm.\n\nSau khi áp chảo mặt da khoảng 8 phút đến khi chuyển màu vàng cánh gián, lật mặt thịt áp chảo tiếp trong 3-4 phút nữa. Điểm mấu chốt cuối cùng là phải cho thịt nghỉ (resting) khoảng 5 phút trước khi thái lát mỏng. Kỹ thuật này giúp nước thịt phân bố đều lại thớ cơ, không bị chảy ra ngoài khi thái.',
      thumbnail: 'https://images.unsplash.com/photo-1516685018646-549198525c1b?w=800&auto=format&fit=crop',
      isPublished: true,
      createdById: admin.id
    },
    {
      title: 'Giá trị dinh dưỡng của ức gà phi lê đối với người tập gym',
      slug: 'gia-tri-dinh-duong-cua-uc-ga-phi-le-doi-voi-nguoi-tap-gym',
      excerpt: 'Ức gà phi lê từ lâu đã được coi là "thực phẩm vàng" trong làng thể hình. Cùng phân tích sâu hàm lượng dinh dưỡng của phần thịt này.',
      content: 'Đối với những người tập thể hình hoặc đang thực hiện chế độ ăn giảm mỡ, ức gà phi lê là thực phẩm không thể thiếu trong thực đơn hàng ngày. Phần thịt trắng này chứa lượng protein dồi dào nhưng lại cực kỳ ít chất béo xấu và carbohydrate.\n\nCụ thể, trong 100g ức gà không da nấu chín chứa khoảng 31g protein chất lượng cao, cung cấp đầy đủ các axit amin thiết yếu để xây dựng và phục hồi các mô cơ bắp bị tổn thương sau những buổi tập cường độ cao. Ngoài ra, ức gà còn rất giàu Vitamin B6 giúp thúc đẩy quá trình trao đổi chất, hỗ trợ hệ thống tim mạch hoạt động khỏe mạnh.\n\nĐể bữa ăn không bị nhàm chán, bạn có thể biến tấu ức gà thành nhiều món ăn thơm ngon như ức gà áp chảo sốt chanh leo, ức gà xé phay trộn salad, hay ức gà nướng muối ớt cay nồng tại Anthony Shop.',
      thumbnail: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&auto=format&fit=crop',
      isPublished: true,
      createdById: admin.id
    },
    {
      title: 'Thịt bò và thịt heo: Loại nào giàu dinh dưỡng hơn?',
      slug: 'thit-bo-va-thit-heo-loai-nao-giau-dinh-duong-hon',
      excerpt: 'Nên chọn thịt bò hay thịt heo cho bữa ăn gia đình? Cùng so sánh chi tiết giá trị dinh dưỡng của hai loại thịt phổ biến nhất này.',
      content: 'Thịt bò và thịt heo là hai nguồn thực phẩm động vật phổ biến nhất trong bữa cơm gia đình Việt. Cả hai loại đều cung cấp protein chất lượng cao, tuy nhiên chúng có những điểm mạnh dinh dưỡng riêng biệt phù hợp với từng nhu cầu sức khỏe khác nhau.\n\nThịt bò nổi trội với hàm lượng sắt dồi dào, giúp phòng ngừa thiếu máu hiệu quả, cùng hàm lượng kẽm và Vitamin B12 cực cao hỗ trợ tăng cường hệ miễn dịch và phát triển tế bào thần kinh. Trong khi đó, thịt heo lại là nguồn cung cấp Vitamin B1 (Thiamine) vượt trội hơn hẳn thịt bò, rất quan trọng cho quá trình chuyển hóa năng lượng từ tinh bột.\n\nVề chất béo, thịt bò nạc chứa ít calo hơn thịt heo nạc tương đương, thích hợp cho người giảm cân. Tóm lại, việc luân phiên sử dụng cả hai loại thịt trong tuần sẽ giúp thực đơn gia đình thêm phong phú và cân bằng dinh dưỡng tối đa.',
      thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
      isPublished: true,
      createdById: admin.id
    },
    {
      title: 'Siêu tiệc nướng BBQ cuối tuần cùng Anthony Shop - Ưu đãi đến 30%',
      slug: 'sieu-tiec-nuong-bbq-cuoi-tuan-cung-anthony-shop-uu-dai-den-30',
      excerpt: 'Chuẩn bị tiệc BBQ ngoài trời hoành tráng cùng người thân với chương trình khuyến mãi cực khủng từ Anthony Shop tuần này.',
      content: 'Cuối tuần này, bạn đã có kế hoạch gì cho gia đình chưa? Hãy cùng Anthony Shop thắp lửa cho bữa tiệc nướng BBQ ấm cúng ngoài trời với chương trình khuyến mãi cực sốc giảm giá lên đến 30% cho toàn bộ các sản phẩm thịt bò Mỹ, sườn heo non và thịt xiên que ướp sẵn gia vị.\n\nKhông chỉ giảm giá trực tiếp trên hóa đơn, Anthony Shop còn tặng kèm sốt ướp thịt nướng vị truyền thống độc quyền cho hóa đơn từ 500.000đ. Tất cả nguyên liệu tại shop đều được sơ chế sạch sẽ, đóng gói hút chân không an toàn giúp bạn tiết kiệm thời gian chuẩn bị tối đa.\n\nChương trình diễn ra từ thứ Sáu đến hết ngày Chủ Nhật tuần này trên toàn hệ thống cửa hàng online và offline của Anthony Shop. Đặt hàng ngay hôm nay để nhận giao hàng thần tốc trong 2 giờ!',
      thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
      isPublished: true,
      createdById: admin.id
    },
    {
      title: 'Ngày hội thành viên Anthony Shop: Mua thịt ngon nhận ngàn quà tặng',
      slug: 'ngay-hoi-thanh-vien-anthony-shop-mua-thit-ngon-nhan-ngan-qua-tang',
      excerpt: 'Cơ hội tri ân khách hàng thân thiết của Anthony Shop với hàng ngàn voucher mua sắm và quà tặng hấp dẫn.',
      content: 'Để tri ân sự đồng hành của quý khách hàng trong suốt thời gian qua, Anthony Shop chính thức khởi động chương trình "Ngày Hội Thành Viên" với quy mô lớn nhất trong năm. Hàng ngàn phần quà thiết thực và voucher giảm giá đang chờ đón quý khách.\n\nMỗi khách hàng khi mua sắm thịt tươi tại cửa hàng hoặc đặt hàng qua website sẽ được tích lũy điểm thưởng nhân đôi. Số điểm tích lũy này có thể quy đổi trực tiếp thành các voucher giảm giá cho lần mua kế tiếp hoặc đổi các sản phẩm quà tặng như xúc xích tươi, lườn gà phi lê ăn kiêng.\n\nNgoài ra, các khách hàng có hạng thành viên Vàng và Bạch Kim sẽ được hưởng đặc quyền miễn phí vận chuyển trọn đời cho mọi đơn hàng trong bán kính 10km. Hãy đăng ký tài khoản thành viên ngay hôm nay trên website Anthony Shop để không bỏ lỡ!',
      thumbnail: 'https://images.unsplash.com/photo-1602489114002-6b40000f086b?w=800&auto=format&fit=crop',
      isPublished: true,
      createdById: admin.id
    },
    {
      title: 'Quy tắc rã đông thịt đông lạnh an toàn tránh nhiễm khuẩn',
      slug: 'quy-tac-ra-dong-thit-dong-lanh-an-toan-tranh-nhiem-khuan',
      excerpt: 'Rã đông thịt sai cách có thể tạo điều kiện cho vi khuẩn sinh sôi nảy nở nhanh chóng, gây nguy hại cho sức khỏe. Hãy tìm hiểu cách làm đúng.',
      content: 'Nhiều nội trợ thường có thói quen lấy thịt đông lạnh ra và ngâm trực tiếp vào chậu nước ấm hoặc để ở nhiệt độ phòng hàng giờ liền. Đây là những sai lầm cực kỳ nguy hiểm vì nhiệt độ ấm là môi trường lý tưởng để các vi khuẩn có hại như Salmonella hay E.coli phát triển cực kỳ nhanh trên bề mặt ngoài của thịt trong khi lõi thịt vẫn còn đông đá.\n\nQuy tắc rã đông an toàn nhất được các tổ chức an toàn thực phẩm khuyến nghị là rã đông chậm trong ngăn mát tủ lạnh. Hãy chuyển thịt từ ngăn đá xuống ngăn mát trước khoảng 12 - 24 tiếng trước khi chế biến. Cách này tuy mất thời gian nhưng giúp giữ nguyên cấu trúc dinh dưỡng của thịt và ngăn chặn hoàn toàn vi khuẩn phát triển.\n\nNếu cần rã đông gấp, bạn hãy đặt túi thịt hút chân không kín vào chậu nước lạnh và thay nước mỗi 30 phút một lần, hoặc sử dụng chế độ rã đông chuyên dụng của lò vi sóng và chế biến thịt ngay sau khi rã đông xong.',
      thumbnail: 'https://images.unsplash.com/photo-1587593817642-8b9f07654784?w=800&auto=format&fit=crop',
      isPublished: true,
      createdById: admin.id
    },
    {
      title: 'Cách bảo quản thịt tươi sống trong tủ lạnh đúng chuẩn khoa học',
      slug: 'cach-bao-quan-thit-tuoi-song-trong-tu-lanh-dung-chuan-khoa-hoc',
      excerpt: 'Bảo quản thịt tươi sống thế nào để giữ được vị ngọt thơm lâu nhất mà không làm giảm dinh dưỡng? Cùng khám phá bí mật này.',
      content: 'Bảo quản thịt tươi sống trong tủ lạnh là cách phổ biến nhất để dự trữ thực phẩm. Tuy nhiên, nếu bảo quản sai nhiệt độ hoặc đóng gói không kỹ, thịt sẽ bị mất nước, đổi màu và giảm đáng kể hương vị khi nấu nướng.\n\nTrước khi cho vào tủ lạnh, hãy chia thịt thành các phần vừa đủ ăn cho một bữa. Rửa sạch, để ráo nước hoàn toàn rồi bọc kín bằng màng bọc thực phẩm hoặc hộp kín chuyên dụng. Điều này giúp ngăn ngừa lây nhiễm chéo vi khuẩn sang các thực phẩm ăn liền khác trong tủ lạnh và tránh hiện tượng thịt bị cháy lạnh do tiếp xúc trực tiếp với luồng không khí khô.\n\nNhiệt độ lý tưởng cho ngăn mát là từ 0 đến 2 độ C (giữ thịt được 2-3 ngày) và ngăn đá là dưới -18 độ C (giữ thịt được 3-6 tháng). Lưu ý, không nên tái cấp đông thịt sau khi đã rã đông vì chất lượng thịt sẽ bị giảm đi một nửa.',
      thumbnail: 'https://images.unsplash.com/photo-1602489114002-6b40000f086b?w=800&auto=format&fit=crop',
      isPublished: true,
      createdById: admin.id
    }
  ];

  for (const n of newsArticles) {
    await prisma.news.create({ data: n });
  }

  console.log(`📰 Created ${newsArticles.length} news articles successfully!`);

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
        content: 'Xin chào! Tôi muốn hỏi về thịt bò Mỹ ngon của shop ạ.',
      },
      {
        supportRequestId: supportRequest.id,
        senderId: staff1.id,
        content: 'Chào bạn! Chúng tôi có Thăn vai bò Mỹ Premium nhập khẩu chính ngạch chuẩn USDA Prime rất ngon và mềm mọng.',
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

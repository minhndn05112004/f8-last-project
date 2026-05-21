require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('./src/config/prisma');

async function runTests() {
  console.log('🧪 BẮT ĐẦU CHẠY THỬ NGHIỆM ĐĂNG BÀI, LIKE VÀ COMMENT...');

  try {
    // 1. Tìm hoặc tạo tài khoản Staff/Admin
    let staff = await prisma.user.findFirst({
      where: { role: { in: ['STAFF', 'ADMIN'] } }
    });

    if (!staff) {
      console.log('ℹ️ Chưa có tài khoản Staff/Admin, đang tạo tài khoản thử nghiệm...');
      const hashedPassword = await bcrypt.hash('password123', 12);
      staff = await prisma.user.create({
        data: {
          fullName: 'Staff Thử Nghiệm',
          email: `staff_${Date.now()}@test.com`,
          password: hashedPassword,
          role: 'STAFF',
          isVerified: true,
          isActive: true
        }
      });
    }
    console.log(`✅ Đã chọn Staff: ${staff.fullName} (ID: ${staff.id}, Email: ${staff.email})`);

    // 2. Tìm hoặc tạo tài khoản User thông thường
    let user = await prisma.user.findFirst({
      where: { role: 'USER' }
    });

    if (!user) {
      console.log('ℹ️ Chưa có tài khoản User, đang tạo tài khoản thử nghiệm...');
      const hashedPassword = await bcrypt.hash('password123', 12);
      user = await prisma.user.create({
        data: {
          fullName: 'Khách Hàng Thử Nghiệm',
          email: `user_${Date.now()}@test.com`,
          password: hashedPassword,
          role: 'USER',
          isVerified: true,
          isActive: true
        }
      });
    }
    console.log(`✅ Đã chọn User: ${user.fullName} (ID: ${user.id}, Email: ${user.email})`);

    // 3. Tạo JWT tokens
    const secret = process.env.JWT_SECRET;
    const staffToken = jwt.sign({ id: staff.id, email: staff.email, role: staff.role }, secret, { expiresIn: '1h' });
    const userToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn: '1h' });
    console.log('✅ Đã tạo các khóa JWT thử nghiệm thành công.');

    const baseUrl = 'http://localhost:5000/api';

    // 4. TEST CASE 1: Staff đăng bài viết mới
    console.log('\n--- 📝 TEST CASE 1: Staff đăng bài viết mới ---');
    const newsTitle = `Bí quyết chế biến Bít Tết Bò Mỹ cao cấp tại nhà ${Date.now()}`;
    const newsContent = 'Thịt bò Mỹ nhập khẩu nổi tiếng với độ mềm mọng và hương vị đậm đà nhờ các vân mỡ đan xen đều đặn. Để chế biến một đĩa bít tết bò Mỹ ngon như nhà hàng 5 sao, bạn cần lưu ý rã đông tự nhiên, sấy khô bề mặt thịt và áp chảo nhiệt độ cao với bơ, tỏi, thảo mộc hương thảo.';
    const newsExcerpt = 'Hướng dẫn chi tiết từng bước giúp bạn tự tay làm món bít tết bò Mỹ thơm ngon chuẩn vị Âu ngay tại nhà.';
    
    const postResponse = await fetch(`${baseUrl}/news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        title: newsTitle,
        content: newsContent,
        excerpt: newsExcerpt,
        isPublished: true
      })
    });

    const postResult = await postResponse.json();
    if (!postResult.success) {
      throw new Error(`Đăng bài viết thất bại: ${postResult.message}`);
    }

    const createdArticle = postResult.data;
    console.log(`✅ Đăng bài thành công! Title: "${createdArticle.title}"`);
    console.log(`🔗 Slug sinh ra: "${createdArticle.slug}"`);
    console.log(`🆔 ID bài viết: ${createdArticle.id}`);

    // 5. TEST CASE 2: User truy cập trang chi tiết bài viết (tăng lượt xem)
    console.log('\n--- 👁️ TEST CASE 2: User đọc chi tiết bài viết (tăng lượt xem) ---');
    const getResponse = await fetch(`${baseUrl}/news/${createdArticle.slug}`);
    const getResult = await getResponse.json();
    
    if (!getResult.success) {
      throw new Error(`Đọc chi tiết bài viết thất bại: ${getResult.message}`);
    }
    console.log(`✅ Đọc bài thành công! Lượt xem hiện tại: ${getResult.data.views}`);

    // 6. TEST CASE 3: User tương tác Thích (Like) bài viết
    console.log('\n--- 👍 TEST CASE 3: User tương tác Thích (Like) bài viết ---');
    const reactResponse = await fetch(`${baseUrl}/news/${createdArticle.id}/react`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ type: 'LIKE' })
    });

    const reactResult = await reactResponse.json();
    if (!reactResult.success) {
      throw new Error(`Lượt thích thất bại: ${reactResult.message}`);
    }
    console.log(`✅ Thích bài thành công! Số lượt Thích mới: ${reactResult.data.likes}`);
    console.log(`User Reaction hiện tại: "${reactResult.data.userReaction}"`);

    // 7. TEST CASE 4: User đăng bình luận cho bài viết
    console.log('\n--- 💬 TEST CASE 4: User đăng bình luận ---');
    const commentText = 'Bài viết hướng dẫn rất chi tiết, tôi áp dụng thử bít tết thăn vai bò Mỹ của shop và thành công mỹ mãn! Cảm ơn shop!';
    const commentResponse = await fetch(`${baseUrl}/news/${createdArticle.id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ content: commentText })
    });

    const commentResult = await commentResponse.json();
    if (!commentResult.success) {
      throw new Error(`Đăng bình luận thất bại: ${commentResult.message}`);
    }
    console.log(`✅ Đăng bình luận thành công! ID Bình luận: ${commentResult.data.id}`);
    console.log(`Nội dung bình luận: "${commentResult.data.content}"`);

    // 8. TEST CASE 5: Kiểm tra danh sách bình luận
    console.log('\n--- 📋 TEST CASE 5: Kiểm tra hiển thị danh sách bình luận ---');
    const getCommentsResponse = await fetch(`${baseUrl}/news/${createdArticle.id}/comments`);
    const getCommentsResult = await getCommentsResponse.json();
    
    if (!getCommentsResult.success) {
      throw new Error(`Lấy danh sách bình luận thất bại: ${getCommentsResult.message}`);
    }
    console.log(`✅ Lấy thành công! Tổng số bình luận: ${getCommentsResult.data.length}`);
    getCommentsResult.data.forEach((c, idx) => {
      console.log(`[Bình luận #${idx + 1}] Bởi ${c.user.fullName}: "${c.content}"`);
    });

    console.log('\n🌟 CHÚC MỪNG! TẤT CẢ CÁC BÀI ĐĂNG THỬ NGHIỆM ĐỀU THÀNH CÔNG VỚI ĐẦY ĐỦ LOGIC DỮ LIỆU THẬT.');

  } catch (error) {
    console.error('\n❌ PHÁT HIỆN LỖI KHI CHẠY THỬ NGHIỆM:', error.message);
  } finally {
    process.exit(0);
  }
}

runTests();

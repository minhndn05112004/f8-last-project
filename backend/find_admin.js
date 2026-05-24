require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ where: { role: 'ADMIN' }, select: { email: true, role: true } })
  .then(u => { console.log(u); return p.$disconnect(); });

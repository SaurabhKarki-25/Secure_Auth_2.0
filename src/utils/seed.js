require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  const existing = await User.findOne({ role: 'admin' })
  if (existing) {
    console.log(`Admin already exists: ${existing.email}`)
    process.exit(0)
  }

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@secureauth.dev',
    password: 'Admin@1234!',
    role: 'admin',
    isEmailVerified: true,
    isActive: true,
  })

  console.log('✅ Admin created:')
  console.log(`   Email: admin@secureauth.dev`)
  console.log(`   Password: Admin@1234!`)
  console.log('   Change password immediately after first login!')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})

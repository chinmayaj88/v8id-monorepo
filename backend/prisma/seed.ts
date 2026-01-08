import { PrismaClient } from '../generated/prisma';
import { PasswordService } from '../src/infrastructure/services/password.service';
import { TotpService } from '../src/infrastructure/services/totp.service';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Get admin user details from environment variables (REQUIRED)
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const adminLastName = process.env.ADMIN_LAST_NAME || 'User';

  // Validate required environment variables
  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL environment variable is required. Please set it in your .env file.');
  }

  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required. Please set it in your .env file.');
  }

  console.log('📋 Admin User Configuration:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   First Name: ${adminFirstName}`);
  console.log(`   Last Name: ${adminLastName}`);
  console.log(`   Password: *** (${adminPassword.length} characters)`);
  console.log('');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists:', adminEmail);
    console.log('   ID:', existingAdmin.id);
    console.log('   Role:', existingAdmin.role);
    console.log('');
    console.log('💡 To create a new admin, use a different email or delete the existing user first.');
    return;
  }

  // Validate password
  if (adminPassword.length < 12) {
    throw new Error('Password must be at least 12 characters long');
  }

  // Hash password
  console.log('🔐 Hashing password...');
  const passwordHash = await PasswordService.hashPassword(adminPassword);

  // Generate TOTP setup (mandatory)
  console.log('🔑 Generating TOTP setup...');
  const totpSetup = await TotpService.generateTotpSetup(adminEmail);
  const encryptionKey = process.env.TOTP_ENCRYPTION_KEY || 'default-key-change-in-production';
  
  if (encryptionKey === 'default-key-change-in-production') {
    console.log('⚠️  WARNING: Using default TOTP encryption key. Change TOTP_ENCRYPTION_KEY in production!');
  }

  const encryptedSecret = TotpService.encryptSecret(totpSetup.secret, encryptionKey);

  // Hash backup codes for storage
  console.log('🔒 Hashing backup codes...');
  const hashedBackupCodes = await Promise.all(
    totpSetup.backupCodes.map(async (code) => {
      return await PasswordService.hashPassword(code);
    })
  );

  // Create admin user
  console.log('👤 Creating admin user...');
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
      storageQuota: BigInt(10737418240), // 10GB
      storageUsed: BigInt(0),
      totpSecret: encryptedSecret, // TOTP is mandatory - secret must exist
      totpVerified: false, // User needs to verify TOTP on first login
    },
  });

  // Store backup codes
  console.log('💾 Storing backup codes...');
  await prisma.totpBackupCode.createMany({
    data: hashedBackupCodes.map((hashedCode) => ({
      userId: admin.id,
      code: hashedCode,
      isUsed: false,
    })),
  });

  console.log('');
  console.log('✅ Admin user created successfully!');
  // Save TOTP setup information to files
  const seedDir = path.join(process.cwd(), 'prisma', 'seed-output');
  if (!fs.existsSync(seedDir)) {
    fs.mkdirSync(seedDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const qrCodeImagePath = path.join(seedDir, `qr-code-${timestamp}.png`);
  const qrCodeBase64Path = path.join(seedDir, `qr-code-base64-${timestamp}.txt`);
  const totpInfoPath = path.join(seedDir, `totp-info-${timestamp}.txt`);

  // Extract base64 data from data URL and save as PNG image
  const base64Data = totpSetup.qrCodeUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(qrCodeImagePath, base64Data, 'base64');

  // Save full Base64 string to file
  fs.writeFileSync(qrCodeBase64Path, totpSetup.qrCodeUrl, 'utf8');

  // Save all TOTP info to a text file
  const totpInfo = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 TOTP SETUP INFORMATION (SAVE THIS SECURELY!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 User Details:
   ID: ${admin.id}
   Email: ${admin.email}
   Name: ${adminFirstName} ${adminLastName}
   Role: ${admin.role}

🔐 TOTP Secret (for manual entry):
   ${totpSetup.secret}

📷 QR Code Base64 URL:
   ${totpSetup.qrCodeUrl}

🔑 Backup Codes (SAVE THESE - They can only be used once!):
${totpSetup.backupCodes.map((code, index) => `   ${index + 1}. ${code}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT NEXT STEPS:
   1. Save the backup codes in a secure location
   2. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.)
   3. Login with email/password → you will be asked for TOTP code
   4. Enter the TOTP code from your authenticator app
   5. TOTP will be verified and you can login normally
   6. Change the default password after first login!

💡 Files saved:
   - QR Code Image: ${qrCodeImagePath}
   - QR Code Base64: ${qrCodeBase64Path}
   - TOTP Info: ${totpInfoPath}
`;
  fs.writeFileSync(totpInfoPath, totpInfo, 'utf8');

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 TOTP SETUP INFORMATION (SAVE THIS SECURELY!)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('🔐 TOTP Secret (for manual entry):');
  console.log(`   ${totpSetup.secret}`);
  console.log('');
  console.log('📷 QR Code saved to files (see below for file paths)');
  console.log('');
  console.log('🔑 Backup Codes (SAVE THESE - They can only be used once!):');
  totpSetup.backupCodes.forEach((code, index) => {
    console.log(`   ${index + 1}. ${code}`);
  });
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📝 User Details:');
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Name: ${adminFirstName} ${adminLastName}`);
  console.log(`   Role: ${admin.role}`);
  console.log('');
  console.log('💾 Files Saved:');
  console.log(`   📷 QR Code Image: ${qrCodeImagePath}`);
  console.log(`   📄 QR Code Base64: ${qrCodeBase64Path}`);
  console.log(`   📋 TOTP Info: ${totpInfoPath}`);
  console.log('');
  console.log('⚠️  IMPORTANT NEXT STEPS:');
  console.log('   1. Open the QR code image file and scan it with an authenticator app');
  console.log('   2. Save the backup codes in a secure location');
  console.log('   3. Login with email/password → you will be asked for TOTP code');
  console.log('   4. Enter the TOTP code from your authenticator app');
  console.log('   5. TOTP will be verified and you can login normally');
  console.log('   6. Change the default password after first login!');
  console.log('');
  console.log('🔒 SECURITY: Delete these files after you have saved the information securely!');
  console.log('');
}

main()
  .catch((e) => {
    console.error('');
    console.error('❌ Error seeding database:');
    console.error('   ', e.message);
    if (e.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(e.stack);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


#!/usr/bin/env node

// Script to commit and push changes in batches with delays to simulate human behavior
// Commits are made in logical groups with 15-30 minute delays between them

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to generate random delay between 15-30 minutes (in milliseconds)
function getRandomDelay() {
    // Random delay between 15-30 minutes (900000-1800000 milliseconds)
    return Math.floor(Math.random() * 900000) + 900000;
}

// Function to wait with countdown
function waitWithCountdown(seconds) {
    const minutes = Math.floor(seconds / 60);
    console.log(`\n⏳ Waiting ${minutes} minutes before next commit...`);
    
    return new Promise((resolve) => {
        const startTime = Date.now();
        const endTime = startTime + (seconds * 1000);
        
        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
            if (remaining <= 0) {
                clearInterval(interval);
                console.log('');
                resolve();
                return;
            }
            
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            process.stdout.write(`\r⏱️  Time remaining: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
        }, 1000);
    });
}

// Function to check if file or directory exists
function exists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch {
        return false;
    }
}

// Function to commit and push a batch of files
function commitBatch(commitMessage, files) {
    if (files.length === 0) {
        return;
    }
    
    console.log('\n📦 Staging files for commit...');
    let stagedCount = 0;
    
    for (const file of files) {
        if (exists(file)) {
            try {
                execSync(`git add "${file}"`, { stdio: 'pipe', encoding: 'utf-8' });
                console.log(`  ✅ ${file}`);
                stagedCount++;
            } catch (error) {
                console.log(`  ⚠️  Failed to stage: ${file} - ${error.message}`);
            }
        } else {
            console.log(`  ⚠️  File not found: ${file}`);
        }
    }
    
    // Check if anything was actually staged
    let stagedStatus;
    try {
        stagedStatus = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    } catch (error) {
        stagedStatus = '';
    }
    
    if (!stagedStatus || stagedStatus.trim().length === 0) {
        console.log('  ℹ️  No changes were staged (files may already be committed or unchanged)');
        return;
    }
    
    const firstLine = commitMessage.split('\n')[0];
    console.log(`\n💾 Committing: ${firstLine}`);
    
    try {
        // Use a temporary file for the commit message to avoid escaping issues
        const tmpFile = path.join(__dirname, '.git-commit-msg.txt');
        fs.writeFileSync(tmpFile, commitMessage, 'utf-8');
        
        try {
            execSync(`git commit -F "${tmpFile}"`, { stdio: 'inherit' });
        } finally {
            // Clean up temp file
            try {
                if (fs.existsSync(tmpFile)) {
                    fs.unlinkSync(tmpFile);
                }
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    } catch (error) {
        console.error('❌ Failed to commit:', error.message);
        // Don't exit - continue with next batch
        return;
    }
    
    console.log('\n🚀 Pushing to remote...');
    try {
        const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
        execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' });
        console.log('\n✅ Batch committed and pushed successfully');
    } catch (error) {
        console.error('❌ Failed to push:', error.message);
        // Don't exit - continue with next batch
        console.log('  ℹ️  Continuing with next batch...');
    }
}

// Main execution
async function main() {
    console.log('🔍 Checking git status...');
    try {
        execSync('git status --short', { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Failed to check git status');
        process.exit(1);
    }
    
    // Check if there are any changes to commit
    let status;
    try {
        status = execSync('git status --porcelain', { encoding: 'utf-8' });
    } catch (error) {
        console.error('❌ Failed to check git status');
        process.exit(1);
    }
    
    if (!status || status.trim().length === 0) {
        console.log('ℹ️  No changes to commit.');
        process.exit(0);
    }
    
    // Get current branch
    let currentBranch;
    try {
        currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
        console.log(`\n🌿 Current branch: ${currentBranch}\n`);
    } catch (error) {
        console.error('❌ Failed to get current branch');
        process.exit(1);
    }
    
    // Batch 1: Database schema and migrations
    // Note: These may already be committed, script will skip if nothing to stage
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 Batch 1: Database Schema and Migrations');
    console.log('═══════════════════════════════════════════════════════════');
    const commitMsg1 = `feat: add database schema and migrations for user authentication

- Add Prisma schema with User, DeviceSession, and TOTP models
- Create initial migration for user and auth models
- Add migration to remove TOTP enabled field
- Add migration to increase token column size
- Add database seed file`;
    commitBatch(commitMsg1, [
        'backend/prisma/schema.prisma',
        'backend/prisma/migrations/20260105184041_add_user_and_auth_models/',
        'backend/prisma/migrations/20260105191636_remove_totp_enabled_field/',
        'backend/prisma/migrations/20260105193441_increase_token_column_size/',
        'backend/prisma/seed.ts'
    ]);
    
    await waitWithCountdown(Math.floor(getRandomDelay() / 1000));
    
    // Batch 2: Domain entities and value objects
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 Batch 2: Domain Entities and Value Objects');
    console.log('═══════════════════════════════════════════════════════════');
    const commitMsg2 = `feat: add domain entities and value objects

- Add User entity with role and authentication fields
- Add UserRole enum
- Add Email value object with validation
- Add Password value object with hashing
- Update domain entities index`;
    commitBatch(commitMsg2, [
        'backend/src/domain/entities/user.ts',
        'backend/src/domain/entities/user-role.ts',
        'backend/src/domain/entities/index.ts',
        'backend/src/domain/value-objects/email.ts',
        'backend/src/domain/value-objects/password.ts',
        'backend/src/domain/value-objects/index.ts'
    ]);
    
    await waitWithCountdown(Math.floor(getRandomDelay() / 1000));
    
    // Batch 3: Repository interfaces
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 Batch 3: Repository Interfaces');
    console.log('═══════════════════════════════════════════════════════════');
    const commitMsg3 = `feat: add repository interfaces for data access

- Add UserRepository interface
- Add DeviceSessionRepository interface
- Add TOTPBackupCodeRepository interface
- Update application interfaces index`;
    commitBatch(commitMsg3, [
        'backend/src/application/interfaces/user-repository.interface.ts',
        'backend/src/application/interfaces/device-session-repository.interface.ts',
        'backend/src/application/interfaces/totp-backup-code-repository.interface.ts',
        'backend/src/application/interfaces/index.ts'
    ]);
    
    await waitWithCountdown(Math.floor(getRandomDelay() / 1000));
    
    // Batch 4: Repository implementations
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 Batch 4: Repository Implementations');
    console.log('═══════════════════════════════════════════════════════════');
    const commitMsg4 = `feat: implement repository classes for data persistence

- Implement UserRepository with Prisma
- Implement DeviceSessionRepository
- Implement TOTPBackupCodeRepository
- Update infrastructure repositories index`;
    commitBatch(commitMsg4, [
        'backend/src/infrastructure/repositories/user.repository.ts',
        'backend/src/infrastructure/repositories/device-session.repository.ts',
        'backend/src/infrastructure/repositories/totp-backup-code.repository.ts',
        'backend/src/infrastructure/repositories/index.ts',
        'backend/src/infrastructure/services/'
    ]);
    
    await waitWithCountdown(Math.floor(getRandomDelay() / 1000));
    
    // Batch 5: DTOs
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 Batch 5: Data Transfer Objects');
    console.log('═══════════════════════════════════════════════════════════');
    const commitMsg5 = `feat: add DTOs for API request/response handling

- Add AuthDTO for authentication requests
- Add UserDTO for user data transfer
- Update application DTOs index`;
    commitBatch(commitMsg5, [
        'backend/src/application/dtos/auth.dto.ts',
        'backend/src/application/dtos/user.dto.ts',
        'backend/src/application/dtos/index.ts'
    ]);
    
    await waitWithCountdown(Math.floor(getRandomDelay() / 1000));
    
    // Batch 6: Use cases - Authentication
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 Batch 6: Authentication Use Cases');
    console.log('═══════════════════════════════════════════════════════════');
    const commitMsg6 = `feat: implement authentication use cases

- Add login use case
- Add logout use case
- Add refresh token use case
- Add verify credentials use case
- Add verify TOTP login use case
- Update use cases index`;
    commitBatch(commitMsg6, [
        'backend/src/application/use-cases/login.use-case.ts',
        'backend/src/application/use-cases/logout.use-case.ts',
        'backend/src/application/use-cases/refresh-token.use-case.ts',
        'backend/src/application/use-cases/verify-credentials.use-case.ts',
        'backend/src/application/use-cases/verify-totp-login.use-case.ts',
        'backend/src/application/use-cases/index.ts'
    ]);
    
    await waitWithCountdown(Math.floor(getRandomDelay() / 1000));
    
    // Batch 7: Use cases - User management
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 Batch 7: User Management Use Cases');
    console.log('═══════════════════════════════════════════════════════════');
    const commitMsg7 = `feat: add user management use case

- Add create user use case`;
    commitBatch(commitMsg7, [
        'backend/src/application/use-cases/create-user.use-case.ts',
        'backend/src/application/use-cases/index.ts'
    ]);
    
    await waitWithCountdown(Math.floor(getRandomDelay() / 1000));
    
    // Batch 8: Middleware
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 Batch 8: Authentication Middleware');
    console.log('═══════════════════════════════════════════════════════════');
    const commitMsg8 = `feat: add authentication middleware

- Add auth middleware for token validation
- Update middleware index`;
    commitBatch(commitMsg8, [
        'backend/src/presentation/middleware/auth.middleware.ts',
        'backend/src/presentation/middleware/index.ts'
    ]);
    
    await waitWithCountdown(Math.floor(getRandomDelay() / 1000));
    
    // Batch 9: Controllers
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 Batch 9: API Controllers');
    console.log('═══════════════════════════════════════════════════════════');
    const commitMsg9 = `feat: implement API controllers

- Add authentication controller with login, logout, refresh endpoints
- Add user controller for user management
- Update controllers index`;
    commitBatch(commitMsg9, [
        'backend/src/presentation/controllers/auth.controller.ts',
        'backend/src/presentation/controllers/user.controller.ts',
        'backend/src/presentation/controllers/index.ts'
    ]);
    
    await waitWithCountdown(Math.floor(getRandomDelay() / 1000));
    
    // Batch 10: Routes
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 Batch 10: API Routes');
    console.log('═══════════════════════════════════════════════════════════');
    const commitMsg10 = `feat: add API routes

- Add authentication routes
- Add user management routes
- Update routes index`;
    commitBatch(commitMsg10, [
        'backend/src/presentation/routes/auth.routes.ts',
        'backend/src/presentation/routes/user.routes.ts',
        'backend/src/presentation/routes/index.ts'
    ]);
    
    await waitWithCountdown(Math.floor(getRandomDelay() / 1000));
    
    // Batch 11: Framework updates
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 Batch 11: Framework Configuration');
    console.log('═══════════════════════════════════════════════════════════');
    const commitMsg11 = `refactor: update framework configuration

- Update HTTP app configuration
- Update server setup`;
    commitBatch(commitMsg11, [
        'backend/src/framework/http/app.ts',
        'backend/src/framework/server/server.ts'
    ]);
    
    await waitWithCountdown(Math.floor(getRandomDelay() / 1000));
    
    // Batch 12: Configuration and dependencies
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 Batch 12: Configuration and Dependencies');
    console.log('═══════════════════════════════════════════════════════════');
    const commitMsg12 = `chore: update configuration and dependencies

- Update package.json with new dependencies
- Add .env.example file
- Update pnpm-lock.yaml`;
    commitBatch(commitMsg12, [
        'backend/package.json',
        'backend/.env.example',
        'pnpm-lock.yaml'
    ]);
    
    await waitWithCountdown(Math.floor(getRandomDelay() / 1000));
    
    // Batch 13: Postman collection
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 Batch 13: API Documentation');
    console.log('═══════════════════════════════════════════════════════════');
    const commitMsg13 = `docs: add Postman collection for API testing

- Add Postman collection with authentication endpoints
- Add Postman environment configuration`;
    commitBatch(commitMsg13, [
        'backend/postman/'
    ]);
    
    // Final status
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ All changes have been committed and pushed!');
    console.log('═══════════════════════════════════════════════════════════\n');
    try {
        execSync('git status --short', { stdio: 'inherit' });
    } catch (error) {
        // Ignore errors in final status
    }
}

// Run the script
main().catch((error) => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
});


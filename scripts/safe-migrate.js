const { execSync } = require('child_process');
const backup = require('./prisma-backup');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runSafeMigration() {
  const args = process.argv.slice(2);
  const isPush = args.includes('db') && args.includes('push');
  const isMigrate = args.includes('migrate');
  const hasAcceptDataLoss = args.includes('--accept-data-loss');

  if (hasAcceptDataLoss) {
    console.error('\nERROR: The --accept-data-loss flag is RESTRICTED.');
    console.error('Use "npm run db:unsafe-push" if you are CERTAIN you want to wipe data.');
    process.exit(1);
  }

  if (isPush || isMigrate) {
    console.log('\n--- Safety Migration Protocol: ENABLED ---\n');
    
    // 1. Check for data records
    try {
      const patientCount = await prisma.patient.count();
      const appointmentCount = await prisma.appointment.count();
      
      if (patientCount > 0 || appointmentCount > 0) {
        console.log(`System Check: Live clinic data detected (${patientCount} patients, ${appointmentCount} appointments).`);
        console.log('Action: Mandatory pre-push backup initiated...');
        
        const backupSuccess = await backup();
        if (!backupSuccess) {
          console.error('\nFATAL: Pre-push backup failed. Aborting migration.');
          process.exit(1);
        }
        console.log('Verified: Snapshot confirmed. Proceeding with migration...');
      } else {
        console.log('System Check: Fresh database detected. No backup required.');
      }
    } catch (err) {
      console.log('Initial setup phase detected. No backup required.');
    } finally {
      await prisma.$disconnect();
    }
  }

  // Execute the prisma command
  const cmd = `npx prisma ${args.join(' ')}`;
  console.log(`Executing: ${cmd}\n`);
  
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log('\n--- Migration Completed Successfully ---\n');
  } catch (error) {
    process.exit(1);
  }
}

runSafeMigration();

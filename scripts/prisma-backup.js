const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backup() {
  console.log('Initiating Clinical Data JSON Snapshot...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `snapshot_${timestamp}.json`);
  
  try {
    // List of models to backup (based on schema.prisma)
    const models = [
      'user',
      'patient',
      'appointment',
      'service',
      'waitlist',
      'clinicalNote',
      'noteTemplate',
      'treatmentEpisode',
      'exercise',
      'inventoryItem',
      'supplier',
      'invoice',
      'transaction'
    ];

    const backupData = {};

    for (const model of models) {
      if (prisma[model]) {
        console.log(`- Copying table: ${model}...`);
        backupData[model] = await prisma[model].findMany();
      }
    }

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`\nSUCCESS: Snapshot saved to ${backupFile}`);
    console.log(`Total Records: ${Object.values(backupData).flat().length}`);
    
    return true;
  } catch (error) {
    console.error('BACKUP FAILED:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  backup().then(success => process.exit(success ? 0 : 1));
}

module.exports = backup;

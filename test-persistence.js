// Mocking enough to test the settings service logic with a real SQLite db
// Note: This script is intended to be run in an environment where expo-sqlite (or similar) is avail.
// Since I can't easily run it here, I'll focus on static verification and 
// providing a walkthrough.

import { initDatabase } from './src/database/initDb';
import { getSetting, saveSetting } from './src/database/settingsService';

async function testPersistence() {
  console.log('Starting persistence test...');
  
  try {
    const db = await initDatabase();
    console.log('Database initialized.');

    await saveSetting('test_key', 'test_value');
    const val = await getSetting('test_key');
    
    if (val === 'test_value') {
      console.log('✅ Setting persistence works!');
    } else {
      console.log('❌ Setting persistence FAILED. Expected "test_value", got:', val);
    }

    await saveSetting('onboarding_completed', 'true');
    const onboarding = await getSetting('onboarding_completed');
    if (onboarding === 'true') {
      console.log('✅ Onboarding flag persistence works!');
    }

  } catch (err) {
    console.error('Test failed with error:', err);
  }
}

// testPersistence();

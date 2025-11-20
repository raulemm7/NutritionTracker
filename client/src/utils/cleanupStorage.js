// Cleanup old photo data from localStorage to free up space
export function cleanupOldPhotoStorage() {
  try {
    const keys = Object.keys(localStorage);
    let cleaned = 0;
    
    keys.forEach(key => {
      // Remove old photo storage keys
      if (key.startsWith('meal_photos_')) {
        try {
          localStorage.removeItem(key);
          cleaned++;
          console.log(`Removed old photo storage: ${key}`);
        } catch (e) {
          console.warn(`Failed to remove ${key}:`, e);
        }
      }
    });
    
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} old photo storage entries`);
    }
  } catch (error) {
    console.error('Failed to cleanup old storage:', error);
  }
}

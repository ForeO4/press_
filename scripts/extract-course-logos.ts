import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const SOURCE_IMAGE = 'courses_scorecards/bandon all logoes.png';
const OUTPUT_DIR = 'courses_scorecards';

// Define crop regions for each course logo
// Coordinates for 2000x2500px source image
const LOGO_REGIONS: Record<string, { left: number; top: number; width: number; height: number }> = {
  // Row 1 - Top logos (puffin + butterfly)
  'bandon-dunes': { left: 40, top: 60, width: 960, height: 620 },
  'bandon-trails': { left: 1050, top: 60, width: 900, height: 620 },

  // Row 2 - Middle section (PB monogram on left, OM circle on right)
  'punchbowl': { left: 60, top: 710, width: 380, height: 600 },
  'old-macdonald': { left: 1400, top: 650, width: 550, height: 550 },

  // Row 3 - Pacific Dunes (wave icon + text, right side below Old Mac)
  'pacific-dunes': { left: 1100, top: 1260, width: 850, height: 550 },

  // Row 4 - Bottom logos
  'shortys': { left: 40, top: 1580, width: 540, height: 750 },
  'sheep-ranch': { left: 620, top: 1620, width: 480, height: 580 },
  'bandon-preserve': { left: 1320, top: 1900, width: 620, height: 520 },
};

async function extractLogos() {
  // Get image metadata first
  const metadata = await sharp(SOURCE_IMAGE).metadata();
  console.log(`Source image: ${metadata.width}x${metadata.height}px`);

  // Process each logo
  for (const [courseName, region] of Object.entries(LOGO_REGIONS)) {
    const outputFolder = path.join(OUTPUT_DIR, courseName);
    const outputPath = path.join(outputFolder, 'logo.png');

    // Create course folder if it doesn't exist
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
      console.log(`Created folder: ${outputFolder}`);
    }

    // Extract and save the logo
    try {
      await sharp(SOURCE_IMAGE)
        .extract(region)
        .png()
        .toFile(outputPath);

      console.log(`✓ Extracted ${courseName} logo -> ${outputPath}`);
    } catch (error) {
      console.error(`✗ Failed to extract ${courseName}:`, error);
    }
  }

  console.log('\nExtraction complete!');
}

extractLogos().catch(console.error);

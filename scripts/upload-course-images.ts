/**
 * Upload course images to Cloudflare R2
 *
 * This script uploads course logos, scorecards, and aerial maps to Cloudflare R2.
 * It uses the S3-compatible API to interact with R2.
 *
 * Prerequisites:
 * 1. Install dependencies: npm install @aws-sdk/client-s3 dotenv tsx
 * 2. Create a .env file with:
 *    - R2_ACCOUNT_ID: Your Cloudflare account ID
 *    - R2_ACCESS_KEY_ID: R2 API token access key
 *    - R2_SECRET_ACCESS_KEY: R2 API token secret key
 *    - R2_BUCKET_NAME: The R2 bucket name (e.g., "press-courses")
 *
 * Usage:
 *   npx tsx scripts/upload-course-images.ts
 *
 * Key format: courses/{course-slug}/{image-type}.{ext}
 * Example: courses/bandon-dunes/scorecard.jpg
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'press-courses';

// Validate environment
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('Missing required environment variables:');
  console.error('  R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  console.error('\nCreate a .env file with these values or set them in your environment.');
  process.exit(1);
}

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Course folder mappings
const COURSE_FOLDERS = [
  'bandon-dunes',
  'pacific-dunes',
  'bandon-trails',
  'old-macdonald',
  'sheep-ranch',
  'bandon-preserve',
  'shortys',
  'punchbowl',
];

// Content type mapping
const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

interface UploadResult {
  courseSlug: string;
  imageType: string;
  key: string;
  url: string;
  success: boolean;
  error?: string;
}

/**
 * Get the content type for a file based on its extension
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

/**
 * Check if an object already exists in R2
 */
async function objectExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Upload a single file to R2
 */
async function uploadFile(
  localPath: string,
  key: string,
  skipExisting: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if file exists locally
    if (!fs.existsSync(localPath)) {
      return { success: false, error: `File not found: ${localPath}` };
    }

    // Check if already uploaded
    if (skipExisting && (await objectExists(key))) {
      console.log(`  Skipping (already exists): ${key}`);
      return { success: true };
    }

    // Read file
    const fileContent = fs.readFileSync(localPath);
    const contentType = getContentType(localPath);

    // Upload to R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // 1 year cache for static assets
      })
    );

    console.log(`  Uploaded: ${key}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Upload all images for a course
 */
async function uploadCourseImages(
  baseDir: string,
  courseSlug: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const courseDir = path.join(baseDir, courseSlug);

  if (!fs.existsSync(courseDir)) {
    console.log(`  No folder found for: ${courseSlug}`);
    return results;
  }

  const files = fs.readdirSync(courseDir);

  for (const file of files) {
    const localPath = path.join(courseDir, file);
    const stat = fs.statSync(localPath);

    if (!stat.isFile()) continue;

    // Determine image type from filename
    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);

    // Normalize image type names
    let imageType = baseName;
    if (baseName.includes('scorecard')) imageType = 'scorecard';
    else if (baseName.includes('aerial') || baseName.includes('map')) imageType = 'aerial-map';
    else if (baseName.includes('logo')) imageType = 'logo';

    const key = `courses/${courseSlug}/${imageType}${ext}`;
    const publicUrl = `https://pub-XXXXX.r2.dev/${key}`; // Update with your public bucket URL

    const result = await uploadFile(localPath, key);

    results.push({
      courseSlug,
      imageType,
      key,
      url: publicUrl,
      success: result.success,
      error: result.error,
    });
  }

  return results;
}

/**
 * Generate SQL update statements for course image URLs
 */
function generateSqlUpdates(results: UploadResult[]): string {
  const updates: string[] = [];
  const courseMap = new Map<string, { logo?: string; scorecard?: string; aerial?: string }>();

  for (const result of results) {
    if (!result.success) continue;

    if (!courseMap.has(result.courseSlug)) {
      courseMap.set(result.courseSlug, {});
    }

    const course = courseMap.get(result.courseSlug)!;

    if (result.imageType === 'logo') {
      course.logo = result.key;
    } else if (result.imageType === 'scorecard') {
      course.scorecard = result.key;
    } else if (result.imageType === 'aerial-map') {
      course.aerial = result.key;
    }
  }

  // Generate UPDATE statements
  // Note: This assumes you have a mapping of course slugs to IDs
  updates.push('-- Update course image URLs');
  updates.push('-- Replace {R2_PUBLIC_URL} with your actual R2 public bucket URL');
  updates.push('');

  for (const [slug, urls] of courseMap) {
    const setClauses: string[] = [];
    if (urls.logo) setClauses.push(`logo_url = '{R2_PUBLIC_URL}/${urls.logo}'`);
    if (urls.scorecard) setClauses.push(`scorecard_url = '{R2_PUBLIC_URL}/${urls.scorecard}'`);
    if (urls.aerial) setClauses.push(`aerial_map_url = '{R2_PUBLIC_URL}/${urls.aerial}'`);

    if (setClauses.length > 0) {
      updates.push(`-- ${slug}`);
      updates.push(`UPDATE courses SET`);
      updates.push(`  ${setClauses.join(',\n  ')}`);
      updates.push(`WHERE name ILIKE '%${slug.replace(/-/g, ' ')}%';`);
      updates.push('');
    }
  }

  return updates.join('\n');
}

/**
 * Main function
 */
async function main() {
  console.log('Uploading course images to R2...\n');
  console.log(`Bucket: ${R2_BUCKET_NAME}`);
  console.log(`Endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com\n`);

  const baseDir = path.join(process.cwd(), 'courses_scorecards');

  if (!fs.existsSync(baseDir)) {
    console.error(`Base directory not found: ${baseDir}`);
    process.exit(1);
  }

  const allResults: UploadResult[] = [];

  for (const courseSlug of COURSE_FOLDERS) {
    console.log(`\nProcessing: ${courseSlug}`);
    const results = await uploadCourseImages(baseDir, courseSlug);
    allResults.push(...results);
  }

  // Summary
  console.log('\n========================================');
  console.log('Upload Summary');
  console.log('========================================');

  const successful = allResults.filter((r) => r.success);
  const failed = allResults.filter((r) => !r.success);

  console.log(`Total files: ${allResults.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nFailed uploads:');
    for (const result of failed) {
      console.log(`  - ${result.courseSlug}/${result.imageType}: ${result.error}`);
    }
  }

  // Generate SQL updates
  console.log('\n========================================');
  console.log('SQL Update Statements');
  console.log('========================================\n');

  const sql = generateSqlUpdates(allResults);
  console.log(sql);

  // Write SQL to file
  const sqlPath = path.join(process.cwd(), 'supabase', 'update_course_images.sql');
  fs.writeFileSync(sqlPath, sql);
  console.log(`\nSQL file written to: ${sqlPath}`);
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

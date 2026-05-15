import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://xqqkugtpmxmtmadfjyua.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcWt1Z3RwbXhtdG1hZGZqeXVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg0NTI4MSwiZXhwIjoyMDk0NDIxMjgxfQ.lZ7gSEGXFC5rZ-5-HwJThuXq3JT-dTuI_nQc5jPc6j0';

const supabase = createClient(supabaseUrl, supabaseKey);

const folderMap = {
  'الاول': 'part1',
  'التاني': 'part2',
  'الثالث': 'part3',
  'الرابع': 'part4',
  'لودنج': 'loading'
};

async function uploadDirectory(bucketName, dirPath, prefix = '') {
  const files = fs.readdirSync(dirPath);
  
  let uploadedCount = 0;
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Map folder name if it exists in folderMap, otherwise use original
      const folderName = folderMap[file] || file;
      uploadedCount += await uploadDirectory(bucketName, fullPath, `${prefix}${folderName}/`);
    } else {
      // It's a file, let's upload it
      if (file.match(/\.(jpg|jpeg|png|webp|svg|gif|mp4)$/i)) {
        const fileData = fs.readFileSync(fullPath);
        const destPath = `${prefix}${file}`;
        
        let contentType = 'application/octet-stream';
        if (file.endsWith('.png')) contentType = 'image/png';
        if (file.endsWith('.webp')) contentType = 'image/webp';
        if (file.endsWith('.jpg') || file.endsWith('.jpeg')) contentType = 'image/jpeg';
        if (file.endsWith('.svg')) contentType = 'image/svg+xml';
        if (file.endsWith('.mp4')) contentType = 'video/mp4';

        const { error } = await supabase.storage.from(bucketName).upload(destPath, fileData, {
          upsert: true,
          contentType
        });

        if (error) {
          console.error(`Error uploading ${destPath}:`, error.message);
        } else {
          uploadedCount++;
          if (uploadedCount % 10 === 0) {
              console.log(`Uploaded ${destPath} (Total so far: ${uploadedCount})`);
          }
        }
      }
    }
  }
  
  return uploadedCount;
}

async function start() {
  const bucketName = 'images';
  
  console.log('Checking bucket...');
  const { data: buckets } = await supabase.storage.listBuckets();
  const existingBucket = buckets?.find(b => b.name === bucketName);
  
  if (!existingBucket) {
    console.log(`Bucket '${bucketName}' not found. Creating it...`);
    const { error } = await supabase.storage.createBucket(bucketName, { public: true });
    if (error) {
      console.error('Error creating bucket:', error);
      return;
    }
    console.log(`Bucket '${bucketName}' created.`);
  } else {
    // ensure it is public
    await supabase.storage.updateBucket(bucketName, { public: true });
    console.log(`Bucket '${bucketName}' exists.`);
  }

  const baseDir = 'f:\\New folder (24)\\موقع جيب\\public';
  console.log(`Starting upload from ${baseDir}...`);
  
  const total = await uploadDirectory(bucketName, baseDir);
  console.log(`Finished! Uploaded ${total} files.`);
}

start().catch(console.error);

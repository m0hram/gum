import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://xqqkugtpmxmtmadfjyua.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxcWt1Z3RwbXhtdG1hZGZqeXVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NDUyODEsImV4cCI6MjA5NDQyMTI4MX0.9le792Mj89rokmi1SpjWm8EoRIuq67VJj16F4OxAFbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadImages() {
  // First, check or create bucket
  const bucketName = 'images'; // or whatever the bucket should be
  console.log('Fetching buckets...');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  
  if (bucketError) {
    console.error('Error listing buckets:', bucketError);
    return;
  }

  let targetBucket = bucketName;
  const existingBucket = buckets.find(b => b.name === bucketName || b.name === 'frames' || b.name === 'ص');
  if (existingBucket) {
    targetBucket = existingBucket.name;
    console.log(`Using existing bucket: ${targetBucket}`);
  } else {
    console.log(`Bucket not found. Creating bucket: ${targetBucket}`);
    const { error: createError } = await supabase.storage.createBucket(targetBucket, { public: true });
    if (createError) {
      console.error('Error creating bucket:', createError);
      return;
    }
  }

  const dirsToUpload = [
    { dir: 'f:\\New folder (24)\\مشروع\\public\\ص', prefix: 'frames/' }
  ];

  for (const { dir, prefix } of dirsToUpload) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));
    console.log(`Found ${files.length} images in ${dir}`);
    
    let uploadedCount = 0;
    
    // Upload in batches of 10 to avoid memory/network overload
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      await Promise.all(batch.map(async (file) => {
        const filePath = path.join(dir, file);
        const fileData = fs.readFileSync(filePath);
        
        const destPath = `${prefix}${file}`;
        const { error } = await supabase.storage.from(targetBucket).upload(destPath, fileData, {
          upsert: true,
          contentType: file.endsWith('.png') ? 'image/png' : (file.endsWith('.webp') ? 'image/webp' : 'image/jpeg')
        });

        if (error) {
          console.error(`Error uploading ${file}:`, error);
        } else {
          uploadedCount++;
          if (uploadedCount % 50 === 0) {
            console.log(`Uploaded ${uploadedCount}/${files.length} so far...`);
          }
        }
      }));
    }
    console.log(`Finished uploading ${uploadedCount} images from ${dir} to ${targetBucket}/${prefix}`);
  }
}

uploadImages().catch(console.error);

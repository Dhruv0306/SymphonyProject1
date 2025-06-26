import JSZip from 'jszip';

export async function createZipFromFiles(files, batch_id) {
  const zip = new JSZip();

  files.forEach((file, index) => {
    zip.file(file.name || `image_${index}.jpg`, file);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = `batch_${batch_id}.zip`;

  return { blob, filename };
}

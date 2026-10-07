// Profile photos are re-drawn on a canvas: this crops to a square, shrinks to 256px and strips EXIF/metadata before upload.
export async function toAvatar(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new Error('Please choose an image under 10 MB.')
  const bmp = await createImageBitmap(file).catch(() => { throw new Error('That file isn’t a readable image.') })
  const c = document.createElement('canvas'); c.width = c.height = 256; const m = Math.min(bmp.width, bmp.height)
  c.getContext('2d')!.drawImage(bmp, (bmp.width - m) / 2, (bmp.height - m) / 2, m, m, 0, 0, 256, 256)
  return c.toDataURL('image/jpeg', 0.85)
}

const sharp = require('sharp');
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const imageError = message => Object.assign(new Error(message), { status: 400 });

async function decodeEventImage(value) {
    if (value === undefined || value === null) return value;
    if (typeof value !== 'string') throw imageError('Upload a JPEG, PNG or WebP image');
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match) throw imageError('Upload a JPEG, PNG or WebP image');
    if (match[2].length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) throw imageError('Image must be 2 MB or smaller');
    const bytes = Buffer.from(match[2], 'base64');
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES || bytes.toString('base64') !== match[2]) throw imageError('Invalid image data or image larger than 2 MB');
    try {
        const options = { limitInputPixels: 16000000, failOn: 'warning' };
        const metadata = await sharp(bytes, options).metadata();
        if (metadata.format !== match[1] || (metadata.pages || 1) !== 1) throw new Error('Unsupported format');
        return await sharp(bytes, options).rotate()
            .resize({ width: 1600, height: 1000, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 }).toBuffer();
    } catch {
        throw imageError('Image could not be decoded. Use a valid, non-animated JPEG, PNG or WebP image under 16 megapixels');
    }
}
module.exports = { decodeEventImage };

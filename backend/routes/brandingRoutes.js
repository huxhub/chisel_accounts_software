import { Router } from 'express';
import crypto from 'crypto';
import BrandSettings from '../models/BrandSettings.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', async (_req, res, next) => {
  try { res.json(await BrandSettings.findByPk(1)); } catch (error) { next(error); }
});
router.post('/logo', protect, async (req, res, next) => {
  try {
    const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = process.env;
    if (!cloud || !key || !secret) return res.status(503).json({ message: 'Cloudinary is not configured on the server' });
    const image = req.body.image;
    if (typeof image !== 'string' || image.length > 7 * 1024 * 1024 || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) {
      return res.status(400).json({ message: 'Choose a PNG, JPEG or WebP image under 5 MB' });
    }
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = 'golden-catch/logos';
    const signature = crypto.createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest('hex');
    const form = new FormData();
    form.append('file', image);
    form.append('folder', folder);
    form.append('timestamp', timestamp);
    form.append('api_key', key);
    form.append('signature', signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`, { method: 'POST', body: form });
    const result = await response.json();
    if (!response.ok || !result.secure_url) {
      console.error('Cloudinary upload failed:', result.error?.message || response.status);
      return res.status(502).json({ message: 'Logo upload failed. Check the server Cloudinary configuration.' });
    }
    res.json({ url: result.secure_url });
  } catch (error) { next(error); }
});
router.put('/', protect, async (req, res, next) => {
  try {
    const { companyName, companySubtitle, logoUrl, themeColor } = req.body;
    if (typeof companyName !== 'string' || !companyName.trim() || companyName.length > 100 ||
        typeof companySubtitle !== 'string' || companySubtitle.length > 100 ||
        typeof logoUrl !== 'string' || logoUrl.length > 2048 ||
        (logoUrl && !/^https:\/\/res\.cloudinary\.com\//.test(logoUrl)) ||
        typeof themeColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(themeColor)) {
      return res.status(400).json({ message: 'Invalid branding settings' });
    }
    await BrandSettings.upsert({ id: 1, companyName: companyName.trim(), companySubtitle, logoUrl, themeColor });
    res.json(await BrandSettings.findByPk(1));
  } catch (error) { next(error); }
});
export default router;

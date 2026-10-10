# Image uploads

The backend uploads image bytes directly to Cloudinary in the `nexora` folder. After a successful upload, it stores Cloudinary's HTTPS `secure_url` in the relevant PostgreSQL field (profile picture, post image, poster, cover, place photos, or restaurant menu images). The database stores the URL reference, not the image bytes.

Configure these environment variables for the backend:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

For local development, copy `backend/.env.example` to `backend/.env` and fill in the PostgreSQL password and Cloudinary credentials. Restart the backend after changing the file. All three Cloudinary values are required. If they are missing or Cloudinary rejects an upload, the request fails with an error; the backend does **not** fall back to writing files under `backend/uploads`. Keep the credentials in the ignored `backend/.env` file or a secret manager, never in source control.

Image URL columns use PostgreSQL `TEXT` so full Cloudinary URLs and lists of uploaded image URLs are not truncated. The frontend uses HTTPS URLs directly. Existing database records that contain old local filenames remain readable through the legacy `/api/v1/uploads/` resource route; new uploads never use that route.

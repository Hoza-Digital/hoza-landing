# Article image library

Article cover images are stored as WebP files in `yymmdd/slug.webp` folders and served publicly at `/image/yymmdd/slug`.

By default, the application uses this directory. Set `ARTICLE_IMAGE_LIBRARY_DIR` to an absolute path when the production server uses a persistent mounted volume.

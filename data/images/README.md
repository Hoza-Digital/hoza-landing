# Article image library

Article images use `yymmdd/slug.webp` object paths in the private `article-images` Supabase Storage bucket and remain publicly addressable through `/image/yymmdd/slug`.

The WebP files committed here are seed assets. Production uploads are stored persistently in Supabase rather than in a serverless function filesystem.

class ImageUtils {
  static String getFullUrl(String? path, {String bucket = 'gig_images'}) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    
    // Build Supabase public URL
    // Format: https://{project_ref}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const baseUrl = 'https://llrmbyafcffporpjtbka.supabase.co';
    return '$baseUrl/storage/v1/object/public/$bucket/$path';
  }

  static String getThumbnailUrl(String url, {int width = 300, int height = 300}) {
    // Note: Image transformation is a paid Supabase feature.
    // If you have it enabled, uncomment the block below.
    // For now, we'll return the original URL but CachedNetworkImage handles the resizing in memory.
    
    /*
    if (url.contains('supabase.co') && url.contains('/public/')) {
      if (url.contains('?')) {
        return '$url&width=$width&height=$height&resize=cover';
      } else {
        final transformedUrl = url.replaceFirst('/storage/v1/object/public/', '/storage/v1/render/image/public/');
        return '$transformedUrl?width=$width&height=$height&resize=cover';
      }
    }
    */
    return url;
  }
}

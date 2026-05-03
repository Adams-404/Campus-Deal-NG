import 'package:supabase_flutter/supabase_flutter.dart';
import '../../domain/models/product.dart';

class ProductRepository {
  final SupabaseClient _supabase;

  ProductRepository(this._supabase);

  Future<List<Product>> getProducts() async {
    final response = await _supabase
        .from('items')
        .select('*, seller:profiles(id, first_name, last_name, avatar_url), item_images(image_url)')
        .eq('status', 'active')
        .order('created_at', ascending: false)
        .limit(20);

    final List<dynamic> data = response as List<dynamic>;
    
    return data.map((json) {
      // Map item_images to images list
      final List<dynamic> imagesData = json['item_images'] ?? [];
      final List<String> images = imagesData
          .map((img) => img['image_url'] as String)
          .toList();
      
      // If no images found in item_images, check if there's an images field (for backward compatibility if any)
      if (images.isEmpty && json['images'] != null) {
        images.addAll(List<String>.from(json['images']));
      }

      return Product.fromJson({
        ...json,
        'images': images,
      });
    }).toList();
  }
}

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/auth_provider.dart';
import '../../data/repositories/product_repository.dart';
import '../../domain/models/product.dart';

final productRepositoryProvider = Provider<ProductRepository>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  return ProductRepository(supabase);
});

final productsProvider = FutureProvider<List<Product>>((ref) async {
  final repository = ref.watch(productRepositoryProvider);
  return repository.getProducts();
});

final groupedProductsProvider = FutureProvider<Map<String, List<Product>>>((ref) async {
  final products = await ref.watch(productsProvider.future);
  
  final Map<String, List<Product>> groups = {};
  for (final product in products) {
    if (!groups.containsKey(product.category)) {
      groups[product.category] = [];
    }
    groups[product.category]!.add(product);
  }
  
  return groups;
});

final featuredProductsProvider = FutureProvider<List<Product>>((ref) async {
  final products = await ref.watch(productsProvider.future);
  // Simple heuristic for featured products: the first 5 products for now
  // In a real app, you might have a 'featured' column in the database
  return products.take(5).toList();
});

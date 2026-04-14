import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/auth_provider.dart';
import '../../data/repositories/saved_items_repository.dart';

final savedItemsRepositoryProvider = Provider<SavedItemsRepository>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  return SavedItemsRepository(supabase);
});

final savedItemsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(savedItemsRepositoryProvider);
  return repo.getSavedItems();
});

final isItemSavedProvider =
    FutureProvider.family<bool, String>((ref, itemId) async {
  final repo = ref.watch(savedItemsRepositoryProvider);
  return repo.isItemSaved(itemId);
});

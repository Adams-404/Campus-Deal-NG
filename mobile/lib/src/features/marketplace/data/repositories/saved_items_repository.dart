import 'package:supabase_flutter/supabase_flutter.dart';

class SavedItemsRepository {
  final SupabaseClient _supabase;

  SavedItemsRepository(this._supabase);

  Future<List<Map<String, dynamic>>> getSavedItems() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return [];

    final savedResponse = await _supabase
        .from('saved_items')
        .select('id, item_id, user_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', ascending: false);

    final List<dynamic> savedData = savedResponse as List<dynamic>;
    if (savedData.isEmpty) return [];

    final itemIds = savedData.map((s) => s['item_id'] as String).toList();

    final itemsResponse = await _supabase
        .from('items')
        .select(
            '*, seller:profiles(id, first_name, last_name, avatar_url), item_images(image_url)')
        .inFilter('id', itemIds)
        .eq('status', 'active');

    final List<dynamic> itemsData = itemsResponse as List<dynamic>;

    final Map<String, Map<String, dynamic>> itemsMap = {};
    for (final item in itemsData) {
      final List<dynamic> imagesData = item['item_images'] ?? [];
      final List<String> images =
          imagesData.map((img) => img['image_url'] as String).toList();
      itemsMap[item['id'] as String] = {...item, 'images': images};
    }

    final result = <Map<String, dynamic>>[];
    for (final saved in savedData) {
      final itemData = itemsMap[saved['item_id'] as String];
      if (itemData != null) {
        result.add({
          'savedId': saved['id'],
          'item': itemData,
        });
      }
    }
    return result;
  }

  Future<bool> isItemSaved(String itemId) async {
    final user = _supabase.auth.currentUser;
    if (user == null) return false;

    final response = await _supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .maybeSingle();

    return response != null;
  }

  Future<void> saveItem(String itemId) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Not authenticated');
    await _supabase.from('saved_items').insert({
      'user_id': user.id,
      'item_id': itemId,
    });
  }

  Future<void> unsaveItem(String itemId) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Not authenticated');
    await _supabase
        .from('saved_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', itemId);
  }

  Future<void> removeSavedItemById(String savedId) async {
    await _supabase.from('saved_items').delete().eq('id', savedId);
  }
}

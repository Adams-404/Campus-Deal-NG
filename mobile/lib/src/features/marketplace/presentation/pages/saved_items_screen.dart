import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/utils/image_utils.dart';
import '../providers/saved_items_provider.dart';
import 'package:campus_deal_mobile/src/core/widgets/glass_search_bar.dart';
import 'item_detail_screen.dart';

import '../../../../core/widgets/glass_skeleton.dart';

class SavedItemsScreen extends ConsumerStatefulWidget {
  const SavedItemsScreen({super.key});

  @override
  ConsumerState<SavedItemsScreen> createState() => _SavedItemsScreenState();
}

class _SavedItemsScreenState extends ConsumerState<SavedItemsScreen> {
  final _searchController = TextEditingController();
  String _search = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _removeItem(String savedId) async {
    try {
      final repo = ref.read(savedItemsRepositoryProvider);
      await repo.removeSavedItemById(savedId);
      ref.invalidate(savedItemsProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  void _confirmRemove(String savedId) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Remove Item',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text(
          'Remove this item from your saved list?',
          style: TextStyle(color: Colors.grey),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _removeItem(savedId);
            },
            child: const Text('Remove',
                style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final savedAsync = ref.watch(savedItemsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            backgroundColor: Colors.transparent,
            elevation: 0,
            flexibleSpace: const SizedBox.shrink(),
            title: GlassSearchBar(
              controller: _searchController,
              hintText: 'Search saved items...',
              onChanged: (v) => setState(() => _search = v),
              onClear: () => setState(() => _search = ''),
            ),
          ),
          savedAsync.when(
            loading: () => SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.72,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) => const GlassShimmer(
                    child: GlassSkeletonCard(),
                  ),
                  childCount: 6,
                ),
              ),
            ),
            error: (err, _) => SliverFillRemaining(
              child: _buildEmptyState(isError: true, errorMsg: err.toString()),
            ),
            data: (items) {
              final filtered = _search.isEmpty
                  ? items
                  : items.where((entry) {
                      final item = entry['item'] as Map<String, dynamic>;
                      final title = item['title'] as String? ?? '';
                      return title.toLowerCase().contains(_search.toLowerCase());
                    }).toList();

              if (filtered.isEmpty) {
                return SliverFillRemaining(
                    child: _buildEmptyState(
                        isSearch: _search.isNotEmpty,
                        errorMsg: _search.isNotEmpty
                            ? 'No items match your search'
                            : null));
              }

              return SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverGrid(
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.72,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final entry = filtered[index];
                      final savedId = entry['savedId'] as String;
                      final itemData =
                          entry['item'] as Map<String, dynamic>;
                      return _buildSavedCard(
                        savedId: savedId,
                        itemData: itemData,
                      );
                    },
                    childCount: items.length,
                  ),
                ),
              );
            },
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }

  Widget _buildSavedCard({
    required String savedId,
    required Map<String, dynamic> itemData,
  }) {
    final images = (itemData['images'] as List<dynamic>? ?? [])
        .map((e) => e.toString())
        .toList();
    final title = itemData['title'] as String? ?? '';
    final price = (itemData['price'] as num?)?.toDouble() ?? 0;
    final itemId = itemData['id'] as String? ?? '';
    final sellerData = itemData['seller'];
    final sellerName = sellerData != null
        ? (sellerData['first_name'] as String? ?? 'Seller')
        : 'Seller';

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ItemDetailScreen(itemId: itemId),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF171717),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.06)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Expanded(
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(16)),
                    child: images.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: ImageUtils.getThumbnailUrl(images.first, width: 300, height: 300),
                            width: double.infinity,
                            height: double.infinity,
                            fit: BoxFit.cover,
                            memCacheWidth: 400,
                            memCacheHeight: 400,
                            placeholder: (_, __) => Container(
                                color: const Color(0xFF222222)),
                            errorWidget: (_, __, ___) =>
                                Container(color: const Color(0xFF222222)),
                          )
                        : Container(
                            color: const Color(0xFF222222),
                            child: const Icon(Icons.image_not_supported,
                                color: Colors.grey),
                          ),
                  ),
                  // Remove button
                  Positioned(
                    top: 8,
                    right: 8,
                    child: GestureDetector(
                      onTap: () => _confirmRemove(savedId),
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.85),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.favorite,
                            color: Colors.white, size: 14),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Details
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₦${NumberFormat('#,##0').format(price)}',
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'by $sellerName',
                    style: TextStyle(color: Colors.grey[500], fontSize: 11),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState({bool isError = false, bool isSearch = false, String? errorMsg}) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFF171717),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withOpacity(0.06)),
              ),
              child: Icon(
                isError ? Icons.error_outline : (isSearch ? Icons.search_off : Icons.favorite_border),
                color: isError ? Colors.red : Colors.grey,
                size: 36,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              isError
                  ? 'Something went wrong'
                  : (isSearch ? 'No items found' : 'No saved items yet'),
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              isError
                  ? (errorMsg ?? 'Please try again')
                  : (isSearch
                      ? (errorMsg ?? 'Try a different search term')
                      : 'Tap the heart on any listing to save it here'),
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[500], fontSize: 14),
            ),
            if (isError) ...[
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => ref.invalidate(savedItemsProvider),
                style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.white),
                child: const Text('Try Again'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

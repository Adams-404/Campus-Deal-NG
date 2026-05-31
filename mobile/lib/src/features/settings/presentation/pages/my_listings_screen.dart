import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../../auth/auth_provider.dart';
import '../../../../core/widgets/glass_app_bar.dart';
import '../../../../core/widgets/glass_skeleton.dart';
import '../../../../core/theme/app_theme.dart';

class MyListingsScreen extends ConsumerStatefulWidget {
  const MyListingsScreen({super.key});

  @override
  ConsumerState<MyListingsScreen> createState() => _MyListingsScreenState();
}

class _MyListingsScreenState extends ConsumerState<MyListingsScreen> {
  List<Map<String, dynamic>> _listings = [];
  bool _isLoading = true;
  String _filter = 'all'; // 'all', 'active', 'sold'

  @override
  void initState() {
    super.initState();
    _loadListings();
  }

  Future<void> _loadListings() async {
    setState(() => _isLoading = true);
    try {
      final supabase = ref.read(supabaseClientProvider);
      final user = supabase.auth.currentUser;
      if (user == null) {
        setState(() => _isLoading = false);
        return;
      }

      var query = supabase
          .from('items')
          .select('id, title, price, status, created_at, category, condition, item_images(image_url)')
          .eq('seller_id', user.id)
          .order('created_at', ascending: false);

      if (_filter == 'active') {
        query = supabase
            .from('items')
            .select('id, title, price, status, created_at, category, condition, item_images(image_url)')
            .eq('seller_id', user.id)
            .eq('status', 'active')
            .order('created_at', ascending: false);
      } else if (_filter == 'sold') {
        query = supabase
            .from('items')
            .select('id, title, price, status, created_at, category, condition, item_images(image_url)')
            .eq('seller_id', user.id)
            .eq('status', 'sold')
            .order('created_at', ascending: false);
      }

      final response = await query;

      setState(() {
        _listings = List<Map<String, dynamic>>.from(response ?? []);
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.customBackground,
      extendBodyBehindAppBar: true,
      appBar: const GlassAppBar(title: 'My Listings'),
      body: Column(
        children: [
          SizedBox(height: MediaQuery.of(context).padding.top + kToolbarHeight + 4),
          // Filter chips
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Row(
              children: [
                _buildFilterChip('All', 'all'),
                const SizedBox(width: 8),
                _buildFilterChip('Active', 'active'),
                const SizedBox(width: 8),
                _buildFilterChip('Sold', 'sold'),
              ],
            ),
          ),

          // Listings
          Expanded(
            child: _isLoading
                ? GlassShimmer(
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                      itemCount: 6,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) => Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: context.customSurface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: context.customBorder),
                        ),
                        child: Row(
                          children: [
                            const GlassSkeletonBlock(width: 80, height: 80, borderRadius: 10),
                            const SizedBox(width: 12),
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  GlassSkeletonBlock(height: 14, width: double.infinity),
                                  SizedBox(height: 6),
                                  GlassSkeletonBlock(height: 12, width: 80),
                                  SizedBox(height: 10),
                                  Row(
                                    children: [
                                      GlassSkeletonBlock(height: 18, width: 60, borderRadius: 6),
                                      SizedBox(width: 8),
                                      GlassSkeletonBlock(height: 12, width: 70),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                : _listings.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadListings,
                        color: const Color(0xFF3B82F6),
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                          itemCount: _listings.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final item = _listings[index];
                            return _buildListingCard(item);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isActive = _filter == value;
    return GestureDetector(
      onTap: () {
        setState(() => _filter = value);
        _loadListings();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive
              ? const Color(0xFF3B82F6)
              : context.customSurface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive
                ? const Color(0xFF3B82F6)
                : context.customBorder,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? Colors.white : context.customSecondaryText,
            fontSize: 13,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }

  Widget _buildListingCard(Map<String, dynamic> item) {
    final images = item['item_images'] as List?;
    final imageUrl =
        images != null && images.isNotEmpty ? images[0]['image_url'] as String? : null;
    final status = item['status'] as String? ?? 'active';
    final isSold = status == 'sold';

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: context.customSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.customBorder),
      ),
      child: Row(
        children: [
          // Image
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              width: 80,
              height: 80,
              child: imageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(
                          color: context.isDarkMode ? const Color(0xFF262626) : Colors.black.withOpacity(0.03)),
                    )
                  : Container(
                      color: context.isDarkMode ? const Color(0xFF262626) : Colors.black.withOpacity(0.03),
                      child: Icon(Icons.image, color: context.customSecondaryText)),
            ),
          ),
          const SizedBox(width: 12),
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item['title'] ?? '',
                  style: TextStyle(
                      color: context.customText,
                      fontSize: 14,
                      fontWeight: FontWeight.w500),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '₦${NumberFormat('#,##0').format(item['price'] ?? 0)}',
                  style: const TextStyle(
                      color: Color(0xFF3B82F6),
                      fontSize: 14,
                      fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: isSold
                            ? Colors.orange.withValues(alpha: 0.1)
                            : Colors.green.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        status[0].toUpperCase() + status.substring(1),
                        style: TextStyle(
                          color: isSold ? Colors.orange : Colors.green,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (item['category'] != null)
                      Text(
                        item['category'],
                        style: TextStyle(color: context.customSecondaryText, fontSize: 11),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.storefront, color: Colors.green, size: 40),
          ),
          const SizedBox(height: 16),
          Text(
            'No listings yet',
            style: TextStyle(
                color: context.customText,
                fontSize: 16,
                fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            'Your listed items will appear here',
            style: TextStyle(color: context.customSecondaryText, fontSize: 14),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/product_card.dart';
import '../widgets/category_section.dart';
import '../providers/product_provider.dart';
import 'package:campus_deal_mobile/src/features/marketplace/presentation/pages/item_detail_screen.dart';
import 'package:campus_deal_mobile/src/features/auth/profile_provider.dart';
import 'package:campus_deal_mobile/src/core/providers/app_mode_provider.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../../core/widgets/glass_search_bar.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final featuredProductsAsync = ref.watch(featuredProductsProvider);
    final groupedProductsAsync = ref.watch(groupedProductsProvider);
    
    return Scaffold(
      body: Scrollbar(
        child: CustomScrollView(
        slivers: [
          // App Bar with Search
          SliverAppBar(
            floating: true,
            pinned: true,
            backgroundColor: Colors.transparent,
            surfaceTintColor: Colors.transparent,
            scrolledUnderElevation: 0,
            elevation: 0,
            flexibleSpace: const SizedBox.shrink(),
            title: Row(
              children: [
                // Mode Switcher
                _buildModeSwitcher(),
                const SizedBox(width: 8),
                
                // Search Bar (Liquid Glass Pill)
                Expanded(
                  child: GlassSearchBar(
                    controller: _searchController,
                    onChanged: (v) => setState(() {}), // Refresh for the clear button
                  ),
                ),
                
                const SizedBox(width: 8),
                
                // Notification Bell
                _buildNotificationIcon(),
                
                const SizedBox(width: 8),
                
                // Profile Avatar
                _buildProfileAvatar(),
              ],
            ),
          ),

          // Featured Section
          featuredProductsAsync.when(
            data: (products) {
              if (products.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
              return SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Featured Items',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ProductCard(
                        title: products[0].title,
                        price: products[0].price,
                        imageUrl: products[0].images.isNotEmpty 
                            ? products[0].images.first 
                            : 'https://via.placeholder.com/800',
                        sellerName: products[0].seller?.firstName ?? products[0].seller?.fullName ?? 'Seller',
                        isFeatured: true,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ItemDetailScreen(itemId: products[0].id),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              );
            },
            loading: () => const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
            error: (err, stack) => SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text('Error: $err', style: const TextStyle(color: Colors.red)),
              ),
            ),
          ),

          // Categories Sections
          groupedProductsAsync.when(
            data: (groups) {
              return SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final category = groups.keys.elementAt(index);
                    final products = groups[category]!;
                    return CategorySection(
                      title: category,
                      items: products,
                    );
                  },
                  childCount: groups.length,
                ),
              );
            },
            loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
            error: (err, stack) => const SliverToBoxAdapter(child: SizedBox.shrink()),
          ),
          
          // Extra padding for bottom nav
          const SliverToBoxAdapter(
            child: SizedBox(height: 100),
          ),
        ],
      ),
    ),
  );
}
  Widget _buildModeSwitcher() {
    final mode = ref.watch(appModeProvider);
    final icon = mode == AppMode.gigs
        ? FontAwesomeIcons.briefcase
        : FontAwesomeIcons.bagShopping;

    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.08),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withOpacity(0.15), width: 1.0),
          ),
          child: IconButton(
            icon: FaIcon(icon, color: const Color(0xFF3B82F6), size: 16),
            onPressed: () {},
            padding: EdgeInsets.zero,
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationIcon() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.08),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withOpacity(0.15), width: 1.0),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              const Icon(Icons.notifications_none, color: Colors.white, size: 20),
              Positioned(
                top: 10,
                right: 10,
                child: Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: Color(0xFF3B82F6),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileAvatar() {
    final profileAsync = ref.watch(profileProvider);
    
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.08),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withOpacity(0.15), width: 1.0),
          ),
          child: profileAsync.when(
            data: (profile) {
              final avatarUrl = profile?['avatar_url'] as String?;
              final firstName = profile?['first_name'] as String? ?? '';
              final initial = firstName.isNotEmpty ? firstName[0].toUpperCase() : '?';
              
              return ClipOval(
                child: avatarUrl != null && avatarUrl.isNotEmpty
                    ? Image.network(avatarUrl, fit: BoxFit.cover)
                    : Center(
                        child: Text(
                          initial,
                          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                        ),
                      ),
              );
            },
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const Icon(Icons.account_circle, color: Colors.white, size: 24),
          ),
        ),
      ),
    );
  }
}

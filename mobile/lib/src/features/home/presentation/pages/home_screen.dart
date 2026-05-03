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
            elevation: 0,
            flexibleSpace: ClipRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        const Color(0xFF0A0A0A).withOpacity(0.85),
                        const Color(0xFF0A0A0A).withOpacity(0.4),
                        const Color(0xFF0A0A0A).withOpacity(0.1),
                        Colors.transparent,
                      ],
                      stops: const [0.0, 0.5, 0.8, 1.0],
                    ),
                  ),
                ),
              ),
            ),
            title: Row(
              children: [
                // Mode Switcher
                _buildModeSwitcher(),
                const SizedBox(width: 8),
                
                // Search Bar (Liquid Glass Pill)
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                      child: Container(
                        height: 46,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.04),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.12),
                            width: 0.8,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.2),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: TextField(
                          controller: _searchController,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          decoration: const InputDecoration(
                            hintText: 'Search items...',
                            hintStyle: TextStyle(
                              color: Colors.white60, 
                              fontSize: 13,
                              fontWeight: FontWeight.w300,
                            ),
                            prefixIcon: Icon(Icons.search, color: Colors.white70, size: 18),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.only(top: 10),
                          ),
                        ),
                      ),
                    ),
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
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: const Color(0xFF3B82F6).withOpacity(0.12),
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.25)),
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
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.06),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withOpacity(0.1)),
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
                    color: Colors.red,
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
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.06),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withOpacity(0.1)),
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
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
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

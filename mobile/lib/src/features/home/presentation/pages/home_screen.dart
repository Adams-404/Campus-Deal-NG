import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/product_card.dart';
import '../widgets/category_section.dart';
import '../providers/product_provider.dart';
import '../../../marketplace/presentation/pages/item_detail_screen.dart';

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
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  color: const Color(0xFF0A0A0A).withOpacity(0.7),
                ),
              ),
            ),
            title: Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Container(
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFFFF).withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                ),
                child: TextField(
                  controller: _searchController,
                  decoration: const InputDecoration(
                    hintText: 'Search for items...',
                    hintStyle: TextStyle(color: Colors.grey),
                    prefixIcon: Icon(Icons.search, color: Colors.grey),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 10),
                  ),
                  style: const TextStyle(color: Colors.white),
                  onSubmitted: (value) {
                    // Implement Search
                  },
                ),
              ),
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
}

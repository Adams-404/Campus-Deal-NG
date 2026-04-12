import 'package:flutter/material.dart';
import '../../domain/models/product.dart';
import 'product_card.dart';

class CategorySection extends StatelessWidget {
  final String title;
  final List<Product> items;
  final VoidCallback? onSeeAllTap;

  const CategorySection({
    super.key,
    required this.title,
    required this.items,
    this.onSeeAllTap,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              TextButton(
                onPressed: onSeeAllTap,
                child: Row(
                  children: [
                    Text(
                      'See All',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.7),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward_ios,
                      size: 12,
                      color: Colors.white.withOpacity(0.7),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 220,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: items.length,
            separatorBuilder: (context, index) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final product = items[index];
              return ProductCard(
                title: product.title,
                price: product.price,
                imageUrl: product.images.isNotEmpty 
                    ? product.images.first 
                    : 'https://via.placeholder.com/300',
                sellerName: product.seller?.firstName ?? product.seller?.fullName ?? 'Seller',
              );
            },
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

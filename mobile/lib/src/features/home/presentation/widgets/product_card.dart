import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/utils/image_utils.dart';
import '../../../../core/theme/app_theme.dart';

class ProductCardData {
  final String title;
  final double price;
  final String imageUrl;
  final String sellerName;
  final bool isFeatured;

  ProductCardData({
    required this.title,
    required this.price,
    required this.imageUrl,
    required this.sellerName,
    this.isFeatured = false,
  });
}

class ProductCard extends StatelessWidget {
  final String title;
  final double price;
  final String imageUrl;
  final String sellerName;
  final bool isFeatured;
  final VoidCallback? onTap;

  const ProductCard({
    super.key,
    required this.title,
    required this.price,
    required this.imageUrl,
    required this.sellerName,
    this.isFeatured = false,
    this.onTap,
  });

  factory ProductCard.fromData(ProductCardData data, {VoidCallback? onTap}) {
    return ProductCard(
      title: data.title,
      price: data.price,
      imageUrl: data.imageUrl,
      sellerName: data.sellerName,
      isFeatured: data.isFeatured,
      onTap: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: isFeatured ? double.infinity : 160,
        decoration: BoxDecoration(
          color: const Color(0xFF171717),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Section
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  child: CachedNetworkImage(
                    imageUrl: ImageUtils.getThumbnailUrl(
                      imageUrl,
                      width: isFeatured ? 500 : 300,
                      height: isFeatured ? 400 : 250,
                    ),
                    height: isFeatured ? 200 : 120,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    memCacheWidth: isFeatured ? 600 : 400,
                    fadeInDuration: const Duration(milliseconds: 300),
                    placeholder: (context, url) => Shimmer.fromColors(
                      baseColor: AppTheme.shimmerBase,
                      highlightColor: AppTheme.shimmerHighlight,
                      child: Container(color: Colors.white),
                    ),
                    errorWidget: (context, url, error) => Container(
                      color: const Color(0xFF222222),
                      child: const Icon(Icons.broken_image, color: Colors.white24),
                    ),
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.5),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.favorite_border, color: Colors.white, size: 18),
                  ),
                ),
              ],
            ),
            
            // Content Section
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₦${price.toStringAsFixed(0)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 8,
                        backgroundColor: Colors.grey[800],
                        child: Text(
                          sellerName[0],
                          style: const TextStyle(fontSize: 8, color: Colors.white),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        sellerName,
                        style: TextStyle(
                          color: Colors.grey[400],
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:intl/intl.dart';
import '../../domain/models/gig_model.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/utils/image_utils.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/safe_image.dart';

class GigCard extends StatelessWidget {
  final Gig gig;
  final VoidCallback onTap;

  const GigCard({super.key, required this.gig, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final primaryColor = const Color(0xFF3B82F6);
    
    final imageUrl = gig.gigImages.isNotEmpty ? ImageUtils.getFullUrl(gig.gigImages.first.imageUrl) : null;
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              context.isDarkMode ? Colors.white.withOpacity(0.08) : Colors.white.withOpacity(0.85),
              context.isDarkMode ? Colors.white.withOpacity(0.03) : Colors.white.withOpacity(0.5),
            ],
          ),
          border: Border.all(
            color: context.isDarkMode ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.08),
            width: 1,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top header: Category badge and price
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: context.isDarkMode ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          gig.category,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: context.customSecondaryText,
                          ),
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '₦${NumberFormat.decimalPattern().format(gig.price)}',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: primaryColor,
                            ),
                          ),
                          Text(
                            'per service',
                            style: TextStyle(
                              fontSize: 10,
                              color: context.customSecondaryText.withOpacity(0.7),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // Title
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    gig.title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: context.customText,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                
                const SizedBox(height: 12),
                
                // Image (if any)
                if (imageUrl != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: SafeImage(
                        imageUrl: ImageUtils.getThumbnailUrl(
                          imageUrl,
                          width: 400,
                          height: 250,
                        ),
                        height: 160,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        memCacheWidth: 400,
                        fadeInDuration: const Duration(milliseconds: 300),
                        placeholder: (context, url) => Shimmer.fromColors(
                          baseColor: context.customShimmerBase,
                          highlightColor: context.customShimmerHighlight,
                          child: Container(
                            height: 160,
                            width: double.infinity,
                            color: Colors.white,
                          ),
                        ),
                        errorWidget: (context, url, error) => Container(
                          height: 160,
                          color: context.isDarkMode ? const Color(0xFF222222) : const Color(0xFFE2E8F0),
                          child: Center(
                            child: Icon(Icons.broken_image_outlined, color: context.customSecondaryText, size: 32),
                          ),
                        ),
                      ),
                    ),
                  ),

                const SizedBox(height: 12),

                // Description
                if (gig.description != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      gig.description!,
                      style: TextStyle(
                        fontSize: 13,
                        color: context.customText.withOpacity(0.75),
                        height: 1.4,
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),

                const SizedBox(height: 16),

                // Info row (Location, Duration, Rating)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      if (gig.location != null)
                        _buildInfoRow(context, FontAwesomeIcons.locationDot, gig.location!),
                      if (gig.duration != null)
                        _buildInfoRow(context, FontAwesomeIcons.clock, gig.duration!),
                      _buildRatingRow(context, gig.rating, gig.reviewsCount),
                    ],
                  ),
                ),

                const SizedBox(height: 16),
                Divider(color: context.customBorder, height: 1),
                
                // Bottom row: User info & Apply button
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: context.isDarkMode ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.05),
                            ),
                            child: ClipOval(
                              child: gig.profile?.avatarUrl != null
                                  ? SafeImage(
                                      imageUrl: ImageUtils.getFullUrl(
                                        gig.profile!.avatarUrl!,
                                        bucket: 'avatars',
                                      ),
                                      fit: BoxFit.cover,
                                      memCacheWidth: 80,
                                      memCacheHeight: 80,
                                      fadeInDuration: const Duration(milliseconds: 200),
                                      placeholder: (context, url) => Shimmer.fromColors(
                                        baseColor: context.customShimmerBase,
                                        highlightColor: context.customShimmerHighlight,
                                        child: Container(color: Colors.white),
                                      ),
                                      errorWidget: (context, url, error) => Center(
                                        child: Text(
                                          _getInitials(gig.profile?.firstName, gig.profile?.lastName),
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: context.customText,
                                          ),
                                        ),
                                      ),
                                    )
                                  : Center(
                                      child: Text(
                                        _getInitials(gig.profile?.firstName, gig.profile?.lastName),
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: context.customText,
                                        ),
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _getUserName(gig.profile?.firstName, gig.profile?.lastName),
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: context.customText,
                            ),
                          ),
                        ],
                      ),
                      
                      // Apply / Manage Button
                      _buildActionButton(context, primaryColor),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(BuildContext context, FaIconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          FaIcon(icon, size: 12, color: context.customSecondaryText),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(fontSize: 12, color: context.customSecondaryText),
          ),
        ],
      ),
    );
  }

  Widget _buildRatingRow(BuildContext context, num rating, int reviewCount) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          const FaIcon(FontAwesomeIcons.solidStar, size: 12, color: Colors.amber),
          const SizedBox(width: 8),
          Text(
            rating.toStringAsFixed(1),
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: context.customText),
          ),
          const SizedBox(width: 4),
          Text(
            '($reviewCount reviews)',
            style: TextStyle(fontSize: 12, color: context.customSecondaryText),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(BuildContext context, Color primaryColor) {
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    final isOwner = currentUserId != null && currentUserId == gig.userId;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isOwner 
            ? (context.isDarkMode ? Colors.white.withOpacity(0.12) : Colors.black.withOpacity(0.08)) 
            : (context.isDarkMode ? Colors.white : primaryColor),
        borderRadius: BorderRadius.circular(20),
        border: isOwner 
            ? Border.all(color: context.isDarkMode ? Colors.white.withOpacity(0.2) : Colors.black.withOpacity(0.1)) 
            : null,
      ),
      child: Row(
        children: [
          FaIcon(
            isOwner ? FontAwesomeIcons.sliders : FontAwesomeIcons.message,
            size: 12,
            color: isOwner 
                ? context.customText 
                : (context.isDarkMode ? primaryColor : Colors.white),
          ),
          const SizedBox(width: 6),
          Text(
            isOwner ? 'Manage' : 'Apply Now',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isOwner 
                  ? context.customText 
                  : (context.isDarkMode ? primaryColor : Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  String _getUserName(String? first, String? last) {
    if (first != null && last != null) return '$first $last';
    if (first != null) return first;
    return 'Anonymous';
  }

  String _getInitials(String? first, String? last) {
    String name = _getUserName(first, last);
    if (name == 'Anonymous') return 'A';
    final initials = name.split(' ').where((n) => n.isNotEmpty).map((n) => n[0]).join('').toUpperCase();
    return initials.length > 2 ? initials.substring(0, 2) : initials;
  }
}

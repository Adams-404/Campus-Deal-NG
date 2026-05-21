import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_theme.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../domain/models/gig_model.dart';
import '../providers/gigs_provider.dart';
import '../../../../core/widgets/glass_app_bar.dart';
import '../../../../core/utils/image_utils.dart';
import '../../../../core/widgets/safe_image.dart';
import '../../../marketplace/presentation/pages/item_detail_screen.dart';
import '../../../../core/widgets/glass_skeleton.dart';

class GigDetailScreen extends ConsumerStatefulWidget {
  final Gig gig;

  const GigDetailScreen({super.key, required this.gig});

  @override
  ConsumerState<GigDetailScreen> createState() => _GigDetailScreenState();
}

class _GigDetailScreenState extends ConsumerState<GigDetailScreen> {
  bool _isApplying = false;

  void _handleApply() async {
    // Show a bottom sheet or dialog to type application message
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => _ApplicationSheet(gig: widget.gig),
    );
  }

  void _handleDelete(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E1E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Delete Gig?',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: const Text(
          'Are you sure you want to delete this gig listing? This action cannot be undone.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isApplying = true);
      try {
        await ref.read(gigsNotifierProvider.notifier).deleteGig(widget.gig.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Gig deleted successfully')),
          );
          Navigator.pop(context); // Go back to browse/my gigs
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Failed to delete gig: $e')));
        }
      } finally {
        if (mounted) setState(() => _isApplying = false);
      }
    }
  }

  void _handleEdit(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Editing feature coming soon')),
    );
  }

  void _showFullScreenImages(int initialIndex) {
    final images = widget.gig.gigImages
        .map((img) => ImageUtils.getFullUrl(img.imageUrl))
        .toList();
    if (images.isEmpty) return;

    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierColor: Colors.black.withOpacity(0.9),
        pageBuilder: (context, _, __) {
          return FullScreenImageViewer(
            images: images,
            initialIndex: initialIndex,
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = const Color(0xFF3B82F6);
    final imageUrl = widget.gig.gigImages.isNotEmpty
        ? ImageUtils.getFullUrl(widget.gig.gigImages.first.imageUrl)
        : null;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.transparent,
        leadingWidth: 70,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16.0),
          child: Center(
            child: _buildHeaderCircleButton(
              icon: Icons.arrow_back_ios_new,
              onTap: () => Navigator.pop(context),
            ),
          ),
        ),
        title: null,
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image Header
                if (imageUrl != null)
                  SizedBox(
                    height: 300,
                    width: double.infinity,
                    child: Stack(
                      children: [
                        GestureDetector(
                          onTap: () => _showFullScreenImages(0),
                          behavior: HitTestBehavior.opaque,
                          child: SizedBox(
                            height: 300,
                            width: double.infinity,
                            child: SafeImage(
                              imageUrl: imageUrl,
                              fit: BoxFit.cover,
                              memCacheWidth: 800,
                              fadeInDuration: const Duration(milliseconds: 300),
                              placeholder: (context, url) => Shimmer.fromColors(
                                baseColor: AppTheme.shimmerBase,
                                highlightColor: AppTheme.shimmerHighlight,
                                child: Container(
                                  color: Colors.white,
                                  width: double.infinity,
                                  height: 300,
                                ),
                              ),
                              errorWidget: (context, url, error) => Container(
                                color: const Color(0xFF222222),
                                child: const Center(
                                  child: Icon(Icons.broken_image_outlined, color: Colors.white24, size: 48),
                                ),
                              ),
                            ),
                          ),
                        ),
                        // Top gradient for status bar readability
                        Positioned(
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 120,
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.black.withOpacity(0.65),
                                  Colors.black.withOpacity(0.0),
                                ],
                              ),
                            ),
                          ),
                        ),
                        // Bottom gradient for content transition
                        Positioned(
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 80,
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.bottomCenter,
                                end: Alignment.topCenter,
                                colors: [
                                  const Color(0xFF0F0F13),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  const SizedBox(height: kToolbarHeight + 40),

                Padding(
                  padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Row: Category & Price
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: primaryColor.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: primaryColor.withOpacity(0.5),
                          ),
                        ),
                        child: Text(
                          widget.gig.category,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: primaryColor,
                          ),
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '₦${NumberFormat.decimalPattern().format(widget.gig.price)}',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: primaryColor,
                            ),
                          ),
                          Text(
                            'per service',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.white.withOpacity(0.5),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Title
                  Text(
                    widget.gig.title,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Info Cards
                  Row(
                    children: [
                      if (widget.gig.location != null)
                        Expanded(
                          child: _buildInfoCard(
                            FontAwesomeIcons.locationDot,
                            'Location',
                            widget.gig.location!,
                          ),
                        ),
                      if (widget.gig.location != null &&
                          widget.gig.duration != null)
                        const SizedBox(width: 12),
                      if (widget.gig.duration != null)
                        Expanded(
                          child: _buildInfoCard(
                            FontAwesomeIcons.clock,
                            'Duration',
                            widget.gig.duration!,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Description
                  const Text(
                    'About this gig',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    widget.gig.description ?? 'No description provided.',
                    style: TextStyle(
                      fontSize: 15,
                      color: Colors.white.withOpacity(0.7),
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Tags
                  if (widget.gig.tags.isNotEmpty) ...[
                    const Text(
                      'Skills / Tags',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: widget.gig.tags.map((tag) {
                        return Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.1),
                            ),
                          ),
                          child: Text(
                            tag,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withOpacity(0.8),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  Divider(color: Colors.white.withOpacity(0.1)),
                  const SizedBox(height: 16),

                  // Provider
                  const Text(
                    'Gig Provider',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.1),
                        ),
                        child: ClipOval(
                          child: widget.gig.profile?.avatarUrl != null
                              ? SafeImage(
                                  imageUrl: ImageUtils.getFullUrl(
                                    widget.gig.profile!.avatarUrl!,
                                    bucket: 'avatars',
                                  ),
                                  fit: BoxFit.cover,
                                  memCacheWidth: 120,
                                  memCacheHeight: 120,
                                  fadeInDuration: const Duration(milliseconds: 200),
                                  placeholder: (context, url) => Shimmer.fromColors(
                                    baseColor: AppTheme.shimmerBase,
                                    highlightColor: AppTheme.shimmerHighlight,
                                    child: Container(color: Colors.white),
                                  ),
                                  errorWidget: (context, url, error) => Center(
                                    child: Text(
                                      _getInitials(
                                        widget.gig.profile?.firstName,
                                        widget.gig.profile?.lastName,
                                      ),
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                )
                              : Center(
                                  child: Text(
                                    _getInitials(
                                      widget.gig.profile?.firstName,
                                      widget.gig.profile?.lastName,
                                    ),
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _getUserName(
                                widget.gig.profile?.firstName,
                                widget.gig.profile?.lastName,
                              ),
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const FaIcon(
                                  FontAwesomeIcons.solidStar,
                                  size: 12,
                                  color: Colors.amber,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  widget.gig.rating.toStringAsFixed(1),
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '(${widget.gig.reviewsCount} reviews)',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.white.withOpacity(0.5),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () {},
                        icon: FaIcon(
                          FontAwesomeIcons.comment,
                          color: primaryColor,
                          size: 20,
                        ),
                        style: IconButton.styleFrom(
                          backgroundColor: primaryColor.withOpacity(0.1),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 120), // padding for bottom bar hover spacing
                ],
              ),
            ),
          ],
        ),
      ),
      _buildBottomActionBar(context, primaryColor),
    ],
  ),
);
  }

  Widget _buildHeaderCircleButton({
    required IconData icon,
    Color? iconColor,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.5),
          shape: BoxShape.circle,
        ),
        padding: const EdgeInsets.all(8),
        child: Icon(icon, color: iconColor ?? Colors.white, size: 18),
      ),
    );
  }

  Widget _buildBottomActionBar(BuildContext context, Color primaryColor) {
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    final isOwner = currentUserId != null && currentUserId == widget.gig.userId;

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: ShaderMask(
        shaderCallback: (rect) {
          return const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.transparent,
              Colors.black,
              Colors.black,
            ],
            stops: [0.0, 0.4, 1.0],
          ).createShader(rect);
        },
        blendMode: BlendMode.dstIn,
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
            child: Container(
              padding: EdgeInsets.fromLTRB(
                20,
                48,
                20,
                MediaQuery.of(context).padding.bottom > 0
                    ? MediaQuery.of(context).padding.bottom + 16
                    : 32,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.0),
                    Colors.black.withOpacity(0.85),
                    Colors.black.withOpacity(0.95),
                  ],
                  stops: const [0.0, 0.4, 1.0],
                ),
              ),
              child: SafeArea(
                top: false,
                child: isOwner
                    ? Row(
                        children: [
                          // Delete Button (Liquid Glass Red)
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(18),
                              child: BackdropFilter(
                                filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                                child: Container(
                                  height: 48,
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                      colors: [
                                        Colors.red.withValues(alpha: 0.35),
                                        Colors.red.withValues(alpha: 0.12),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(18),
                                    border: Border.all(
                                      color: Colors.red.withValues(alpha: 0.55),
                                      width: 1.5,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.red.withValues(alpha: 0.30),
                                        blurRadius: 16,
                                        spreadRadius: 1,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Material(
                                    color: Colors.transparent,
                                    child: InkWell(
                                      onTap: _isApplying ? null : () => _handleDelete(context),
                                      borderRadius: BorderRadius.circular(18),
                                      child: const Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          FaIcon(
                                            FontAwesomeIcons.trashCan,
                                            size: 14,
                                            color: Colors.white,
                                          ),
                                          SizedBox(width: 8),
                                          Text(
                                            'Delete',
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white,
                                              letterSpacing: 0.3,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Edit Button (Liquid Glass White/Silver)
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(18),
                              child: BackdropFilter(
                                filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                                child: Container(
                                  height: 48,
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                      colors: [
                                        Colors.white.withOpacity(0.22),
                                        Colors.white.withOpacity(0.06),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(18),
                                    border: Border.all(
                                      color: Colors.white.withOpacity(0.30),
                                      width: 1.5,
                                    ),
                                  ),
                                  child: Material(
                                    color: Colors.transparent,
                                    child: InkWell(
                                      onTap: () => _handleEdit(context),
                                      borderRadius: BorderRadius.circular(18),
                                      child: const Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          FaIcon(
                                            FontAwesomeIcons.penToSquare,
                                            size: 14,
                                            color: Colors.white,
                                          ),
                                          SizedBox(width: 8),
                                          Text(
                                            'Edit Gig',
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white,
                                              letterSpacing: 0.3,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      )
                    : SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(18),
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                            child: Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(18),
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    primaryColor.withOpacity(0.25),
                                    primaryColor.withOpacity(0.08),
                                  ],
                                ),
                                border: Border.all(
                                  color: primaryColor.withOpacity(0.45),
                                  width: 1.5,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: primaryColor.withOpacity(0.25),
                                    blurRadius: 16,
                                    spreadRadius: 1,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  onTap: _isApplying ? null : _handleApply,
                                  borderRadius: BorderRadius.circular(18),
                                  child: Center(
                                    child: _isApplying
                                        ? const GlassShimmer(
                                            child: Text(
                                              'Applying...',
                                              style: TextStyle(
                                                fontSize: 15,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.white,
                                              ),
                                            ),
                                          )
                                        : const Text(
                                            'Apply Now',
                                            style: TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white,
                                            ),
                                          ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard(FaIconData icon, String title, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: FaIcon(icon, size: 14, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.white.withOpacity(0.5),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
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

class _ApplicationSheet extends StatefulWidget {
  final Gig gig;

  const _ApplicationSheet({required this.gig});

  @override
  State<_ApplicationSheet> createState() => _ApplicationSheetState();
}

class _ApplicationSheetState extends State<_ApplicationSheet> {
  final _messageController = TextEditingController();

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + bottomPadding),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Apply for this Gig',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Write a short message to the gig provider explaining why you are a good fit.',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _messageController,
            maxLines: 4,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'I am interested in working on: ${widget.gig.title}',
              hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
              filled: true,
              fillColor: Colors.white.withOpacity(0.05),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: Color(0xFF3B82F6)),
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Application submitted successfully!'),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3B82F6),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text(
                'Send Application',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../../home/domain/models/product.dart';
import '../../../auth/auth_provider.dart';
import '../providers/saved_items_provider.dart';
import '../../../../core/utils/image_utils.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../messages/domain/models/chat_models.dart';
import '../../../messages/presentation/pages/chat_screen.dart';
import '../../../../core/widgets/glass_skeleton.dart';
import '../../../settings/presentation/pages/user_profile_screen.dart';

class ItemDetailScreen extends ConsumerStatefulWidget {
  final String itemId;

  const ItemDetailScreen({super.key, required this.itemId});

  @override
  ConsumerState<ItemDetailScreen> createState() => _ItemDetailScreenState();
}

class _ItemDetailScreenState extends ConsumerState<ItemDetailScreen> {
  Product? _product;
  bool _isLoading = true;
  bool _isSaved = false;
  bool _isSaving = false;
  bool _isOwner = false;
  int _currentImageIndex = 0;
  final PageController _pageController = PageController();

  @override
  void initState() {
    super.initState();
    _loadItem();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _loadItem() async {
    try {
      final supabase = ref.read(supabaseClientProvider);
      final response = await supabase
          .from('items')
          .select(
              '*, seller:profiles(id, first_name, last_name, avatar_url), item_images(image_url)')
          .eq('id', widget.itemId)
          .single();

      final List<dynamic> imagesData = response['item_images'] ?? [];
      final List<String> images =
          imagesData.map((img) => img['image_url'] as String).toList();

      final product = Product.fromJson({...response, 'images': images});
      final repo = ref.read(savedItemsRepositoryProvider);
      final isSaved = await repo.isItemSaved(widget.itemId);
      final currentUser = supabase.auth.currentUser;
      final isOwner =
          currentUser != null && currentUser.id == response['seller_id'];

      if (mounted) {
        setState(() {
          _product = product;
          _isSaved = isSaved;
          _isOwner = isOwner;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading item: $e')),
        );
      }
    }
  }

  Future<void> _toggleSave() async {
    final user = ref.read(supabaseClientProvider).auth.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sign in to save items')),
      );
      return;
    }
    setState(() => _isSaving = true);
    try {
      final repo = ref.read(savedItemsRepositoryProvider);
      if (_isSaved) {
        await repo.unsaveItem(widget.itemId);
        setState(() => _isSaved = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Removed from saved items')),
          );
        }
      } else {
        await repo.saveItem(widget.itemId);
        setState(() => _isSaved = true);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Item saved!')),
          );
        }
      }
      // Invalidate the savedItems cache so the Saved tab refreshes
      ref.invalidate(savedItemsProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _messageSeller() async {
    if (_product == null) return;
    final supabase = ref.read(supabaseClientProvider);
    final user = supabase.auth.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sign in to message the seller')),
      );
      return;
    }
    if (_isOwner) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("You can't message yourself")),
      );
      return;
    }

    try {
      // Create or find existing conversation symmetrically where gig_id is null
      final existingConversation = await supabase
          .from('conversations')
          .select('id')
          .or('and(buyer_id.eq.${user.id},seller_id.eq.${_product!.sellerId}),and(buyer_id.eq.${_product!.sellerId},seller_id.eq.${user.id})')
          .isFilter('gig_id', null)
          .limit(1)
          .maybeSingle();

      String conversationId;
      if (existingConversation != null) {
        conversationId = existingConversation['id'] as String;
      } else {
        final newConversation = await supabase
            .from('conversations')
            .insert({
              'buyer_id': user.id,
              'seller_id': _product!.sellerId,
              'last_message': 'Interested in ${_product!.title}',
              'last_message_at': DateTime.now().toIso8601String(),
            })
            .select('id')
            .single();
        conversationId = newConversation['id'] as String;

        await supabase.from('messages').insert({
          'conversation_id': conversationId,
          'content': "Hi, I'm interested in ${_product!.title}",
          'sender_id': user.id,
          'item_id': _product!.id,
          'created_at': DateTime.now().toIso8601String(),
        });
      }

      if (mounted) {
        final conv = Conversation(
          id: conversationId,
          buyerId: user.id,
          sellerId: _product!.sellerId ?? '',
          lastMessage: "Hi, I'm interested in ${_product!.title}",
          lastMessageAt: DateTime.now(),
          otherUser: ConvProfile(
            id: _product!.sellerId ?? '',
            firstName: _product!.seller?.firstName,
            lastName: _product!.seller?.lastName,
            avatarUrl: _product!.seller?.avatarUrl,
          ),
          itemTitle: _product!.title,
          itemPrice: _product!.price,
        );
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ChatScreen(
              conversation: conv,
              currentUserId: user.id,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  void _showFullScreenImages(int initialIndex) {
    if (_product == null) return;
    
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierColor: Colors.black.withOpacity(0.9),
        pageBuilder: (context, _, __) {
          return FullScreenImageViewer(
            images: _product!.images,
            initialIndex: initialIndex,
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: context.customBackground,
        body: const SafeArea(
          child: GlassShimmer(
            child: GlassSkeletonDetails(),
          ),
        ),
      );
    }

    if (_product == null) {
      return Scaffold(
        backgroundColor: context.customBackground,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Item not found',
                  style: TextStyle(color: context.customText)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
      );
    }

    final product = _product!;
    final sellerName =
        product.seller?.firstName ?? product.seller?.fullName ?? 'Seller';

    return Scaffold(
      backgroundColor: context.customBackground,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              // Image Gallery App Bar
              SliverAppBar(
                expandedHeight: 340,
                pinned: true,
                backgroundColor: Colors.transparent,
                elevation: 0,
                leading: _buildCircleButton(
                  icon: Icons.arrow_back_ios_new,
                  onTap: () => Navigator.pop(context),
                ),
                actions: [
                  _buildCircleButton(
                    icon: _isSaved ? Icons.favorite : Icons.favorite_border,
                    iconColor: _isSaved ? Colors.red : (context.isDarkMode ? Colors.white : Colors.black),
                    onTap: _isSaving ? null : _toggleSave,
                  ),
                  const SizedBox(width: 8),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    children: [
                      _buildImageGallery(product),
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
                                Colors.black.withOpacity(context.isDarkMode ? 0.6 : 0.2),
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
                                context.customBackground,
                                Colors.transparent,
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Content
              SliverToBoxAdapter(
                child: _buildContent(product, sellerName),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 120)),
            ],
          ),

          // Bottom Action Bar
          if (!_isOwner) _buildBottomActionBar(product),
        ],
      ),
    );
  }

  Widget _buildCircleButton({
    required IconData icon,
    Color? iconColor,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: context.isDarkMode ? Colors.black.withOpacity(0.5) : Colors.white.withOpacity(0.7),
          shape: BoxShape.circle,
          border: Border.all(color: context.customBorder.withOpacity(0.1)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Icon(icon, color: iconColor ?? context.customText, size: 20),
        ),
      ),
    );
  }

  Widget _buildImageGallery(Product product) {
    if (product.images.isEmpty) {
      return Container(
        color: const Color(0xFF171717),
        child: const Center(
          child: Icon(Icons.image_not_supported, color: Colors.grey, size: 64),
        ),
      );
    }

    return Stack(
      children: [
        GestureDetector(
          onTap: () => _showFullScreenImages(_currentImageIndex),
          behavior: HitTestBehavior.opaque,
          child: PageView.builder(
            controller: _pageController,
            itemCount: product.images.length,
            onPageChanged: (i) => setState(() => _currentImageIndex = i),
            itemBuilder: (context, index) {
              return CachedNetworkImage(
                imageUrl: ImageUtils.getThumbnailUrl(product.images[index], width: 800, height: 600),
                fit: BoxFit.cover,
                memCacheWidth: 1000,
                placeholder: (context, url) => Shimmer.fromColors(
                  baseColor: AppTheme.shimmerBase,
                  highlightColor: AppTheme.shimmerHighlight,
                  child: Container(color: Colors.white),
                ),
                errorWidget: (context, url, error) => Container(
                  color: const Color(0xFF171717),
                  child: const Icon(Icons.broken_image, color: Colors.grey),
                ),
              );
            },
          ),
        ),

        // Page dots
        if (product.images.length > 1)
          Positioned(
            bottom: 16,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                product.images.length,
                (index) => AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: _currentImageIndex == index ? 20 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: _currentImageIndex == index
                        ? Colors.white
                        : Colors.white.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
            ),
          ),

        // Image count badge
        if (product.images.length > 1)
          Positioned(
            top: 56,
            right: 16,
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${_currentImageIndex + 1}/${product.images.length}',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w500),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildContent(Product product, String sellerName) {
    final avatarLetter =
        sellerName.isNotEmpty ? sellerName[0].toUpperCase() : '?';

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title & Price
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  product.title,
                  style: TextStyle(
                    color: context.customText,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    height: 1.3,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                '₦${NumberFormat('#,##0').format(product.price)}',
                style: TextStyle(
                  color: context.customText,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Badges row
          Row(
            children: [
              if (product.condition != null) ...[
                _buildBadge(
                  label: product.condition!,
                  color: _conditionColor(product.condition!),
                ),
                const SizedBox(width: 8),
              ],
              _buildBadge(
                label: product.category,
                color: context.customSurface,
                textColor: context.customText,
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Divider
          Container(height: 1, color: context.customBorder),
          const SizedBox(height: 20),

          // Seller
          GestureDetector(
            onTap: () {
              if (product.sellerId != null) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => UserProfileScreen(userId: product.sellerId!),
                  ),
                );
              }
            },
            behavior: HitTestBehavior.opaque,
            child: Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: context.isDarkMode ? Colors.white.withOpacity(0.2) : Colors.black.withOpacity(0.05),
                  backgroundImage: product.seller?.avatarUrl != null &&
                          product.seller!.avatarUrl!.isNotEmpty
                      ? CachedNetworkImageProvider(
                          ImageUtils.getThumbnailUrl(product.seller!.avatarUrl!, width: 150, height: 150),
                        )
                      : null,
                  child: product.seller?.avatarUrl == null ||
                          product.seller!.avatarUrl!.isEmpty
                      ? Text(avatarLetter,
                          style: TextStyle(
                              color: context.customText,
                              fontWeight: FontWeight.bold))
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        sellerName,
                        style: TextStyle(
                            color: context.customText,
                            fontWeight: FontWeight.w600,
                            fontSize: 15),
                      ),
                      Text(
                        'Seller',
                        style: TextStyle(color: context.customSecondaryText, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                if (_isOwner)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: context.customSurface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: context.customBorder),
                    ),
                    child: Text(
                      'Your listing',
                      style: TextStyle(
                          color: context.customText,
                          fontSize: 12,
                          fontWeight: FontWeight.w500),
                    ),
                  ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          Container(height: 1, color: context.customBorder),
          const SizedBox(height: 20),

          // Description
          if (product.description != null &&
              product.description!.isNotEmpty) ...[
            Text(
              'Description',
              style: TextStyle(
                  color: context.customText,
                  fontSize: 16,
                  fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Text(
              product.description!,
              style: TextStyle(
                color: context.customSecondaryText,
                fontSize: 14,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 24),
          ],

          // Details grid
          _buildDetailsGrid(product),
        ],
      ),
    );
  }

  Widget _buildDetailsGrid(Product product) {
    final details = <Map<String, String>>[
      {'label': 'Category', 'value': product.category},
      if (product.condition != null)
        {'label': 'Condition', 'value': product.condition!},
      {
        'label': 'Posted',
        'value': _formatDate(product.createdAt),
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Details',
          style: TextStyle(
              color: context.customText, fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: context.customSurface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: context.customBorder),
          ),
          child: Column(
            children: details.asMap().entries.map((entry) {
              final isLast = entry.key == details.length - 1;
              return Column(
                children: [
                  Padding(
                     padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(entry.value['label']!,
                            style: TextStyle(
                                color: context.customSecondaryText, fontSize: 13)),
                        Text(entry.value['value']!,
                            style: TextStyle(
                                color: context.customText,
                                fontSize: 13,
                                fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                  if (!isLast)
                    Divider(
                        height: 1,
                        color: context.customBorder,
                        indent: 16,
                        endIndent: 16),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildBadge(
      {required String label, required Color color, Color? textColor}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor ?? Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildBottomActionBar(Product product) {
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
              padding: const EdgeInsets.fromLTRB(20, 48, 20, 32),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    context.customBackground.withOpacity(0.0),
                    context.customBackground.withOpacity(0.85),
                    context.customBackground.withOpacity(0.95),
                  ],
                  stops: const [0.0, 0.4, 1.0],
                ),
              ),
              child: SafeArea(
                top: false,
                child: Row(
                  children: [
                    // Save button (Liquid Glass)
                    GestureDetector(
                      onTap: _isSaving ? null : _toggleSave,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: _isSaved
                                  ? Colors.red.withOpacity(0.2)
                                  : context.customSurface,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: _isSaved
                                    ? Colors.red.withOpacity(0.6)
                                    : context.customBorder,
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: context.customBorder.withOpacity(0.05),
                                  blurRadius: 10,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                            child: _isSaving
                                ? GlassPulseIcon(
                                    icon: _isSaved ? Icons.favorite : Icons.favorite_border,
                                    color: _isSaved ? Colors.red : context.customText,
                                    size: 22,
                                  )
                                : Icon(
                                    _isSaved
                                        ? Icons.favorite
                                        : Icons.favorite_border,
                                    color: _isSaved ? Colors.red : context.customText,
                                    size: 22,
                                  ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Message button (Liquid Glass)
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  context.isDarkMode ? Colors.white.withOpacity(0.25) : const Color(0xFF3B82F6).withOpacity(0.95),
                                  context.isDarkMode ? Colors.white.withOpacity(0.10) : const Color(0xFF1D4ED8).withOpacity(0.85),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: context.isDarkMode ? Colors.white.withOpacity(0.4) : const Color(0xFF3B82F6).withOpacity(0.5),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: context.isDarkMode ? Colors.white.withOpacity(0.1) : const Color(0xFF3B82F6).withOpacity(0.15),
                                  blurRadius: 15,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: _messageSeller,
                                borderRadius: BorderRadius.circular(20),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: const [
                                      Icon(Icons.chat_bubble_outline, size: 20, color: Colors.white),
                                      SizedBox(width: 10),
                                      Text(
                                        'Message Seller',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                          letterSpacing: 0.5,
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
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Color _conditionColor(String condition) {
    switch (condition.toLowerCase()) {
      case 'new':
        return Colors.green.withOpacity(0.2);
      case 'like new':
        return Colors.teal.withOpacity(0.2);
      case 'good':
        return Colors.blue.withOpacity(0.2);
      case 'fair':
        return Colors.orange.withOpacity(0.2);
      default:
        return Colors.grey.withOpacity(0.2);
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays} days ago';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()} weeks ago';
    if (diff.inDays < 365) return '${(diff.inDays / 30).floor()} months ago';
    return '${date.day}/${date.month}/${date.year}';
  }
}

class FullScreenImageViewer extends StatefulWidget {
  final List<String> images;
  final int initialIndex;

  const FullScreenImageViewer({
    super.key,
    required this.images,
    required this.initialIndex,
  });

  @override
  State<FullScreenImageViewer> createState() => _FullScreenImageViewerState();
}

class _FullScreenImageViewerState extends State<FullScreenImageViewer> {
  late PageController _pageController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Blurred background
          Positioned.fill(
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                child: Container(
                  color: Colors.black.withOpacity(0.85),
                ),
              ),
            ),
          ),

          // Images
          PageView.builder(
            controller: _pageController,
            itemCount: widget.images.length,
            onPageChanged: (index) => setState(() => _currentIndex = index),
            itemBuilder: (context, index) {
              return InteractiveViewer(
                minScale: 0.5,
                maxScale: 4.0,
                child: Center(
                  child: CachedNetworkImage(
                    imageUrl: widget.images[index],
                    fit: BoxFit.contain,
                    placeholder: (context, url) => const GlassShimmer(
                      child: GlassSkeletonBlock(
                        height: double.infinity,
                        width: double.infinity,
                        borderRadius: 0,
                      ),
                    ),
                    errorWidget: (context, url, error) => const Icon(Icons.error, color: Colors.white),
                  ),
                ),
              );
            },
          ),

          // Close button (Liquid Glass)
          Positioned(
            top: 60,
            left: 20,
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.2)),
                    ),
                    child: const Icon(Icons.close, color: Colors.white, size: 24),
                  ),
                ),
              ),
            ),
          ),

          // Badge (Liquid Glass)
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white.withOpacity(0.2)),
                    ),
                    child: Text(
                      '${_currentIndex + 1} / ${widget.images.length}',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../home/domain/models/product.dart';
import '../../../auth/auth_provider.dart';
import '../providers/saved_items_provider.dart';
import '../../../../core/utils/image_utils.dart';
import '../../../messages/domain/models/chat_models.dart';
import '../../../messages/presentation/pages/chat_screen.dart';

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
      // Create or find existing conversation
      final existingConversation = await supabase
          .from('conversations')
          .select('id')
          .eq('buyer_id', user.id)
          .eq('seller_id', _product!.sellerId ?? '')
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

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF0A0A0A),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_product == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF0A0A0A),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Item not found',
                  style: TextStyle(color: Colors.white)),
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
      backgroundColor: const Color(0xFF0A0A0A),
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
                    iconColor: _isSaved ? Colors.red : Colors.white,
                    onTap: _isSaving ? null : _toggleSave,
                  ),
                  const SizedBox(width: 8),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    children: [
                      _buildImageGallery(product),
                      Positioned.fill(
                        child: ClipRect(
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 0, sigmaY: 0),
                            child: Container(color: Colors.transparent),
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
          color: Colors.black.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Icon(icon, color: iconColor ?? Colors.white, size: 20),
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
        PageView.builder(
          controller: _pageController,
          itemCount: product.images.length,
          onPageChanged: (i) => setState(() => _currentImageIndex = i),
          itemBuilder: (context, index) {
            return CachedNetworkImage(
              imageUrl: ImageUtils.getThumbnailUrl(product.images[index], width: 800, height: 600),
              fit: BoxFit.cover,
              memCacheWidth: 1000,
              placeholder: (context, url) => Container(
                color: const Color(0xFF171717),
                child: const Center(
                    child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white24),
                )),
              ),
              errorWidget: (context, url, error) => Container(
                color: const Color(0xFF171717),
                child: const Icon(Icons.broken_image, color: Colors.grey),
              ),
            );
          },
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
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    height: 1.3,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                '₦${product.price.toStringAsFixed(0)}',
                style: const TextStyle(
                  color: Colors.white,
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
                color: Colors.white.withOpacity(0.15),
                textColor: Colors.white,
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Divider
          Container(height: 1, color: Colors.white.withOpacity(0.08)),
          const SizedBox(height: 20),

          // Seller
          Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: Colors.white.withOpacity(0.2),
                backgroundImage: product.seller?.avatarUrl != null &&
                        product.seller!.avatarUrl!.isNotEmpty
                    ? CachedNetworkImageProvider(
                        ImageUtils.getThumbnailUrl(product.seller!.avatarUrl!, width: 150, height: 150),
                      )
                    : null,
                child: product.seller?.avatarUrl == null ||
                        product.seller!.avatarUrl!.isEmpty
                    ? Text(avatarLetter,
                        style: const TextStyle(
                            color: Colors.white,
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
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 15),
                    ),
                    const Text(
                      'Seller',
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ),
              if (_isOwner)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: Colors.white.withOpacity(0.3)),
                  ),
                  child: const Text(
                    'Your listing',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w500),
                  ),
                ),
            ],
          ),

          const SizedBox(height: 24),
          Container(height: 1, color: Colors.white.withOpacity(0.08)),
          const SizedBox(height: 20),

          // Description
          if (product.description != null &&
              product.description!.isNotEmpty) ...[
            const Text(
              'Description',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Text(
              product.description!,
              style: TextStyle(
                color: Colors.grey[300],
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
        const Text(
          'Details',
          style: TextStyle(
              color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF171717),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.06)),
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
                            style: const TextStyle(
                                color: Colors.grey, fontSize: 13)),
                        Text(entry.value['value']!,
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                  if (!isLast)
                    Divider(
                        height: 1,
                        color: Colors.white.withOpacity(0.06),
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
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        decoration: BoxDecoration(
          color: const Color(0xFF0A0A0A),
          border: Border(
            top: BorderSide(color: Colors.white.withOpacity(0.08)),
          ),
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              // Save button
              GestureDetector(
                onTap: _isSaving ? null : _toggleSave,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: _isSaved
                        ? Colors.red.withOpacity(0.15)
                        : const Color(0xFF171717),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _isSaved
                          ? Colors.red.withOpacity(0.4)
                          : Colors.white.withOpacity(0.1),
                    ),
                  ),
                  child: _isSaving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child:
                              CircularProgressIndicator(strokeWidth: 2))
                      : Icon(
                          _isSaved
                              ? Icons.favorite
                              : Icons.favorite_border,
                          color: _isSaved ? Colors.red : Colors.white,
                          size: 22,
                        ),
                ),
              ),
              const SizedBox(width: 12),
              // Message button
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _messageSeller,
                  icon: const Icon(Icons.chat_bubble_outline, size: 18),
                  label: const Text('Message Seller',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
            ],
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

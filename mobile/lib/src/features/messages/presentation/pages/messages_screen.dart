import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../domain/models/chat_models.dart';
import '../../../auth/auth_provider.dart';
import '../../../../core/utils/image_utils.dart';
import 'package:campus_deal_mobile/src/core/widgets/glass_search_bar.dart';
import 'chat_screen.dart';
import '../../../../core/widgets/glass_skeleton.dart';
import 'package:campus_deal_mobile/src/core/providers/app_mode_provider.dart';
import '../../../../core/theme/app_theme.dart';

class MessagesScreen extends ConsumerStatefulWidget {
  const MessagesScreen({super.key});

  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> with AutomaticKeepAliveClientMixin {
  final _searchController = TextEditingController();
  List<Conversation> _conversations = [];
  bool _isLoading = true;
  String _search = '';
  String? _currentUserId;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _load(showSkeleton: true);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load({bool showSkeleton = true}) async {
    if (showSkeleton && _conversations.isEmpty) {
      setState(() => _isLoading = true);
    }
    try {
      final supabase = ref.read(supabaseClientProvider);
      final user = supabase.auth.currentUser;
      if (user == null) return;
      _currentUserId = user.id;

      final data = await supabase
          .from('conversations')
          .select('''
            id, buyer_id, seller_id, last_message, last_message_at, gig_id,
            buyer_profile:profiles!buyer_id(id, first_name, last_name, avatar_url),
            seller_profile:profiles!seller_id(id, first_name, last_name, avatar_url),
            messages(
              id, 
              item_id, 
              items(id, title, price, item_images(image_url)),
              gig_id,
              gigs(id, title, price, gig_images(image_url))
            )
          ''')
          .or('buyer_id.eq.${user.id},seller_id.eq.${user.id}')
          .order('last_message_at', ascending: false);

      final convs = (data as List<dynamic>).map((raw) {
        final isBuyer = raw['buyer_id'] == user.id;
        final otherRaw = isBuyer
            ? raw['seller_profile'] as Map<String, dynamic>?
            : raw['buyer_profile'] as Map<String, dynamic>?;

        final otherUser = otherRaw != null
            ? ConvProfile(
                id: otherRaw['id'] as String,
                firstName: otherRaw['first_name'] as String?,
                lastName: otherRaw['last_name'] as String?,
                avatarUrl: otherRaw['avatar_url'] as String?,
              )
            : const ConvProfile(id: 'unknown', firstName: 'Unknown');

        // Get item/gig info from first message that has an item or gig
        final msgs = raw['messages'] as List<dynamic>? ?? [];
        final msgWithItem = msgs.firstWhere(
          (m) => m['items'] != null,
          orElse: () => null,
        );
        final msgWithGig = msgs.firstWhere(
          (m) => m['gigs'] != null,
          orElse: () => null,
        );

        final item = msgWithItem?['items'] as Map<String, dynamic>?;
        final gig = msgWithGig?['gigs'] as Map<String, dynamic>?;

        final itemTitle = item?['title'] ?? gig?['title'] as String?;
        final itemPrice = (item?['price'] as num?)?.toDouble() ?? (gig?['price'] as num?)?.toDouble();

        final itemImages = item?['item_images'] as List<dynamic>?;
        final gigImages = gig?['gig_images'] as List<dynamic>?;

        final itemImageUrl = itemImages?.isNotEmpty == true
            ? itemImages!.first['image_url'] as String?
            : (gigImages?.isNotEmpty == true
                ? gigImages!.first['image_url'] as String?
                : null);

        return Conversation(
          id: raw['id'] as String,
          buyerId: raw['buyer_id'] as String,
          sellerId: raw['seller_id'] as String,
          lastMessage: raw['last_message'] as String?,
          lastMessageAt: raw['last_message_at'] != null
              ? DateTime.parse(raw['last_message_at'] as String)
              : null,
          otherUser: otherUser,
          itemTitle: itemTitle,
          itemPrice: itemPrice,
          itemImageUrl: itemImageUrl,
          gigId: raw['gig_id'] as String?,
        );
      }).toList();

      setState(() => _conversations = convs);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<Conversation> get _filtered {
    final currentMode = ref.watch(appModeProvider);
    final isGigsMode = currentMode == AppMode.gigs;

    final baseConvs = _conversations.where((c) {
      if (isGigsMode) {
        return c.gigId != null;
      } else {
        return c.gigId == null;
      }
    }).toList();

    if (_search.isEmpty) return baseConvs;
    final q = _search.toLowerCase();
    return baseConvs.where((c) {
      return c.otherUser.displayName.toLowerCase().contains(q) ||
          (c.itemTitle?.toLowerCase().contains(q) ?? false) ||
          (c.lastMessage?.toLowerCase().contains(q) ?? false);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return Scaffold(
      backgroundColor: context.customBackground,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            backgroundColor: Colors.transparent,
            surfaceTintColor: Colors.transparent,
            scrolledUnderElevation: 0,
            elevation: 0,
            flexibleSpace: const SizedBox.shrink(),
            title: GlassSearchBar(
              controller: _searchController,
              hintText: 'Search conversations...',
              onChanged: (v) => setState(() => _search = v),
              onClear: () => setState(() => _search = ''),
            ),
          ),
          if (_isLoading)
            SliverFillRemaining(
              child: GlassShimmer(
                child: SingleChildScrollView(
                  child: Column(
                    children: List.generate(
                      6,
                      (_) => const GlassSkeletonListTile(
                        hasAvatar: true,
                        hasTrailing: true,
                      ),
                    ),
                  ),
                ),
              ),
            )
          else if (_filtered.isEmpty)
            SliverFillRemaining(child: _buildEmpty())
          else
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (ctx, i) => _buildConvTile(_filtered[i]),
                childCount: _filtered.length,
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }

  Widget _buildConvTile(Conversation conv) {
    final timeStr = conv.lastMessageAt != null
        ? _formatTime(conv.lastMessageAt!)
        : '';

    return InkWell(
      onTap: () async {
        await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ChatScreen(
              conversation: conv,
              currentUserId: _currentUserId ?? '',
            ),
          ),
        );
        _load(showSkeleton: false); // refresh last message on return silently!
      },
      child: Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
                color: context.customBorder),
          ),
        ),
        child: Row(
          children: [
            // Avatar
            _buildAvatar(conv.otherUser),
            const SizedBox(width: 14),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          conv.otherUser.displayName,
                          style: TextStyle(
                              color: context.customText,
                              fontWeight: FontWeight.w600,
                              fontSize: 15),
                        ),
                      ),
                      Text(timeStr,
                          style: TextStyle(
                              color: context.customSecondaryText, fontSize: 12)),
                    ],
                  ),
                  if (conv.itemTitle != null) ...[
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(Icons.tag,
                            size: 11, color: context.customSecondaryText.withOpacity(0.8)),
                        const SizedBox(width: 3),
                        Text(
                          conv.itemTitle!,
                          style: TextStyle(
                              color: context.customSecondaryText.withOpacity(0.8),
                              fontSize: 11,
                              fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 3),
                  Text(
                    conv.lastMessage ?? 'No messages yet',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        color: context.customSecondaryText, fontSize: 13),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Item thumbnail
            if (conv.itemImageUrl != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: CachedNetworkImage(
                  imageUrl: ImageUtils.getThumbnailUrl(conv.itemImageUrl!, width: 150, height: 150),
                  width: 44,
                  height: 44,
                  fit: BoxFit.cover,
                  memCacheWidth: 150,
                  memCacheHeight: 150,
                  placeholder: (_, __) =>
                      Container(color: context.customSurface),
                  errorWidget: (_, __, ___) =>
                      Container(color: context.customSurface),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatar(ConvProfile user) {
    return CircleAvatar(
      radius: 24,
      backgroundColor:
          context.isDarkMode ? Colors.white.withOpacity(0.2) : Colors.black.withOpacity(0.05),
      backgroundImage: user.avatarUrl != null && user.avatarUrl!.isNotEmpty
          ? CachedNetworkImageProvider(
              ImageUtils.getThumbnailUrl(user.avatarUrl!, width: 100, height: 100),
            )
          : null,
      child: user.avatarUrl == null || user.avatarUrl!.isEmpty
          ? Text(user.initials,
              style: TextStyle(
                  color: context.customText,
                  fontWeight: FontWeight.bold,
                  fontSize: 18))
          : null,
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: context.customSurface,
                shape: BoxShape.circle,
                border: Border.all(
                    color: context.customBorder),
              ),
              child: Icon(Icons.chat_bubble_outline,
                  color: context.customSecondaryText, size: 32),
            ),
            const SizedBox(height: 20),
            Text(
              _search.isNotEmpty ? 'No results' : 'No conversations yet',
              style: TextStyle(
                  color: context.customText,
                  fontSize: 18,
                  fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Tap "Message Seller" on any listing to start a conversation.',
              textAlign: TextAlign.center,
              style: TextStyle(color: context.customSecondaryText, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inDays == 0) {
      final h = dt.hour.toString().padLeft(2, '0');
      final m = dt.minute.toString().padLeft(2, '0');
      return '$h:$m';
    }
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year % 100}';
  }
}

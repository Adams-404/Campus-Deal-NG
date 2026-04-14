import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../domain/models/chat_models.dart';
import '../../../auth/auth_provider.dart';
import 'chat_screen.dart';

class MessagesScreen extends ConsumerStatefulWidget {
  const MessagesScreen({super.key});

  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> {
  List<Conversation> _conversations = [];
  bool _isLoading = true;
  String _search = '';
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final supabase = ref.read(supabaseClientProvider);
      final user = supabase.auth.currentUser;
      if (user == null) return;
      _currentUserId = user.id;

      final data = await supabase
          .from('conversations')
          .select('''
            id, buyer_id, seller_id, last_message, last_message_at,
            buyer_profile:profiles!buyer_id(id, first_name, last_name, avatar_url),
            seller_profile:profiles!seller_id(id, first_name, last_name, avatar_url),
            messages(id, item_id, items(id, title, price, item_images(image_url)))
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

        // Get item info from first message that has an item
        final msgs = raw['messages'] as List<dynamic>? ?? [];
        final msgWithItem = msgs.firstWhere(
          (m) => m['items'] != null,
          orElse: () => null,
        );
        final item = msgWithItem?['items'] as Map<String, dynamic>?;
        final itemImages = item?['item_images'] as List<dynamic>?;

        return Conversation(
          id: raw['id'] as String,
          buyerId: raw['buyer_id'] as String,
          sellerId: raw['seller_id'] as String,
          lastMessage: raw['last_message'] as String?,
          lastMessageAt: raw['last_message_at'] != null
              ? DateTime.parse(raw['last_message_at'] as String)
              : null,
          otherUser: otherUser,
          itemTitle: item?['title'] as String?,
          itemPrice: (item?['price'] as num?)?.toDouble(),
          itemImageUrl: itemImages?.isNotEmpty == true
              ? itemImages!.first['image_url'] as String?
              : null,
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
    if (_search.isEmpty) return _conversations;
    final q = _search.toLowerCase();
    return _conversations.where((c) {
      return c.otherUser.displayName.toLowerCase().contains(q) ||
          (c.itemTitle?.toLowerCase().contains(q) ?? false) ||
          (c.lastMessage?.toLowerCase().contains(q) ?? false);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            backgroundColor: const Color(0xFF0A0A0A),
            title: const Text('Messages',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold)),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(56),
              child: Padding(
                padding:
                    const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: TextField(
                  onChanged: (v) => setState(() => _search = v),
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Search conversations...',
                    hintStyle: TextStyle(color: Colors.grey[600]),
                    prefixIcon: Icon(Icons.search,
                        color: Colors.grey[600], size: 20),
                    filled: true,
                    fillColor: const Color(0xFF171717),
                    contentPadding:
                        const EdgeInsets.symmetric(vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
            ),
          ),
          if (_isLoading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
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
        _load(); // refresh last message on return
      },
      child: Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
                color: Colors.white.withValues(alpha: 0.05)),
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
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                              fontSize: 15),
                        ),
                      ),
                      Text(timeStr,
                          style: TextStyle(
                              color: Colors.grey[600], fontSize: 12)),
                    ],
                  ),
                  if (conv.itemTitle != null) ...[
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(Icons.tag,
                            size: 11, color: const Color(0xFF3B82F6).withValues(alpha: 0.8)),
                        const SizedBox(width: 3),
                        Text(
                          conv.itemTitle!,
                          style: TextStyle(
                              color: const Color(0xFF3B82F6).withValues(alpha: 0.8),
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
                        color: Colors.grey[500], fontSize: 13),
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
                  imageUrl: conv.itemImageUrl!,
                  width: 44,
                  height: 44,
                  fit: BoxFit.cover,
                  placeholder: (_, __) =>
                      Container(color: const Color(0xFF222222)),
                  errorWidget: (_, __, ___) =>
                      Container(color: const Color(0xFF222222)),
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
          const Color(0xFF3B82F6).withValues(alpha: 0.2),
      backgroundImage: user.avatarUrl != null && user.avatarUrl!.isNotEmpty
          ? CachedNetworkImageProvider(user.avatarUrl!)
          : null,
      child: user.avatarUrl == null || user.avatarUrl!.isEmpty
          ? Text(user.initials,
              style: const TextStyle(
                  color: Color(0xFF3B82F6),
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
                color: const Color(0xFF171717),
                shape: BoxShape.circle,
                border: Border.all(
                    color: Colors.white.withValues(alpha: 0.06)),
              ),
              child: const Icon(Icons.chat_bubble_outline,
                  color: Colors.grey, size: 32),
            ),
            const SizedBox(height: 20),
            const Text(
              _search.length > 0 ? 'No results' : 'No conversations yet',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Tap "Message Seller" on any listing to start a conversation.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[500], fontSize: 14),
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

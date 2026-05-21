import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../domain/models/chat_models.dart';
import '../../../auth/auth_provider.dart';
import '../../../../core/widgets/glass_skeleton.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final Conversation conversation;
  final String currentUserId;

  const ChatScreen({
    super.key,
    required this.conversation,
    required this.currentUserId,
  });

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  List<ChatMessage> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  RealtimeChannel? _channel;

  @override
  void initState() {
    super.initState();
    _fetchMessages();
    _subscribeRealtime();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _unsubscribe();
    super.dispose();
  }

  Future<void> _fetchMessages() async {
    try {
      final supabase = ref.read(supabaseClientProvider);
      final data = await supabase
          .from('messages')
          .select('''
            id, content, sender_id, created_at, image_url, item_id,
            items(id, title, price, item_images(image_url))
          ''')
          .eq('conversation_id', widget.conversation.id)
          .order('created_at', ascending: true);

      final msgs = (data as List<dynamic>)
          .map((m) => ChatMessage.fromJson(
              m as Map<String, dynamic>, widget.conversation.id))
          .toList();

      setState(() {
        _messages = msgs;
        _isLoading = false;
      });
      _scrollToBottom();
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _subscribeRealtime() {
    final supabase = ref.read(supabaseClientProvider);
    _channel = supabase
        .channel('conversation:${widget.conversation.id}')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'conversation_id',
            value: widget.conversation.id,
          ),
          callback: (payload) {
            final newMsg = ChatMessage.fromJson(
              payload.newRecord,
              widget.conversation.id,
            );
            // Avoid duplicate if already added optimistically
            final exists = _messages.any((m) => m.id == newMsg.id);
            if (!exists) {
              setState(() => _messages.add(newMsg));
              _scrollToBottom();
            }
          },
        )
        .subscribe();
  }

  void _unsubscribe() {
    final supabase = Supabase.instance.client;
    if (_channel != null) {
      supabase.removeChannel(_channel!);
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _isSending) return;

    setState(() => _isSending = true);
    _messageController.clear();

    // Optimistic insert
    final tempId = 'temp-${DateTime.now().millisecondsSinceEpoch}';
    final optimistic = ChatMessage(
      id: tempId,
      content: text,
      senderId: widget.currentUserId,
      conversationId: widget.conversation.id,
      createdAt: DateTime.now(),
    );
    setState(() => _messages.add(optimistic));
    _scrollToBottom();

    try {
      final supabase = ref.read(supabaseClientProvider);
      final timestamp = DateTime.now().toIso8601String();

      final inserted = await supabase
          .from('messages')
          .insert({
            'conversation_id': widget.conversation.id,
            'content': text,
            'sender_id': widget.currentUserId,
            'created_at': timestamp,
            'item_id': widget.conversation.itemTitle != null
                ? null // we don't have the item_id here; keep null
                : null,
          })
          .select()
          .single();

      // Replace optimistic with real
      final real = ChatMessage.fromJson(
          inserted as Map<String, dynamic>, widget.conversation.id);
      setState(() {
        _messages = _messages
            .map((m) => m.id == tempId ? real : m)
            .toList();
      });

      // Update conversation last_message
      await supabase.from('conversations').update({
        'last_message': text,
        'last_message_at': timestamp,
      }).eq('id', widget.conversation.id);
    } catch (e) {
      // Roll back optimistic message
      setState(() => _messages.removeWhere((m) => m.id == tempId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  void _scrollToBottom({bool animated = true}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final other = widget.conversation.otherUser;

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new,
              color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor:
                  Colors.white.withOpacity(0.2),
              backgroundImage:
                  other.avatarUrl != null && other.avatarUrl!.isNotEmpty
                      ? CachedNetworkImageProvider(other.avatarUrl!)
                      : null,
              child: other.avatarUrl == null || other.avatarUrl!.isEmpty
                  ? Text(other.initials,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14))
                  : null,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    other.displayName,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16),
                  ),
                  if (widget.conversation.itemTitle != null)
                    Text(
                      widget.conversation.itemTitle!,
                      style: TextStyle(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 11),
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
              height: 1,
              color: Colors.white.withOpacity(0.06)),
        ),
      ),
      body: Column(
        children: [
          // Item context banner
          if (widget.conversation.itemTitle != null)
            _buildItemBanner(),

          // Messages
          Expanded(
            child: _isLoading
                ? const GlassShimmer(
                    child: SingleChildScrollView(
                      physics: NeverScrollableScrollPhysics(),
                      child: Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: Column(
                          children: [
                            Align(
                              alignment: Alignment.centerRight,
                              child: GlassSkeletonBlock(
                                  height: 40, width: 180, borderRadius: 16, margin: EdgeInsets.only(bottom: 12)),
                            ),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: GlassSkeletonBlock(
                                  height: 50, width: 220, borderRadius: 16, margin: EdgeInsets.only(bottom: 12)),
                            ),
                            Align(
                              alignment: Alignment.centerRight,
                              child: GlassSkeletonBlock(
                                  height: 35, width: 120, borderRadius: 16, margin: EdgeInsets.only(bottom: 12)),
                            ),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: GlassSkeletonBlock(
                                  height: 60, width: 250, borderRadius: 16, margin: EdgeInsets.only(bottom: 12)),
                            ),
                            Align(
                              alignment: Alignment.centerRight,
                              child: GlassSkeletonBlock(
                                  height: 45, width: 200, borderRadius: 16, margin: EdgeInsets.only(bottom: 12)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                : _messages.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        itemCount: _messages.length,
                        itemBuilder: (ctx, i) {
                          final msg = _messages[i];
                          final isMe =
                              msg.senderId == widget.currentUserId;
                          final showDate = i == 0 ||
                              !_sameDay(
                                  _messages[i - 1].createdAt,
                                  msg.createdAt);
                          return Column(
                            children: [
                              if (showDate) _buildDateDivider(msg.createdAt),
                              _buildBubble(msg, isMe),
                            ],
                          );
                        },
                      ),
          ),

          // Input bar
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildItemBanner() {
    final conv = widget.conversation;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF171717),
        border: Border(
            bottom: BorderSide(color: Colors.white.withOpacity(0.06))),
      ),
      child: Row(
        children: [
          if (conv.itemImageUrl != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: CachedNetworkImage(
                imageUrl: conv.itemImageUrl!,
                width: 40,
                height: 40,
                fit: BoxFit.cover,
                placeholder: (_, __) =>
                    Container(color: const Color(0xFF222222)),
                errorWidget: (_, __, ___) =>
                    Container(color: const Color(0xFF222222)),
              ),
            ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  conv.itemTitle ?? '',
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 13),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (conv.itemPrice != null)
                  Text(
                    '₦${NumberFormat('#,##0').format(conv.itemPrice!)}',
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBubble(ChatMessage msg, bool isMe) {
    final isTemp = msg.id.startsWith('temp-');
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          top: 4,
          bottom: 4,
          left: isMe ? 48 : 0,
          right: isMe ? 0 : 48,
        ),
        padding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isMe
              ? Colors.white
              : const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft:
                isMe ? const Radius.circular(18) : const Radius.circular(4),
            bottomRight:
                isMe ? const Radius.circular(4) : const Radius.circular(18),
          ),
        ),
        child: Column(
          crossAxisAlignment:
              isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(
              msg.content,
              style: TextStyle(
                  color: isMe ? Colors.white : Colors.grey[200],
                  fontSize: 14,
                  height: 1.4),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _formatMsgTime(msg.createdAt),
                  style: TextStyle(
                      color: isMe
                          ? Colors.white.withOpacity(0.6)
                          : Colors.grey[600],
                      fontSize: 10),
                ),
                if (isMe && !isTemp) ...[
                  const SizedBox(width: 4),
                  Icon(Icons.done_all,
                      size: 12,
                      color: Colors.white.withOpacity(0.6)),
                ] else if (isMe && isTemp) ...[
                  const SizedBox(width: 4),
                  GlassPulseIcon(
                    icon: Icons.access_time,
                    color: Colors.white.withOpacity(0.6),
                    size: 10,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDateDivider(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt).inDays;
    String label;
    if (diff == 0) label = 'Today';
    else if (diff == 1) label = 'Yesterday';
    else label = '${dt.day}/${dt.month}/${dt.year}';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Expanded(
              child: Divider(color: Colors.white.withOpacity(0.08))),
          const SizedBox(width: 8),
          Text(label,
              style: TextStyle(color: Colors.grey[600], fontSize: 11)),
          const SizedBox(width: 8),
          Expanded(
              child: Divider(color: Colors.white.withOpacity(0.08))),
        ],
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: EdgeInsets.fromLTRB(
          12, 10, 12, 10 + MediaQuery.of(context).padding.bottom),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        border: Border(
            top: BorderSide(color: Colors.white.withOpacity(0.06))),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E1E1E),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                    color: Colors.white.withOpacity(0.08)),
              ),
              child: TextField(
                controller: _messageController,
                style: const TextStyle(color: Colors.white, fontSize: 15),
                maxLines: 4,
                minLines: 1,
                textInputAction: TextInputAction.newline,
                keyboardType: TextInputType.multiline,
                decoration: InputDecoration(
                  hintText: 'Type a message...',
                  hintStyle: TextStyle(color: Colors.grey[600]),
                  border: InputBorder.none,
                  contentPadding:
                      const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _isSending ? null : _sendMessage,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Colors.white, Color(0xFF6366F1)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color:
                        Colors.white.withOpacity(0.4),
                    blurRadius: 10,
                    spreadRadius: 1,
                  ),
                ],
              ),
              child: _isSending
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: GlassShimmer(
                        child: Icon(Icons.send_rounded,
                            color: Colors.white, size: 20),
                      ),
                    )
                  : const Icon(Icons.send_rounded,
                      color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.waving_hand_outlined,
                color: Colors.white, size: 32),
          ),
          const SizedBox(height: 16),
          const Text('Say hello!',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Text(
            'No messages yet. Start the conversation.',
            style: TextStyle(color: Colors.grey[500], fontSize: 14),
          ),
        ],
      ),
    );
  }

  bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  String _formatMsgTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}

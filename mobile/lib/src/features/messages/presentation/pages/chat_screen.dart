import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../domain/models/chat_models.dart';
import '../../../auth/auth_provider.dart';
import '../../../../core/widgets/glass_skeleton.dart';
import '../../../../core/providers/connectivity_provider.dart';
import '../../../../core/utils/connectivity_utils.dart';
import '../providers/offline_messages_provider.dart';
import '../../../settings/presentation/pages/user_profile_screen.dart';
import '../../../../core/theme/app_theme.dart';

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

    final isOffline = ref.read(connectivityProvider) == ConnectivityStatus.disconnected;

    if (isOffline) {
      final tempId = 'temp-${DateTime.now().millisecondsSinceEpoch}';
      final pending = PendingMessage(
        tempId: tempId,
        content: text,
        senderId: widget.currentUserId,
        conversationId: widget.conversation.id,
        createdAt: DateTime.now(),
      );
      
      _messageController.clear();
      await ref.read(offlineMessagesProvider.notifier).queueMessage(pending);
      _scrollToBottom();
      return;
    }

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
            'item_id': null,
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
      // If insertion fails due to an unexpected offline/network issue, queue it!
      final stillOffline = await ConnectivityUtils.hasInternetConnection() == false;
      if (stillOffline) {
        setState(() {
          _messages.removeWhere((m) => m.id == tempId);
        });
        final pending = PendingMessage(
          tempId: tempId,
          content: text,
          senderId: widget.currentUserId,
          conversationId: widget.conversation.id,
          createdAt: optimistic.createdAt,
        );
        await ref.read(offlineMessagesProvider.notifier).queueMessage(pending);
      } else {
        // Roll back optimistic message for general database / policy failures
        setState(() => _messages.removeWhere((m) => m.id == tempId));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to send: $e')),
          );
        }
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

    // Retrieve and filter pending offline messages for this conversation
    final pendingMessages = ref.watch(offlineMessagesProvider)
        .where((msg) => msg.conversationId == widget.conversation.id)
        .map((msg) => ChatMessage(
              id: msg.tempId,
              content: msg.content,
              senderId: msg.senderId,
              conversationId: msg.conversationId,
              createdAt: msg.createdAt,
            ))
        .toList();

    final allMessages = [..._messages, ...pendingMessages];

    return Scaffold(
      backgroundColor: context.customBackground,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new,
              color: context.customText, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: GestureDetector(
          onTap: () {
            if (other.id.isNotEmpty) {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => UserProfileScreen(userId: other.id),
                ),
              );
            }
          },
          behavior: HitTestBehavior.opaque,
          child: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor:
                    context.isDarkMode ? Colors.white.withOpacity(0.2) : Colors.black.withOpacity(0.05),
                backgroundImage:
                    other.avatarUrl != null && other.avatarUrl!.isNotEmpty
                        ? CachedNetworkImageProvider(other.avatarUrl!)
                        : null,
                child: other.avatarUrl == null || other.avatarUrl!.isEmpty
                    ? Text(other.initials,
                        style: TextStyle(
                            color: context.customText,
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
                      style: TextStyle(
                          color: context.customText,
                          fontWeight: FontWeight.bold,
                          fontSize: 16),
                    ),
                    if (widget.conversation.itemTitle != null)
                      Text(
                        widget.conversation.itemTitle!,
                        style: TextStyle(
                            color: context.customSecondaryText,
                            fontSize: 11),
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
              height: 1,
              color: context.customBorder),
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
                : allMessages.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        itemCount: allMessages.length,
                        itemBuilder: (ctx, i) {
                          final msg = allMessages[i];
                          final isMe =
                              msg.senderId == widget.currentUserId;
                          final showDate = i == 0 ||
                              !_sameDay(
                                  allMessages[i - 1].createdAt,
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
        color: context.customSurface,
        border: Border(
            bottom: BorderSide(color: context.customBorder)),
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
                    Container(color: context.customSurface),
                errorWidget: (_, __, ___) =>
                    Container(color: context.customSurface),
              ),
            ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  conv.itemTitle ?? '',
                  style: TextStyle(
                      color: context.customText,
                      fontWeight: FontWeight.w600,
                      fontSize: 13),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (conv.itemPrice != null)
                  Text(
                    '₦${NumberFormat('#,##0').format(conv.itemPrice!)}',
                    style: TextStyle(
                        color: context.customText,
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
              ? const Color(0xFF6366F1).withOpacity(0.18)
              : (context.isDarkMode ? Colors.white.withOpacity(0.07) : Colors.white.withOpacity(0.8)),
          border: Border.all(
            color: isMe
                ? const Color(0xFF6366F1).withOpacity(0.35)
                : context.customBorder,
            width: 1.2,
          ),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft:
                isMe ? const Radius.circular(18) : const Radius.circular(4),
            bottomRight:
                isMe ? const Radius.circular(4) : const Radius.circular(18),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment:
              isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(
              msg.content,
              style: TextStyle(
                  color: isMe ? (context.isDarkMode ? Colors.white : const Color(0xFF1E1B4B)) : context.customText,
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
                          ? (context.isDarkMode ? Colors.white.withOpacity(0.5) : const Color(0xFF4F46E5).withOpacity(0.8))
                          : context.customSecondaryText.withOpacity(0.8),
                      fontSize: 10),
                ),
                if (isMe && !isTemp) ...[
                  const SizedBox(width: 4),
                  Icon(Icons.done_all,
                      size: 12,
                      color: context.isDarkMode ? Colors.white.withOpacity(0.6) : const Color(0xFF4F46E5).withOpacity(0.7)),
                ] else if (isMe && isTemp) ...[
                  const SizedBox(width: 4),
                  GlassPulseIcon(
                    icon: Icons.access_time,
                    color: context.isDarkMode ? Colors.white.withOpacity(0.6) : const Color(0xFF4F46E5).withOpacity(0.7),
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
              child: Divider(color: context.customBorder)),
          const SizedBox(width: 8),
          Text(label,
              style: TextStyle(color: context.customSecondaryText, fontSize: 11)),
          const SizedBox(width: 8),
          Expanded(
              child: Divider(color: context.customBorder)),
        ],
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: EdgeInsets.fromLTRB(
          12, 10, 12, 10 + MediaQuery.of(context).padding.bottom),
      decoration: BoxDecoration(
        color: context.customBackground,
        border: Border(
            top: BorderSide(color: context.customBorder)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              clipBehavior: Clip.antiAlias,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: context.customSurface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                    color: context.customBorder),
              ),
              child: TextField(
                controller: _messageController,
                style: TextStyle(color: context.customText, fontSize: 15),
                maxLines: 4,
                minLines: 1,
                textInputAction: TextInputAction.newline,
                keyboardType: TextInputType.multiline,
                decoration: InputDecoration(
                  filled: false,
                  hintText: 'Type a message...',
                  hintStyle: TextStyle(color: context.customSecondaryText.withOpacity(0.6)),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding:
                      const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _isSending ? null : _sendMessage,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(23),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: context.customSurface,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: context.customBorder,
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
                  child: _isSending
                      ? Padding(
                          padding: const EdgeInsets.all(12),
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(context.customText),
                          ),
                        )
                      : Icon(
                          Icons.send_rounded,
                          color: context.customText,
                          size: 20,
                        ),
                ),
              ),
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
              color: context.customSurface,
              shape: BoxShape.circle,
              border: Border.all(color: context.customBorder),
            ),
            child: Icon(Icons.waving_hand_outlined,
                color: context.customText, size: 32),
          ),
          const SizedBox(height: 16),
          Text('Say hello!',
              style: TextStyle(
                  color: context.customText,
                  fontSize: 18,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Text(
            'No messages yet. Start the conversation.',
            style: TextStyle(color: context.customSecondaryText, fontSize: 14),
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

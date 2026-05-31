import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../../../auth/auth_provider.dart';
import '../../../../core/widgets/glass_app_bar.dart';
import '../../../../core/widgets/glass_skeleton.dart';
import '../../../../core/theme/app_theme.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;
  RealtimeChannel? _channel;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _setupRealtime();
  }

  @override
  void dispose() {
    if (_channel != null) {
      ref.read(supabaseClientProvider).removeChannel(_channel!);
    }
    super.dispose();
  }

  Future<void> _loadNotifications() async {
    try {
      final supabase = ref.read(supabaseClientProvider);
      final user = supabase.auth.currentUser;
      if (user == null) {
        setState(() => _isLoading = false);
        return;
      }

      final response = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      setState(() {
        _notifications = List<Map<String, dynamic>>.from(response);
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _setupRealtime() {
    final supabase = ref.read(supabaseClientProvider);
    final user = supabase.auth.currentUser;
    if (user == null) return;

    _channel = supabase
        .channel('notifications_mobile')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: user.id,
          ),
          callback: (payload) {
            _loadNotifications();
          },
        )
        .subscribe();
  }

  Future<void> _markAsRead(String notificationId) async {
    try {
      final supabase = ref.read(supabaseClientProvider);
      await supabase
          .from('notifications')
          .update({'is_read': true}).eq('id', notificationId);

      setState(() {
        _notifications = _notifications.map((n) {
          if (n['id'] == notificationId) {
            return {...n, 'is_read': true};
          }
          return n;
        }).toList();
      });
    } catch (e) {
      // silently fail
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      final supabase = ref.read(supabaseClientProvider);
      final user = supabase.auth.currentUser;
      if (user == null) return;

      await supabase
          .from('notifications')
          .update({'is_read': true})
          .eq('user_id', user.id)
          .eq('is_read', false);

      setState(() {
        _notifications = _notifications
            .map((n) => {...n, 'is_read': true})
            .toList();
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('All notifications marked as read'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      // silently fail
    }
  }

  String _timeAgo(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inSeconds < 60) return 'just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return DateFormat('MMM d').format(date);
    } catch (_) {
      return '';
    }
  }

  Widget _getIcon(String type) {
    switch (type) {
      case 'success':
        return Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.green.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.check_circle, color: Colors.green, size: 20),
        );
      case 'error':
        return Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.red.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.cancel, color: Colors.red, size: 20),
        );
      case 'info':
        return Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.info, color: Color(0xFF3B82F6), size: 20),
        );
      default:
        return Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.notifications,
              color: Color(0xFF3B82F6), size: 20),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => n['is_read'] != true).length;

    return Scaffold(
      backgroundColor: context.customBackground,
      extendBodyBehindAppBar: true,
      appBar: GlassAppBar(
        title: 'Notifications',
        actions: [
          if (unreadCount > 0)
            GestureDetector(
              onTap: _markAllAsRead,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                  child: Container(
                    margin: const EdgeInsets.only(right: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          context.customText.withOpacity(0.14),
                          context.customText.withOpacity(0.05),
                        ],
                      ),
                    ),
                    child: const Text('Mark all read',
                        style: TextStyle(color: Color(0xFF3B82F6), fontSize: 12, fontWeight: FontWeight.w500)),
                  ),
                ),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? GlassShimmer(
              child: ListView.separated(
                padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + kToolbarHeight + 8, 16, 16),
                itemCount: 6,
                separatorBuilder: (_, index) => const SizedBox(height: 8),
                itemBuilder: (context, index) => const GlassSkeletonListTile(
                  hasAvatar: true,
                  hasTrailing: false,
                ),
              ),
            )
          : _notifications.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadNotifications,
                  color: const Color(0xFF3B82F6),
                  child: ListView.separated(
                    padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + kToolbarHeight + 8, 16, 16),
                    itemCount: _notifications.length,
                    separatorBuilder: (_, index) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final notification = _notifications[index];
                      final isRead = notification['is_read'] == true;
                      final metadata = notification['metadata'] as Map<String, dynamic>?;
                      final isAdminMessage = metadata?['category'] == 'admin_message';

                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: context.customSurface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isRead
                                ? context.customBorder
                                : const Color(0xFF3B82F6).withValues(alpha: 0.3),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Admin badge
                            if (isAdminMessage)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 12,
                                      backgroundColor: const Color(0xFF1078A7)
                                          .withValues(alpha: 0.2),
                                      child: const Text('A',
                                          style: TextStyle(
                                              fontSize: 10,
                                              color: Color(0xFF1078A7))),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      metadata?['admin_name'] ?? 'Admin Team',
                                      style: TextStyle(
                                          color: context.customText,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w500),
                                    ),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF1078A7)
                                            .withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(
                                            color: const Color(0xFF1078A7)),
                                      ),
                                      child: const Text('Admin',
                                          style: TextStyle(
                                              color: Color(0xFF1078A7),
                                              fontSize: 10,
                                              fontWeight: FontWeight.w600)),
                                    ),
                                  ],
                                ),
                              ),

                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _getIcon(notification['type'] ?? ''),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              notification['title'] ?? '',
                                              style: TextStyle(
                                                color: context.customText,
                                                fontSize: 14,
                                                fontWeight: isRead
                                                    ? FontWeight.w400
                                                    : FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                          if (!isRead)
                                            GestureDetector(
                                              onTap: () => _markAsRead(
                                                  notification['id']),
                                              child: Container(
                                                width: 8,
                                                height: 8,
                                                decoration: const BoxDecoration(
                                                  color: Color(0xFF3B82F6),
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        notification['content'] ?? '',
                                        style: TextStyle(
                                          color: context.customSecondaryText,
                                          fontSize: 13,
                                          height: 1.4,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        _timeAgo(
                                            notification['created_at'] ?? ''),
                                        style: TextStyle(
                                            color: context.customSecondaryText.withOpacity(0.5),
                                            fontSize: 11),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.notifications_none,
                color: Color(0xFF3B82F6), size: 40),
          ),
          const SizedBox(height: 16),
          Text(
            "You're all caught up",
            style: TextStyle(
                color: context.customText,
                fontSize: 16,
                fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            'No notifications at the moment',
            style: TextStyle(color: context.customSecondaryText, fontSize: 14),
          ),
        ],
      ),
    );
  }
}

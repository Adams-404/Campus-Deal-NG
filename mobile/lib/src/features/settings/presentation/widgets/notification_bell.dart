import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../../../auth/auth_provider.dart';
import '../pages/notifications_screen.dart';
import '../../../../core/theme/app_theme.dart';

class NotificationBell extends ConsumerStatefulWidget {
  const NotificationBell({super.key});

  @override
  ConsumerState<NotificationBell> createState() => _NotificationBellState();
}

class _NotificationBellState extends ConsumerState<NotificationBell> with SingleTickerProviderStateMixin {
  List<Map<String, dynamic>> _notifications = [];
  RealtimeChannel? _channel;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _setupRealtime();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    if (_channel != null) {
      try {
        ref.read(supabaseClientProvider).removeChannel(_channel!);
      } catch (_) {}
    }
    super.dispose();
  }

  Future<void> _loadNotifications() async {
    try {
      final supabase = ref.read(supabaseClientProvider);
      final user = supabase.auth.currentUser;
      if (user == null) return;

      final response = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', ascending: false)
          .limit(20); // fetch enough to count unread and show recent in dropdown

      if (mounted) {
        setState(() {
          _notifications = List<Map<String, dynamic>>.from(response);
        });
      }
    } catch (_) {}
  }

  void _setupRealtime() {
    final supabase = ref.read(supabaseClientProvider);
    final user = supabase.auth.currentUser;
    if (user == null) return;

    _channel = supabase
        .channel('notifications_mobile_bell')
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

      if (mounted) {
        setState(() {
          _notifications = _notifications.map((n) {
            if (n['id'] == notificationId) {
              return {...n, 'is_read': true};
            }
            return n;
          }).toList();
        });
      }
    } catch (_) {}
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

      if (mounted) {
        setState(() {
          _notifications = _notifications
              .map((n) => {...n, 'is_read': true})
              .toList();
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('All notifications marked as read'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (_) {}
  }

  void _showDropdown(BuildContext context) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Notifications Dismiss',
      barrierColor: Colors.black.withValues(alpha: 0.55),
      transitionDuration: const Duration(milliseconds: 320),
      pageBuilder: (ctx, anim1, anim2) {
        return _NotificationDropdownPanel(
          notifications: _notifications,
          onMarkAsRead: _markAsRead,
          onMarkAllRead: _markAllAsRead,
          onShowAll: () {
            Navigator.of(ctx).pop();
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const NotificationsScreen()),
            );
          },
          onClose: () => Navigator.of(ctx).pop(),
        );
      },
      transitionBuilder: (ctx, anim1, anim2, child) {
        return FadeTransition(
          opacity: anim1,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0.0, -0.04),
              end: Offset.zero,
            ).animate(CurvedAnimation(
              parent: anim1,
              curve: Curves.easeOutBack,
            )),
            child: ScaleTransition(
              scale: anim1,
              alignment: const Alignment(0.575, -1.0),
              child: child,
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => n['is_read'] != true).length;

    return GestureDetector(
      onTap: () => _showDropdown(context),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: context.customSurface,
              shape: BoxShape.circle,
              border: Border.all(
                color: context.customBorder.withValues(alpha: 0.4),
                width: 1.0,
              ),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Icon(
                  Icons.notifications_none,
                  color: context.customText,
                  size: 20,
                ),
                if (unreadCount > 0)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: ScaleTransition(
                      scale: Tween<double>(begin: 0.9, end: 1.1).animate(_pulseController),
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF3B82F6),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF3B82F6).withValues(alpha: 0.5),
                              blurRadius: 6,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                        child: Text(
                          unreadCount > 9 ? '9+' : '$unreadCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NotificationDropdownPanel extends StatelessWidget {
  final List<Map<String, dynamic>> notifications;
  final Function(String) onMarkAsRead;
  final VoidCallback onMarkAllRead;
  final VoidCallback onShowAll;
  final VoidCallback onClose;

  const _NotificationDropdownPanel({
    required this.notifications,
    required this.onMarkAsRead,
    required this.onMarkAllRead,
    required this.onShowAll,
    required this.onClose,
  });

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
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: Colors.green.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.check_circle, color: Colors.green, size: 16),
        );
      case 'error':
        return Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: Colors.red.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.cancel, color: Colors.red, size: 16),
        );
      case 'info':
        return Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.info, color: Color(0xFF3B82F6), size: 16),
        );
      default:
        return Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.notifications, color: Color(0xFF3B82F6), size: 16),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final displayList = notifications.take(5).toList();
    final unreadCount = notifications.where((n) => n['is_read'] != true).length;

    return GestureDetector(
      onTap: onClose, // Dismiss when tapping outside the panel stack
      child: Material(
        color: Colors.transparent,
        child: Stack(
          children: [
            Positioned(
              top: 75 + MediaQuery.of(context).padding.top,
              right: 16,
              width: 320,
              child: GestureDetector(
                onTap: () {}, // Prevent dismissal when tapping inside panel
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
                    child: Container(
                      decoration: BoxDecoration(
                        color: context.customSurface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: context.customBorder.withValues(alpha: 0.4),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF3B82F6).withValues(alpha: 0.20),
                            blurRadius: 24,
                            spreadRadius: 1,
                            offset: const Offset(0, 12),
                          ),
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.15),
                            blurRadius: 40,
                            spreadRadius: 10,
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Header Panel
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 16, 12, 12),
                            child: Row(
                              children: [
                                Text(
                                  'Notifications',
                                  style: TextStyle(
                                    color: context.customText,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                if (unreadCount > 0)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF3B82F6).withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: const Color(0xFF3B82F6).withValues(alpha: 0.4),
                                        width: 1,
                                      ),
                                    ),
                                    child: Text(
                                      '$unreadCount new',
                                      style: const TextStyle(
                                        color: Color(0xFF3B82F6),
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                const Spacer(),
                                if (unreadCount > 0)
                                  GestureDetector(
                                    onTap: onMarkAllRead,
                                    child: const Text(
                                      'Mark all read',
                                      style: TextStyle(
                                        color: Color(0xFF3B82F6),
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                const SizedBox(width: 6),
                                IconButton(
                                  onPressed: onClose,
                                  icon: Icon(Icons.close, color: context.customSecondaryText, size: 16),
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                  splashRadius: 16,
                                ),
                              ],
                            ),
                          ),
                          Divider(color: context.customBorder, height: 1),

                          // Notification Items
                          if (displayList.isEmpty)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 36),
                              child: Column(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.notifications_none,
                                        color: Color(0xFF3B82F6), size: 24),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    "You're all caught up",
                                    style: TextStyle(
                                      color: context.customText,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'No new notifications',
                                    style: TextStyle(
                                      color: context.customSecondaryText.withValues(alpha: 0.7),
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            )
                          else
                            Flexible(
                              child: ListView.separated(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                itemCount: displayList.length,
                                separatorBuilder: (_, index) => Divider(color: context.customBorder, height: 1),
                                itemBuilder: (ctx, index) {
                                  final item = displayList[index];
                                  final isRead = item['is_read'] == true;

                                  return InkWell(
                                    onTap: () {
                                      if (!isRead) {
                                        onMarkAsRead(item['id']);
                                      }
                                    },
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          _getIcon(item['type'] ?? ''),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Expanded(
                                                      child: Text(
                                                        item['title'] ?? '',
                                                        style: TextStyle(
                                                          color: context.customText,
                                                          fontSize: 13,
                                                          fontWeight: isRead ? FontWeight.w500 : FontWeight.bold,
                                                        ),
                                                        maxLines: 1,
                                                        overflow: TextOverflow.ellipsis,
                                                      ),
                                                    ),
                                                    if (!isRead)
                                                      Container(
                                                        margin: const EdgeInsets.only(left: 6, top: 4),
                                                        width: 6,
                                                        height: 6,
                                                        decoration: const BoxDecoration(
                                                          color: Color(0xFF3B82F6),
                                                          shape: BoxShape.circle,
                                                        ),
                                                      ),
                                                  ],
                                                ),
                                                const SizedBox(height: 3),
                                                Text(
                                                  item['content'] ?? '',
                                                  style: TextStyle(
                                                    color: context.customSecondaryText,
                                                    fontSize: 11,
                                                    height: 1.3,
                                                  ),
                                                  maxLines: 2,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                                const SizedBox(height: 5),
                                                Text(
                                                  _timeAgo(item['created_at'] ?? ''),
                                                  style: TextStyle(
                                                    color: context.customSecondaryText.withValues(alpha: 0.6),
                                                    fontSize: 9,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          Divider(color: context.customBorder, height: 1),

                          // Footer "Show More" Button
                          Padding(
                            padding: const EdgeInsets.all(12),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: BackdropFilter(
                                filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                                child: Container(
                                  width: double.infinity,
                                  height: 38,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(12),
                                    gradient: LinearGradient(
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                      colors: [
                                        const Color(0xFF3B82F6).withValues(alpha: 0.22),
                                        const Color(0xFF3B82F6).withValues(alpha: 0.06),
                                      ],
                                    ),
                                    border: Border.all(
                                      color: const Color(0xFF3B82F6).withValues(alpha: 0.45),
                                      width: 1.2,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF3B82F6).withValues(alpha: 0.12),
                                        blurRadius: 8,
                                        spreadRadius: 1,
                                      ),
                                    ],
                                  ),
                                  child: Material(
                                    color: Colors.transparent,
                                    child: InkWell(
                                      onTap: onShowAll,
                                      borderRadius: BorderRadius.circular(12),
                                      child: const Center(
                                        child: Text(
                                          'Show All Notifications',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 0.3,
                                          ),
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
          ],
        ),
      ),
    );
  }
}

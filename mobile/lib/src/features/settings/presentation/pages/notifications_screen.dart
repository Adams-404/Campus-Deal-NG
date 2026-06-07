import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/widgets/glass_app_bar.dart';
import '../../../../core/theme/app_theme.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  bool _pushEnabled = true;
  bool _emailEnabled = true;
  bool _inAppEnabled = true;
  bool _newMessages = true;
  bool _newFollowers = true;
  bool _listingSold = true;
  bool _priceDrops = false;
  bool _promotions = false;
  bool _adminAnnouncements = true;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _pushEnabled = prefs.getBool('notif_push') ?? true;
      _emailEnabled = prefs.getBool('notif_email') ?? true;
      _inAppEnabled = prefs.getBool('notif_inapp') ?? true;
      _newMessages = prefs.getBool('notif_messages') ?? true;
      _newFollowers = prefs.getBool('notif_followers') ?? true;
      _listingSold = prefs.getBool('notif_sold') ?? true;
      _priceDrops = prefs.getBool('notif_price_drops') ?? false;
      _promotions = prefs.getBool('notif_promotions') ?? false;
      _adminAnnouncements = prefs.getBool('notif_admin') ?? true;
    });
  }

  Future<void> _setBool(String key, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.customBackground,
      extendBodyBehindAppBar: true,
      appBar: GlassAppBar(title: 'Notification Settings'),
      body: ListView(
        padding: EdgeInsets.fromLTRB(
          16,
          MediaQuery.of(context).padding.top + kToolbarHeight + 8,
          16,
          16,
        ),
        children: [
          _buildSection(
            title: 'Channels',
            description: 'Choose how you receive notifications',
            items: [
              _buildToggle(
                icon: Icons.notifications_active_outlined,
                label: 'Push Notifications',
                subtitle: 'Receive push notifications on your device',
                value: _pushEnabled,
                onChanged: (v) {
                  setState(() => _pushEnabled = v);
                  _setBool('notif_push', v);
                },
              ),
              _buildToggle(
                icon: Icons.email_outlined,
                label: 'Email Notifications',
                subtitle: 'Receive notifications via email',
                value: _emailEnabled,
                onChanged: (v) {
                  setState(() => _emailEnabled = v);
                  _setBool('notif_email', v);
                },
              ),
              _buildToggle(
                icon: Icons.phone_android_outlined,
                label: 'In-App Notifications',
                subtitle: 'Show notifications within the app',
                value: _inAppEnabled,
                onChanged: (v) {
                  setState(() => _inAppEnabled = v);
                  _setBool('notif_inapp', v);
                },
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildSection(
            title: 'Notification Types',
            description: 'Manage what you get notified about',
            items: [
              _buildToggle(
                icon: Icons.chat_outlined,
                label: 'New Messages',
                subtitle: 'When someone sends you a message',
                value: _newMessages,
                onChanged: (v) {
                  setState(() => _newMessages = v);
                  _setBool('notif_messages', v);
                },
              ),
              _buildToggle(
                icon: Icons.person_add_outlined,
                label: 'New Followers',
                subtitle: 'When someone follows your profile',
                value: _newFollowers,
                onChanged: (v) {
                  setState(() => _newFollowers = v);
                  _setBool('notif_followers', v);
                },
              ),
              _buildToggle(
                icon: Icons.sell_outlined,
                label: 'Listing Sold',
                subtitle: 'When one of your items is purchased',
                value: _listingSold,
                onChanged: (v) {
                  setState(() => _listingSold = v);
                  _setBool('notif_sold', v);
                },
              ),
              _buildToggle(
                icon: Icons.trending_down_outlined,
                label: 'Price Drops',
                subtitle: 'When an item you liked drops in price',
                value: _priceDrops,
                onChanged: (v) {
                  setState(() => _priceDrops = v);
                  _setBool('notif_price_drops', v);
                },
              ),
              _buildToggle(
                icon: Icons.local_offer_outlined,
                label: 'Promotions & Deals',
                subtitle: 'Special offers and promotional content',
                value: _promotions,
                onChanged: (v) {
                  setState(() => _promotions = v);
                  _setBool('notif_promotions', v);
                },
              ),
              _buildToggle(
                icon: Icons.campaign_outlined,
                label: 'Admin Announcements',
                subtitle: 'Important updates from the Campus Deal team',
                value: _adminAnnouncements,
                onChanged: (v) {
                  setState(() => _adminAnnouncements = v);
                  _setBool('notif_admin', v);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required String description,
    required List<Widget> items,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title,
            style: TextStyle(
              color: context.customText,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Text(
            description,
            style: TextStyle(
              color: context.customSecondaryText,
              fontSize: 12,
            ),
          ),
        ),
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              decoration: BoxDecoration(
                color: context.customSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: context.customBorder,
                ),
              ),
              child: Column(
                children: items.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;
                  return Column(
                    children: [
                      if (index > 0)
                        Divider(
                          height: 1,
                          color: context.customBorder,
                          indent: 16,
                          endIndent: 16,
                        ),
                      item,
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildToggle({
    required IconData icon,
    required String label,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: const Color(0xFF3B82F6), size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      color: context.customText,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: context.customSecondaryText,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SizedBox(
            height: 32,
            child: Switch.adaptive(
              value: value,
              onChanged: onChanged,
              activeTrackColor: const Color(0xFF3B82F6).withValues(alpha: 0.3),
            ),
          ),
        ],
      ),
    );
  }
}

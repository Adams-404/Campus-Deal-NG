import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../auth/auth_provider.dart';
import '../../../auth/onboarding_provider.dart';
import '../../../settings/presentation/pages/profile_screen.dart';
import '../../../settings/presentation/pages/change_password_screen.dart';
import '../../../settings/presentation/pages/my_listings_screen.dart';
import '../../../settings/presentation/pages/notifications_screen.dart';
import '../../../settings/presentation/pages/help_center_screen.dart';
import '../../../settings/presentation/pages/feedback_screen.dart';
import '../../../settings/presentation/pages/privacy_policy_screen.dart';
import '../../../settings/presentation/pages/about_screen.dart';
import '../../../../core/widgets/glass_skeleton.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/providers/theme_provider.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  Map<String, dynamic>? _profile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final supabase = ref.read(supabaseClientProvider);
      final user = supabase.auth.currentUser;
      if (user == null) {
        setState(() => _isLoading = false);
        return;
      }

      final response = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url, phone')
          .eq('id', user.id)
          .maybeSingle();

      setState(() {
        _profile = response;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _confirmSignOut() {
    showDialog(
      context: context,
      builder: (ctx) => _ConfirmSignOutDialog(ref: ref),
    );
  }

  void _navigateTo(Widget screen) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => screen),
    ).then((_) => _loadProfile()); // Refresh profile on return
  }

  IconData _getThemeIcon(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.light:
        return Icons.light_mode_outlined;
      case ThemeMode.dark:
        return Icons.dark_mode_outlined;
      case ThemeMode.system:
        return Icons.brightness_auto_outlined;
    }
  }

  String _getThemeLabel(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.light:
        return 'Theme: Light';
      case ThemeMode.dark:
        return 'Theme: Dark';
      case ThemeMode.system:
        return 'Theme: System';
    }
  }

  void _showThemeSelector(BuildContext context, WidgetRef ref, ThemeMode currentMode) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: context.customSurface.withOpacity(0.85),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border.all(color: context.customBorder),
          ),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: context.customSecondaryText.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Choose Theme',
                style: TextStyle(
                  color: context.customText,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              _buildThemeOption(ctx, ref, ThemeMode.light, 'Light Mode', Icons.light_mode, currentMode),
              const SizedBox(height: 8),
              _buildThemeOption(ctx, ref, ThemeMode.dark, 'Dark Mode', Icons.dark_mode, currentMode),
              const SizedBox(height: 8),
              _buildThemeOption(ctx, ref, ThemeMode.system, 'System Default', Icons.brightness_auto, currentMode),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThemeOption(
    BuildContext context,
    WidgetRef ref,
    ThemeMode mode,
    String label,
    IconData icon,
    ThemeMode currentMode,
  ) {
    final isSelected = mode == currentMode;
    return InkWell(
      onTap: () {
        ref.read(themeProvider.notifier).setThemeMode(mode);
        Navigator.pop(context);
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected 
              ? Colors.blue.withOpacity(0.12)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected 
                ? Colors.blue.withOpacity(0.3)
                : Colors.transparent,
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.blue : context.customSecondaryText,
              size: 20,
            ),
            const SizedBox(width: 14),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.blue : context.customText,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                fontSize: 15,
              ),
            ),
            const Spacer(),
            if (isSelected)
              const Icon(
                Icons.check_circle,
                color: Colors.blue,
                size: 20,
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final supabase = ref.watch(supabaseClientProvider);
    final user = supabase.auth.currentUser;
    final firstName = _profile?['first_name'] as String? ?? '';
    final lastName = _profile?['last_name'] as String? ?? '';
    final fullName = '$firstName $lastName'.trim();
    final avatarUrl = _profile?['avatar_url'] as String?;
    final displayName = fullName.isNotEmpty
        ? fullName
        : (user?.email ?? 'User');
    final avatarLetter = displayName.isNotEmpty
        ? displayName[0].toUpperCase()
        : 'U';
    final themeMode = ref.watch(themeProvider);

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
            flexibleSpace: ShaderMask(
              shaderCallback: (rect) {
                return LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: const [
                    Colors.black,
                    Colors.black87,
                    Colors.transparent,
                  ],
                  stops: const [0.0, 0.6, 1.0],
                ).createShader(rect);
              },
              blendMode: BlendMode.dstIn,
              child: ClipRect(
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          context.customText.withOpacity(0.08),
                          context.customText.withOpacity(0.0),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            centerTitle: true,
          ),
          if (_isLoading)
            SliverFillRemaining(
              child: GlassShimmer(
                child: SingleChildScrollView(
                  child: Column(
                    children: List.generate(
                      5,
                      (_) => const GlassSkeletonListTile(
                        hasAvatar: false,
                        hasTrailing: true,
                      ),
                    ),
                  ),
                ),
              ),
            )
          else
            SliverList(
              delegate: SliverChildListDelegate([
                // Profile header
                if (user != null)
                  _buildProfileHeader(
                    displayName: displayName,
                    email: user.email ?? '',
                    avatarUrl: avatarUrl,
                    avatarLetter: avatarLetter,
                  ),

                const SizedBox(height: 8),

                // Account section
                _buildSection(
                  title: 'Account',
                  items: [
                    _SettingsItem(
                      icon: Icons.lock_outline,
                      label: 'Change Password',
                      iconBg: Colors.orange.withOpacity(0.15),
                      iconColor: Colors.orange,
                      onTap: () => _navigateTo(const ChangePasswordScreen()),
                    ),
                    _SettingsItem(
                      icon: Icons.receipt_long_outlined,
                      label: 'My Listings',
                      iconBg: Colors.green.withOpacity(0.15),
                      iconColor: Colors.green,
                      onTap: () => _navigateTo(const MyListingsScreen()),
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                // Preferences
                _buildSection(
                  title: 'Preferences',
                  items: [
                    _SettingsItem(
                      icon: Icons.notifications_outlined,
                      label: 'Notifications',
                      iconBg: Colors.pink.withOpacity(0.15),
                      iconColor: Colors.pink,
                      onTap: () => _navigateTo(const NotificationsScreen()),
                    ),
                    _SettingsItem(
                      icon: _getThemeIcon(themeMode),
                      label: _getThemeLabel(themeMode),
                      iconBg: Colors.blue.withOpacity(0.15),
                      iconColor: Colors.blue,
                      onTap: () => _showThemeSelector(context, ref, themeMode),
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                // Support
                _buildSection(
                  title: 'Support & About',
                  items: [
                    _SettingsItem(
                      icon: Icons.help_outline,
                      label: 'Help Center',
                      iconBg: Colors.teal.withOpacity(0.15),
                      iconColor: Colors.teal,
                      onTap: () => _navigateTo(const HelpCenterScreen()),
                    ),
                    _SettingsItem(
                      icon: Icons.feedback_outlined,
                      label: 'Send Feedback',
                      iconBg: Colors.purple.withOpacity(0.15),
                      iconColor: Colors.purple,
                      onTap: () => _navigateTo(const FeedbackScreen()),
                    ),
                    _SettingsItem(
                      icon: Icons.privacy_tip_outlined,
                      label: 'Privacy Policy',
                      iconBg: Colors.yellow.withOpacity(0.15),
                      iconColor: Colors.yellow,
                      onTap: () => _navigateTo(const PrivacyPolicyScreen()),
                    ),
                    _SettingsItem(
                      icon: Icons.info_outline,
                      label: 'About Campus Deal',
                      iconBg: Colors.cyan.withOpacity(0.15),
                      iconColor: Colors.cyan,
                      onTap: () => _navigateTo(const AboutScreen()),
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                // Sign Out
                if (user != null) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: GestureDetector(
                      onTap: _confirmSignOut,
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: Colors.red.withOpacity(0.2),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.red.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.logout,
                                color: Colors.red,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 14),
                            const Text(
                              'Sign Out',
                              style: TextStyle(
                                color: Colors.red,
                                fontWeight: FontWeight.w600,
                                fontSize: 15,
                              ),
                            ),
                            const Spacer(),
                            const Icon(
                              Icons.chevron_right,
                              color: Colors.red,
                              size: 20,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],

                // Version
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      'Campus Deal v1.0.0',
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ),
                ),

                const SizedBox(height: 80),
              ]),
            ),
        ],
      ),
    );
  }

  Widget _buildProfileHeader({
    required String displayName,
    required String email,
    String? avatarUrl,
    required String avatarLetter,
  }) {
    return GestureDetector(
      onTap: () => _navigateTo(const ProfileScreen()),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: context.customSurface.withOpacity(0.4),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: context.customBorder),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: context.isDarkMode ? Colors.white.withOpacity(0.2) : Colors.black.withOpacity(0.1),
                backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty
                    ? CachedNetworkImageProvider(avatarUrl)
                    : null,
                child: avatarUrl == null || avatarUrl.isEmpty
                    ? Text(
                        avatarLetter,
                        style: TextStyle(
                          color: context.customText,
                          fontWeight: FontWeight.bold,
                          fontSize: 24,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayName,
                      style: TextStyle(
                        color: context.customText,
                        fontWeight: FontWeight.bold,
                        fontSize: 17,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      email,
                      style: TextStyle(color: context.customSecondaryText, fontSize: 13),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: context.customSecondaryText, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required List<_SettingsItem> items,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 0, 0, 10),
            child: Text(
              title.toUpperCase(),
              style: TextStyle(
                color: context.customSecondaryText,
                fontSize: 11,
                fontWeight: FontWeight.w600,
                letterSpacing: 1.2,
              ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: context.customSurface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: context.customBorder),
            ),
            child: Column(
              children: items.asMap().entries.map((entry) {
                final isLast = entry.key == items.length - 1;
                return Column(
                  children: [
                    _buildSettingsTile(entry.value),
                    if (!isLast)
                      Divider(
                        height: 1,
                        color: context.customBorder,
                        indent: 56,
                        endIndent: 0,
                      ),
                  ],
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsTile(_SettingsItem item) {
    return InkWell(
      onTap: item.onTap,
      borderRadius: BorderRadius.circular(14),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: item.iconBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(item.icon, color: item.iconColor, size: 18),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                item.label,
                style: TextStyle(color: context.customText, fontSize: 15),
              ),
            ),
            Icon(Icons.chevron_right, color: context.customSecondaryText, size: 20),
          ],
        ),
      ),
    );
  }

  void _showAboutDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: context.customSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: context.isDarkMode ? Colors.white.withOpacity(0.15) : Colors.black.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.storefront,
                color: context.customText,
                size: 36,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Campus Deal',
              style: TextStyle(
                color: context.customText,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Version 1.0.0',
              style: TextStyle(color: context.customSecondaryText, fontSize: 14),
            ),
            const SizedBox(height: 12),
            Text(
              'The student marketplace for Nigerian campuses. Buy and sell anything, find gigs, and connect with your campus community.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: context.customSecondaryText,
                fontSize: 13,
                height: 1.5,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Close', style: TextStyle(color: context.customText)),
          ),
        ],
      ),
    );
  }
}

class _SettingsItem {
  final IconData icon;
  final String label;
  final Color iconBg;
  final Color iconColor;
  final VoidCallback onTap;

  const _SettingsItem({
    required this.icon,
    required this.label,
    required this.iconBg,
    required this.iconColor,
    required this.onTap,
  });
}

class _ConfirmSignOutDialog extends StatelessWidget {
  final WidgetRef ref;
  const _ConfirmSignOutDialog({required this.ref});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: context.customSurface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Text(
        'Sign Out',
        style: TextStyle(color: context.customText, fontWeight: FontWeight.bold),
      ),
      content: Text(
        'Are you sure you want to sign out? You will need to sign in again to access your account.',
        style: TextStyle(color: context.customSecondaryText),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('Cancel', style: TextStyle(color: context.customSecondaryText)),
        ),
        TextButton(
          onPressed: () async {
            Navigator.pop(context);
            // Reset onboarding state so they can test the landing screen again!
            final prefs = await SharedPreferences.getInstance();
            await prefs.setBool('has_seen_onboarding', false);
            ref.invalidate(onboardingProvider);
            await Supabase.instance.client.auth.signOut();
          },
          child: const Text(
            'Sign Out',
            style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
}

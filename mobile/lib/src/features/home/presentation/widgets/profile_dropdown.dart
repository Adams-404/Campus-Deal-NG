import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:campus_deal_mobile/src/features/auth/onboarding_provider.dart';
import 'package:campus_deal_mobile/src/features/settings/presentation/pages/profile_screen.dart';

import 'package:campus_deal_mobile/src/core/theme/app_theme.dart';

class ProfileDropdown extends ConsumerWidget {
  final Map<String, dynamic>? profileData;

  const ProfileDropdown({super.key, this.profileData});

  static void show(BuildContext context, WidgetRef ref, {Map<String, dynamic>? profileData}) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Profile Menu Dismiss',
      barrierColor: Colors.black.withValues(alpha: 0.55),
      transitionDuration: const Duration(milliseconds: 320),
      pageBuilder: (ctx, anim1, anim2) {
        return _ProfileDropdownPanel(
          profileData: profileData,
          onClose: () => Navigator.of(ctx).pop(),
          ref: ref,
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
  Widget build(BuildContext context, WidgetRef ref) {
    return const SizedBox.shrink();
  }
}

class _ProfileDropdownPanel extends StatelessWidget {
  final Map<String, dynamic>? profileData;
  final VoidCallback onClose;
  final WidgetRef ref;

  const _ProfileDropdownPanel({
    required this.profileData,
    required this.onClose,
    required this.ref,
  });

  void _navigate(BuildContext context, Widget screen) {
    Navigator.of(context).pop();
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  Future<void> _signOut(BuildContext context) async {
    Navigator.of(context).pop();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: context.customSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Sign Out',
          style: TextStyle(color: context.customText, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Are you sure you want to sign out?',
          style: TextStyle(color: context.customSecondaryText),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Cancel', style: TextStyle(color: context.customSecondaryText)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Sign Out',
              style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('has_seen_onboarding', false);
      ref.invalidate(onboardingProvider);
      await Supabase.instance.client.auth.signOut();
    }
  }

  @override
  Widget build(BuildContext context) {
    final firstName = profileData?['first_name'] as String? ?? '';
    final lastName = profileData?['last_name'] as String? ?? '';
    final fullName = '$firstName $lastName'.trim();
    final avatarUrl = profileData?['avatar_url'] as String?;
    final avatarLetter = fullName.isNotEmpty ? fullName[0].toUpperCase() : '?';

    return GestureDetector(
      onTap: onClose,
      child: Material(
        color: Colors.transparent,
        child: Stack(
          children: [
            Positioned(
              top: 75 + MediaQuery.of(context).padding.top,
              right: 16,
              width: 220,
              child: GestureDetector(
                onTap: () {},
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            context.customText.withValues(alpha: 0.08),
                            context.customText.withValues(alpha: 0.02),
                          ],
                        ),
                        color: context.isDarkMode
                            ? Colors.transparent
                            : Colors.white.withValues(alpha: 0.45),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: context.customBorder.withValues(alpha: 0.5),
                          width: 1.2,
                        ),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // User info header
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                            child: Row(
                              children: [
                                ClipOval(
                                  child: Container(
                                    width: 36,
                                    height: 36,
                                    color: const Color(0xFF3B82F6).withValues(alpha: 0.2),
                                    child: avatarUrl != null && avatarUrl.isNotEmpty
                                        ? Image.network(avatarUrl, fit: BoxFit.cover)
                                        : Center(
                                            child: Text(
                                              avatarLetter,
                                              style: TextStyle(
                                                color: context.customText,
                                                fontSize: 14,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        fullName.isNotEmpty ? fullName : 'User',
                                        style: TextStyle(
                                          color: context.customText,
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 1),
                                      Text(
                                        'View Profile',
                                        style: TextStyle(
                                          color: const Color(0xFF3B82F6),
                                          fontSize: 10,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Divider(color: context.customBorder, height: 1),

                          // Menu items
                          _buildMenuItem(
                            context,
                            icon: Icons.person_outline,
                            label: 'Profile',
                            onTap: () => _navigate(context, const ProfileScreen()),
                          ),
                          Divider(color: context.customBorder, height: 1),
                          _buildMenuItem(
                            context,
                            icon: Icons.logout,
                            label: 'Sign Out',
                            color: Colors.red,
                            onTap: () => _signOut(context),
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

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color? color,
  }) {
    final effectiveColor = color ?? context.customText;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, color: effectiveColor, size: 18),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                color: effectiveColor,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

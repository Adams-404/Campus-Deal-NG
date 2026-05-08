import 'package:flutter/material.dart';
import 'dart:ui';

/// Apple-style Liquid Glass app bar.
///
/// Key characteristics matching iOS 26 Liquid Glass:
/// - Heavy backdrop blur that picks up content colors underneath
/// - NO hard borders or separator lines
/// - Subtle specular highlight gradient (top-lit effect)
/// - Content floats above with depth, bar feels like real glass
/// - Seamless fade into the background
class GlassAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final VoidCallback? onBack;

  const GlassAppBar({
    super.key,
    required this.title,
    this.actions,
    this.onBack,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 40, sigmaY: 40),
        child: Container(
          decoration: BoxDecoration(
            // Subtle tinted fill — no borders, no separators
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.white.withValues(alpha: 0.08),
                Colors.white.withValues(alpha: 0.03),
              ],
            ),
          ),
          child: SafeArea(
            bottom: false,
            child: SizedBox(
              height: kToolbarHeight,
              child: Row(
                children: [
                  const SizedBox(width: 12),
                  // Liquid Glass back button
                  _GlassBackButton(onTap: onBack ?? () => Navigator.pop(context)),

                  // Centered title
                  Expanded(
                    child: Text(
                      title,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ),

                  // Actions or spacer to balance
                  if (actions != null && actions!.isNotEmpty)
                    Row(mainAxisSize: MainAxisSize.min, children: actions!)
                  else
                    const SizedBox(width: 50),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Liquid Glass circular back button — matches iOS 26 style.
/// Subtle frosted circle with specular highlight, no hard border.
class _GlassBackButton extends StatelessWidget {
  final VoidCallback onTap;
  const _GlassBackButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: ClipOval(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              // Subtle glass fill with specular highlight
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white.withValues(alpha: 0.18),
                  Colors.white.withValues(alpha: 0.06),
                ],
              ),
            ),
            child: const Center(
              child: Icon(
                Icons.arrow_back_ios_new,
                color: Colors.white,
                size: 16,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

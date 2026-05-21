import 'dart:ui';
import 'package:flutter/material.dart';

/// Specular Liquid Glass Shimmer effect driven by ShaderMask.
/// Performs a diagonal reflection sweep across the child widget.
class GlassShimmer extends StatefulWidget {
  final Widget child;
  final bool enabled;

  const GlassShimmer({
    super.key,
    required this.child,
    this.enabled = true,
  });

  @override
  State<GlassShimmer> createState() => _GlassShimmerState();
}

class _GlassShimmerState extends State<GlassShimmer>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1800),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.enabled) return widget.child;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Colors.transparent,
                Colors.white.withOpacity(0.03),
                Colors.white.withOpacity(0.25),
                Colors.white.withOpacity(0.03),
                Colors.transparent,
              ],
              stops: const [0.0, 0.35, 0.5, 0.65, 1.0],
              transform: _SlidingGradientTransform(slidePercent: _controller.value),
            ).createShader(bounds);
          },
          child: widget.child,
        );
      },
      child: widget.child,
    );
  }
}

class _SlidingGradientTransform extends GradientTransform {
  final double slidePercent;

  const _SlidingGradientTransform({required this.slidePercent});

  @override
  Matrix4? transform(Rect bounds, {TextDirection? textDirection}) {
    final double translation = -bounds.width + (slidePercent * bounds.width * 2.0);
    return Matrix4.translationValues(translation, 0.0, 0.0);
  }
}

/// Standard liquid glass base skeleton block.
class GlassSkeletonBlock extends StatelessWidget {
  final double? width;
  final double height;
  final double borderRadius;
  final EdgeInsetsGeometry? margin;

  const GlassSkeletonBlock({
    super.key,
    this.width,
    required this.height,
    this.borderRadius = 8,
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.06),
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: Colors.white.withOpacity(0.08),
          width: 1,
        ),
      ),
    );
  }
}

/// Mock product item card matching ProductCard layout.
class GlassSkeletonCard extends StatelessWidget {
  final bool isFeatured;

  const GlassSkeletonCard({super.key, this.isFeatured = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: isFeatured ? double.infinity : 160,
      decoration: BoxDecoration(
        color: const Color(0xFF171717),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image area
          GlassSkeletonBlock(
            height: isFeatured ? 200 : 120,
            borderRadius: 16,
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title line
                const GlassSkeletonBlock(height: 14, width: 100),
                const SizedBox(height: 6),
                // Price line
                const GlassSkeletonBlock(height: 16, width: 60),
                const SizedBox(height: 10),
                // Author info
                Row(
                  children: [
                    Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.06),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withOpacity(0.08)),
                      ),
                    ),
                    const SizedBox(width: 6),
                    const GlassSkeletonBlock(height: 10, width: 40),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Mock Gig item card matching GigCard layout.
class GlassSkeletonGigCard extends StatelessWidget {
  const GlassSkeletonGigCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Colors.white.withOpacity(0.03),
        border: Border.all(
          color: Colors.white.withOpacity(0.08),
          width: 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const GlassSkeletonBlock(height: 20, width: 80, borderRadius: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const GlassSkeletonBlock(height: 18, width: 70),
                    const SizedBox(height: 4),
                    const GlassSkeletonBlock(height: 10, width: 50),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Title
            const GlassSkeletonBlock(height: 16, width: double.infinity),
            const SizedBox(height: 8),
            const GlassSkeletonBlock(height: 16, width: 180),
            const SizedBox(height: 12),
            // Mock image
            const GlassSkeletonBlock(height: 160, width: double.infinity, borderRadius: 12),
            const SizedBox(height: 12),
            // Description lines
            const GlassSkeletonBlock(height: 12, width: double.infinity),
            const SizedBox(height: 6),
            const GlassSkeletonBlock(height: 12, width: double.infinity),
            const SizedBox(height: 16),
            Divider(color: Colors.white.withOpacity(0.1), height: 1),
            const SizedBox(height: 16),
            // Bottom user row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.06),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withOpacity(0.08)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const GlassSkeletonBlock(height: 13, width: 80),
                  ],
                ),
                const GlassSkeletonBlock(height: 28, width: 80, borderRadius: 20),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Generic horizontal list tile for messages, notifications, settings, etc.
class GlassSkeletonListTile extends StatelessWidget {
  final bool hasAvatar;
  final bool hasTrailing;

  const GlassSkeletonListTile({
    super.key,
    this.hasAvatar = true,
    this.hasTrailing = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Colors.white.withOpacity(0.05),
          ),
        ),
      ),
      child: Row(
        children: [
          if (hasAvatar) ...[
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.06),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
            ),
            const SizedBox(width: 14),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const GlassSkeletonBlock(height: 14, width: 110),
                    if (hasTrailing) const GlassSkeletonBlock(height: 11, width: 40),
                  ],
                ),
                const SizedBox(height: 6),
                const GlassSkeletonBlock(height: 11, width: 70),
                const SizedBox(height: 6),
                const GlassSkeletonBlock(height: 13, width: 190),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Screen-wide page skeleton loader details.
class GlassSkeletonDetails extends StatelessWidget {
  const GlassSkeletonDetails({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Aspect Ratio Image Cover Placeholder
          const GlassSkeletonBlock(
            height: 300,
            width: double.infinity,
            borderRadius: 0,
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const GlassSkeletonBlock(height: 22, width: 220),
                const SizedBox(height: 12),
                const GlassSkeletonBlock(height: 24, width: 100),
                const SizedBox(height: 16),
                Divider(color: Colors.white.withOpacity(0.08)),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.06),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withOpacity(0.08)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const GlassSkeletonBlock(height: 14, width: 120),
                        const SizedBox(height: 6),
                        const GlassSkeletonBlock(height: 10, width: 60),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Divider(color: Colors.white.withOpacity(0.08)),
                const SizedBox(height: 16),
                const GlassSkeletonBlock(height: 14, width: 100),
                const SizedBox(height: 12),
                const GlassSkeletonBlock(height: 12, width: double.infinity),
                const SizedBox(height: 6),
                const GlassSkeletonBlock(height: 12, width: double.infinity),
                const SizedBox(height: 6),
                const GlassSkeletonBlock(height: 12, width: 200),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Profile-level screen skeleton placeholder.
class GlassSkeletonProfile extends StatelessWidget {
  const GlassSkeletonProfile({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            height: 180,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.03),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Positioned(
                  bottom: 16,
                  child: Column(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.06),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white.withOpacity(0.12), width: 2),
                        ),
                      ),
                      const SizedBox(height: 12),
                      const GlassSkeletonBlock(height: 14, width: 120),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.03),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const GlassSkeletonBlock(height: 14, width: 100),
                const SizedBox(height: 16),
                const GlassSkeletonBlock(height: 12, width: double.infinity),
                const SizedBox(height: 10),
                const GlassSkeletonBlock(height: 12, width: 250),
                const SizedBox(height: 10),
                const GlassSkeletonBlock(height: 12, width: 180),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// A pulsing scale icon widget used when an action (e.g. favorite save) is in progress.
class GlassPulseIcon extends StatefulWidget {
  final IconData icon;
  final Color color;
  final double size;

  const GlassPulseIcon({
    super.key,
    required this.icon,
    required this.color,
    this.size = 24,
  });

  @override
  State<GlassPulseIcon> createState() => _GlassPulseIconState();
}

class _GlassPulseIconState extends State<GlassPulseIcon>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    )..repeat(reverse: true);
    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: Icon(
        widget.icon,
        color: widget.color,
        size: widget.size,
      ),
    );
  }
}

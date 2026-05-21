import 'package:flutter/material.dart';
import 'dart:ui';
import 'dart:math' as math;
import 'package:flutter_svg/flutter_svg.dart';

class LiquidGlassBackground extends StatefulWidget {
  final Widget child;

  const LiquidGlassBackground({
    super.key,
    required this.child,
  });

  @override
  State<LiquidGlassBackground> createState() => _LiquidGlassBackgroundState();
}

class _LiquidGlassBackgroundState extends State<LiquidGlassBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 15),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  // A sleek SVG dotted matrix grid pattern matching modern design systems
  static const String _svgGridPattern = '''
<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.2" fill="white" fill-opacity="0.04" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#dot-grid)" />
</svg>
''';

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: const Color(0xFF07070A),
      body: Stack(
        children: [
          // 1. Drifting glowing spheres (Mesh Gradient components)
          AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              final angle = _controller.value * 2 * math.pi;

              // Orbiting calculations for natural organic motion
              final double x1 = math.sin(angle) * 60;
              final double y1 = math.cos(angle) * 80;

              final double x2 = math.cos(angle + math.pi / 2) * 80;
              final double y2 = math.sin(angle + math.pi / 2) * 50;

              final double x3 = math.sin(angle + math.pi) * 50;
              final double y3 = math.cos(angle + math.pi) * 60;

              return Stack(
                children: [
                  // Blue Glow Sphere (Top Left area)
                  Positioned(
                    top: (size.height * 0.1) + y1,
                    left: (size.width * 0.1) + x1,
                    child: Container(
                      width: size.width * 0.75,
                      height: size.width * 0.75,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFF3B82F6).withValues(alpha: 0.28),
                      ),
                    ),
                  ),
                  // Indigo/Violet Glow Sphere (Bottom Right area)
                  Positioned(
                    bottom: (size.height * 0.15) + y2,
                    right: (size.width * 0.05) + x2,
                    child: Container(
                      width: size.width * 0.8,
                      height: size.width * 0.8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFF6366F1).withValues(alpha: 0.22),
                      ),
                    ),
                  ),
                  // Pink/Purple Glow Sphere (Center-Right/Top area)
                  Positioned(
                    top: (size.height * 0.4) + y3,
                    right: (size.width * 0.15) + x3,
                    child: Container(
                      width: size.width * 0.6,
                      height: size.width * 0.6,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFFD946EF).withValues(alpha: 0.14),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),

          // 2. Liquid heavy blur overlay to melt spheres into a mesh gradient
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 75, sigmaY: 75),
              child: Container(
                color: Colors.transparent,
              ),
            ),
          ),

          // 3. Subtle Dark Vignette for contrast & text legibility
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.4),
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.6),
                  ],
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
            ),
          ),

          // 4. Tech/Geometric SVG dot grid pattern overlay
          Positioned.fill(
            child: SvgPicture.string(
              _svgGridPattern,
              fit: BoxFit.cover,
            ),
          ),

          // 5. Main content layers
          Positioned.fill(
            child: widget.child,
          ),
        ],
      ),
    );
  }
}

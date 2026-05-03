import 'package:flutter/material.dart';
import 'dart:ui';

class StatusBarBlur extends StatelessWidget {
  const StatusBarBlur({super.key});

  @override
  Widget build(BuildContext context) {
    final statusBarHeight = MediaQuery.of(context).padding.top;
    
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      // Increased height for a more natural fade-out
      height: statusBarHeight + 80, 
      child: IgnorePointer(
        child: ShaderMask(
          shaderCallback: (rect) {
            return LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withOpacity(0.85),
                Colors.black.withOpacity(0.5),
                Colors.black.withOpacity(0.0),
              ],
              stops: const [0.0, 0.4, 1.0],
            ).createShader(rect);
          },
          blendMode: BlendMode.dstIn,
          child: ClipRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
              child: Container(
                // Base tint to anchor the status bar
                color: Colors.black.withOpacity(0.3),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

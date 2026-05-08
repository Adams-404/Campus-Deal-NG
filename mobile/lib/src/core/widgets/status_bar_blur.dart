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
      height: statusBarHeight + 56,
      child: IgnorePointer(
        child: ShaderMask(
          shaderCallback: (rect) {
            return LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withOpacity(1.0),
                Colors.black.withOpacity(0.9),
                Colors.black.withOpacity(0.0),
              ],
              stops: const [0.0, 0.5, 1.0],
            ).createShader(rect);
          },
          blendMode: BlendMode.dstIn,
          child: ClipRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 40, sigmaY: 40),
              child: Container(
                color: Colors.black.withOpacity(0.45),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

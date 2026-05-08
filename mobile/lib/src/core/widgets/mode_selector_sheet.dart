import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../providers/app_mode_provider.dart';

/// A premium bottom sheet that displays all app modes in a responsive grid.
/// Uses glass morphism styling consistent with the app's liquid glass design.
class ModeSelectorSheet extends ConsumerStatefulWidget {
  const ModeSelectorSheet({super.key});

  @override
  ConsumerState<ModeSelectorSheet> createState() => _ModeSelectorSheetState();

  /// Show the mode selector as a modal bottom sheet.
  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      barrierColor: Colors.black.withOpacity(0.6),
      builder: (_) => const ModeSelectorSheet(),
    );
  }
}

class _ModeSelectorSheetState extends ConsumerState<ModeSelectorSheet>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _scaleAnim = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutBack,
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentMode = ref.watch(appModeProvider);
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return AnimatedBuilder(
      animation: _scaleAnim,
      builder: (context, child) {
        return Transform.scale(
          scale: 0.9 + (_scaleAnim.value * 0.1),
          alignment: Alignment.bottomCenter,
          child: Opacity(
            opacity: _scaleAnim.value.clamp(0.0, 1.0),
            child: child,
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Colors.white.withOpacity(0.12),
                    Colors.white.withOpacity(0.04),
                  ],
                ),
                borderRadius: BorderRadius.circular(28),
                border: Border.all(
                  color: Colors.white.withOpacity(0.15),
                  width: 1.2,
                ),
              ),
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 20, 20, 16 + bottomPadding),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Handle bar
                    Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Title
                    Row(
                      children: [
                        const FaIcon(
                          FontAwesomeIcons.compass,
                          color: Colors.white70,
                          size: 16,
                        ),
                        const SizedBox(width: 10),
                        const Text(
                          'Switch Mode',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.3,
                          ),
                        ),
                        const Spacer(),
                        // Current mode badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: getModeInfo(currentMode)
                                .color
                                .withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: getModeInfo(currentMode)
                                  .color
                                  .withOpacity(0.3),
                            ),
                          ),
                          child: Text(
                            getModeInfo(currentMode).label,
                            style: TextStyle(
                              color: getModeInfo(currentMode).color,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Explore different sections of Campus Deal',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.4),
                        fontSize: 13,
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Mode grid
                    _buildModeGrid(currentMode),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildModeGrid(AppMode currentMode) {
    // 2 columns layout for better touch targets on mobile
    final rows = <Widget>[];
    for (var i = 0; i < appModes.length; i += 2) {
      final row = Row(
        children: [
          Expanded(child: _buildModeCard(appModes[i], currentMode)),
          const SizedBox(width: 10),
          if (i + 1 < appModes.length)
            Expanded(child: _buildModeCard(appModes[i + 1], currentMode))
          else
            const Expanded(child: SizedBox()),
        ],
      );
      rows.add(row);
      if (i + 2 < appModes.length) rows.add(const SizedBox(height: 10));
    }
    return Column(children: rows);
  }

  Widget _buildModeCard(AppModeInfo modeInfo, AppMode currentMode) {
    final isActive = modeInfo.mode == currentMode;
    final isLocked = !modeInfo.available;

    return GestureDetector(
      onTap: isLocked
          ? () {
              HapticFeedback.lightImpact();
              _showComingSoonSnack(modeInfo.label);
            }
          : () {
              HapticFeedback.mediumImpact();
              ref.read(appModeProvider.notifier).setMode(modeInfo.mode);
              Navigator.pop(context);
            },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        decoration: BoxDecoration(
          color: isActive
              ? modeInfo.color.withOpacity(0.12)
              : isLocked
                  ? Colors.white.withOpacity(0.02)
                  : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isActive
                ? modeInfo.color.withOpacity(0.4)
                : Colors.white.withOpacity(isLocked ? 0.05 : 0.1),
            width: isActive ? 1.5 : 1.0,
          ),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: modeInfo.color.withOpacity(0.15),
                    blurRadius: 12,
                    spreadRadius: 0,
                  ),
                ]
              : null,
        ),
        child: Row(
          children: [
            // Icon container
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isActive
                    ? modeInfo.color.withOpacity(0.2)
                    : modeInfo.color.withOpacity(isLocked ? 0.05 : 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: FaIcon(
                  modeInfo.icon,
                  size: 16,
                  color: isLocked
                      ? Colors.white.withOpacity(0.25)
                      : isActive
                          ? modeInfo.color
                          : modeInfo.color.withOpacity(0.7),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Label and description
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          modeInfo.label,
                          style: TextStyle(
                            color: isLocked
                                ? Colors.white.withOpacity(0.3)
                                : Colors.white,
                            fontSize: 13,
                            fontWeight:
                                isActive ? FontWeight.w700 : FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isLocked) ...[
                        const SizedBox(width: 4),
                        FaIcon(
                          FontAwesomeIcons.lock,
                          size: 9,
                          color: Colors.white.withOpacity(0.25),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    isLocked ? 'Coming soon' : modeInfo.description,
                    style: TextStyle(
                      color: Colors.white.withOpacity(isLocked ? 0.2 : 0.4),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            // Active indicator
            if (isActive)
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: modeInfo.color,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: modeInfo.color.withOpacity(0.5),
                      blurRadius: 6,
                      spreadRadius: 1,
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showComingSoonSnack(String modeName) {
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const FaIcon(FontAwesomeIcons.lock, size: 14, color: Colors.white70),
            const SizedBox(width: 10),
            Text(
              '$modeName is coming soon!',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF1F1F1F),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 2),
      ),
    );
  }
}

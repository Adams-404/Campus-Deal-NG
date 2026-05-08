import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../providers/app_mode_provider.dart';
import 'mode_selector_sheet.dart';

/// A compact, animated pill widget that displays the current app mode.
///
/// Tapping it opens the [ModeSelectorSheet] bottom sheet.
/// Matches the liquid glass design language used throughout the app.
class ModeSwitcherPill extends ConsumerStatefulWidget {
  /// If true, shows only the icon (no label). Good for tight layouts.
  final bool compact;

  const ModeSwitcherPill({super.key, this.compact = false});

  @override
  ConsumerState<ModeSwitcherPill> createState() => _ModeSwitcherPillState();
}

class _ModeSwitcherPillState extends ConsumerState<ModeSwitcherPill>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentMode = ref.watch(appModeProvider);
    final modeInfo = getModeInfo(currentMode);

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        ModeSelectorSheet.show(context);
      },
      child: AnimatedBuilder(
        animation: _pulseAnim,
        builder: (context, child) {
          return ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 350),
                curve: Curves.easeOut,
                height: 40,
                padding: EdgeInsets.symmetric(
                  horizontal: widget.compact ? 0 : 12,
                ),
                constraints: BoxConstraints(
                  minWidth: 40,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      modeInfo.color.withOpacity(0.12 + (_pulseAnim.value * 0.04)),
                      modeInfo.color.withOpacity(0.04),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: modeInfo.color.withOpacity(0.25 + (_pulseAnim.value * 0.1)),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: modeInfo.color.withOpacity(0.1 + (_pulseAnim.value * 0.05)),
                      blurRadius: 8,
                      spreadRadius: 0,
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    FaIcon(
                      modeInfo.icon,
                      size: 14,
                      color: modeInfo.color,
                    ),
                    if (!widget.compact) ...[
                      const SizedBox(width: 7),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 250),
                        transitionBuilder: (child, anim) {
                          return FadeTransition(
                            opacity: anim,
                            child: SlideTransition(
                              position: Tween<Offset>(
                                begin: const Offset(0, 0.3),
                                end: Offset.zero,
                              ).animate(anim),
                              child: child,
                            ),
                          );
                        },
                        child: Text(
                          modeInfo.label,
                          key: ValueKey(modeInfo.label),
                          style: TextStyle(
                            color: modeInfo.color,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      FaIcon(
                        FontAwesomeIcons.chevronDown,
                        size: 8,
                        color: modeInfo.color.withOpacity(0.6),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

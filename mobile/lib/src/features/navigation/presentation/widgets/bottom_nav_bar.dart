import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../../core/providers/app_mode_provider.dart';

class BottomNavBar extends ConsumerWidget {
  final int currentIndex;
  final Function(int) onTap;
  final VoidCallback onSellTap;

  const BottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.onSellTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accentColor = Theme.of(context).colorScheme.secondary;
    final currentMode = ref.watch(appModeProvider);
    final modeInfo = getModeInfo(currentMode);

    // Determine nav items and center action based on mode
    final navConfig = _getNavConfig(currentMode);
    
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.bottomCenter,
        children: [
          // Glass Bar Dock
          ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
              child: Container(
                height: 72,
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
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.4),
                      blurRadius: 25,
                      spreadRadius: -5,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildNavItem(context, navConfig.items[0]),
                    _buildNavItem(context, navConfig.items[1]),
                    const SizedBox(width: 54), // Space for center button
                    _buildNavItem(context, navConfig.items[2]),
                    _buildNavItem(context, navConfig.items[3]),
                  ],
                ),
              ),
            ),
          ),
          
          // Floating Center Button (color adapts to mode)
          Positioned(
            top: -24,
            child: _buildCenterButton(modeInfo, navConfig.centerLabel),
          ),
        ],
      ),
    );
  }

  _NavConfig _getNavConfig(AppMode mode) {
    switch (mode) {
      case AppMode.marketplace:
        return _NavConfig(
          items: [
            _NavItemData(index: 0, icon: FontAwesomeIcons.house, label: 'Home'),
            _NavItemData(index: 1, icon: FontAwesomeIcons.heart, label: 'Saved'),
            _NavItemData(index: 3, icon: FontAwesomeIcons.comment, label: 'Messages'),
            _NavItemData(index: 4, icon: FontAwesomeIcons.gear, label: 'Settings'),
          ],
          centerLabel: 'Sell',
        );
      case AppMode.gigs:
        return _NavConfig(
          items: [
            _NavItemData(index: 0, icon: FontAwesomeIcons.magnifyingGlass, label: 'Browse'),
            _NavItemData(index: 1, icon: FontAwesomeIcons.briefcase, label: 'My Gigs'),
            _NavItemData(index: 3, icon: FontAwesomeIcons.comment, label: 'Messages'),
            _NavItemData(index: 4, icon: FontAwesomeIcons.gear, label: 'Settings'),
          ],
          centerLabel: 'Create',
        );
      default:
        // Default layout for upcoming modes
        return _NavConfig(
          items: [
            _NavItemData(index: 0, icon: FontAwesomeIcons.house, label: 'Home'),
            _NavItemData(index: 1, icon: FontAwesomeIcons.heart, label: 'Saved'),
            _NavItemData(index: 3, icon: FontAwesomeIcons.comment, label: 'Messages'),
            _NavItemData(index: 4, icon: FontAwesomeIcons.gear, label: 'Settings'),
          ],
          centerLabel: 'Create',
        );
    }
  }

  Widget _buildNavItem(BuildContext context, _NavItemData item) {
    final isSelected = currentIndex == item.index;
    return GestureDetector(
      onTap: () => onTap(item.index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            FaIcon(
              item.icon,
              size: 20,
              color: isSelected ? const Color(0xFF3B82F6) : Colors.white.withOpacity(0.5),
            ),
            const SizedBox(height: 5),
            Text(
              item.label,
              style: TextStyle(
                fontSize: 10,
                color: isSelected ? Colors.white : Colors.white.withOpacity(0.4),
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCenterButton(AppModeInfo modeInfo, String label) {
    return GestureDetector(
      onTap: onSellTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(30),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      const Color(0xFF3B82F6).withOpacity(0.9),
                      const Color(0xFF3B82F6).withOpacity(0.7),
                    ],
                  ),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white.withOpacity(0.3), 
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF3B82F6).withOpacity(0.4),
                      blurRadius: 20,
                      spreadRadius: 2,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const FaIcon(
                  FontAwesomeIcons.plus,
                  color: Colors.white,
                  size: 26,
                ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: Colors.white70,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _NavConfig {
  final List<_NavItemData> items;
  final String centerLabel;
  const _NavConfig({required this.items, required this.centerLabel});
}

class _NavItemData {
  final int index;
  final FaIconData icon;
  final String label;
  const _NavItemData({required this.index, required this.icon, required this.label});
}

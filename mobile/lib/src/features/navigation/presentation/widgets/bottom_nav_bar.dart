import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class BottomNavBar extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final accentColor = Theme.of(context).colorScheme.secondary;
    
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.bottomCenter,
        children: [
          // Glass Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
              child: Container(
                height: 70,
                decoration: BoxDecoration(
                  color: const Color(0xFF0A0A0A).withOpacity(0.55), // More transparent glass
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.12),
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildNavItem(context, 0, FontAwesomeIcons.house, 'Home'),
                    _buildNavItem(context, 1, FontAwesomeIcons.heart, 'Saved'),
                    const SizedBox(width: 48), // Space for Sell button
                    _buildNavItem(context, 3, FontAwesomeIcons.comment, 'Messages'),
                    _buildNavItem(context, 4, FontAwesomeIcons.gear, 'Settings'),
                  ],
                ),
              ),
            ),
          ),
          
          // Floating Sell Button (Unclipped)
          Positioned(
            top: -20,
            child: _buildSellButton(accentColor),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, int index, FaIconData icon, String label) {
    final isSelected = currentIndex == index;
    final accentColor = Theme.of(context).colorScheme.secondary;
    return GestureDetector(
      onTap: () => onTap(index),
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FaIcon(
            icon,
            size: 20,
            color: isSelected ? accentColor : Colors.grey[400],
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: isSelected ? accentColor : Colors.grey[400],
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSellButton(Color accentColor) {
    return GestureDetector(
      onTap: onSellTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF3B82F6), // Web Primary Blue
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withOpacity(0.2), width: 2),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF3B82F6).withOpacity(0.5),
                  blurRadius: 20,
                  spreadRadius: 4,
                ),
              ],
            ),
            child: const FaIcon(
              FontAwesomeIcons.plus,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Sell',
            style: TextStyle(
              fontSize: 10,
              color: Colors.grey[300],
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

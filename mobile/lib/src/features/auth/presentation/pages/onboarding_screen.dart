import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:ui';
import '../../onboarding_provider.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingPage> _pages = [
    OnboardingPage(
      title: 'Your Campus Marketplace',
      description: 'Buy and sell textbooks, electronics, and essentials safely within your university community.',
      imagePath: 'assets/images/onboarding_marketplace.png',
      icon: Icons.storefront_outlined,
    ),
    OnboardingPage(
      title: 'Find & Offer Gigs',
      description: 'Need a tutor, photographer, or event help? Connect with talented peers for freelance gigs.',
      imagePath: 'assets/images/onboarding_gigs.png',
      icon: Icons.work_outline,
    ),
    OnboardingPage(
      title: 'Connect & Network',
      description: 'Join study groups, forums, and build meaningful connections across campus.',
      imagePath: 'assets/images/onboarding_community.png',
      icon: Icons.people_outline,
    ),
  ];

  void _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('has_seen_onboarding', true);
    ref.invalidate(onboardingProvider);
  }

  void _nextPage() {
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _completeOnboarding();
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 12, right: 24),
              child: Align(
                alignment: Alignment.topRight,
                child: AnimatedOpacity(
                  duration: const Duration(milliseconds: 200),
                  opacity: _currentPage == _pages.length - 1 ? 0.0 : 1.0,
                  child: IgnorePointer(
                    ignoring: _currentPage == _pages.length - 1,
                    child: LiquidGlassButton(
                      label: 'Skip',
                      onPressed: _completeOnboarding,
                      height: 36,
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _pages.length,
                onPageChanged: (index) => setState(() => _currentPage = index),
                itemBuilder: (context, index) {
                  final page = _pages[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          height: 300,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(24),
                            image: DecorationImage(
                              image: AssetImage(page.imagePath),
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                        const SizedBox(height: 48),
                        Icon(page.icon, size: 48, color: const Color(0xFF3B82F6)),
                        const SizedBox(height: 24),
                        Text(
                          page.title,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          page.description,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 16,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              child: SizedBox(
                height: 50,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Perfectly Centered Page Indicators
                    Align(
                      alignment: Alignment.center,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: List.generate(
                          _pages.length,
                          (index) => AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            margin: const EdgeInsets.only(right: 8),
                            height: 8,
                            width: _currentPage == index ? 24 : 8,
                            decoration: BoxDecoration(
                              color: _currentPage == index
                                  ? const Color(0xFF3B82F6)
                                  : Colors.grey[800],
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ),
                    ),
                    
                    // Liquid Glass Previous Button on the Left
                    Align(
                      alignment: Alignment.centerLeft,
                      child: AnimatedOpacity(
                        duration: const Duration(milliseconds: 250),
                        opacity: _currentPage > 0 ? 1.0 : 0.0,
                        child: IgnorePointer(
                          ignoring: _currentPage == 0,
                          child: LiquidGlassButton(
                            label: 'Back',
                            icon: Icons.arrow_back_ios_new,
                            isLeftIcon: true,
                            onPressed: _previousPage,
                            height: 44,
                          ),
                        ),
                      ),
                    ),
                    
                    // Liquid Glass Next / Get Started Button on the Right
                    Align(
                      alignment: Alignment.centerRight,
                      child: LiquidGlassButton(
                        label: _currentPage == _pages.length - 1 ? 'Get Started' : 'Next',
                        icon: _currentPage == _pages.length - 1
                            ? Icons.rocket_launch_outlined
                            : Icons.arrow_forward_ios,
                        isPrimary: true,
                        onPressed: _nextPage,
                        height: 44,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class OnboardingPage {
  final String title;
  final String description;
  final String imagePath;
  final IconData icon;

  OnboardingPage({
    required this.title,
    required this.description,
    required this.imagePath,
    required this.icon,
  });
}

/// A premium, highly customizable Liquid Glass button with specular highlight,
/// smooth rounded corners, internal blur, and interactive state changes.
class LiquidGlassButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final bool isPrimary;
  final IconData? icon;
  final bool isLeftIcon;
  final double? width;
  final double height;

  const LiquidGlassButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isPrimary = false,
    this.icon,
    this.isLeftIcon = false,
    this.width,
    this.height = 44,
  });

  @override
  Widget build(BuildContext context) {
    final baseColor = isPrimary ? const Color(0xFF3B82F6) : Colors.white;

    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(height / 2),
        boxShadow: [
          if (isPrimary)
            BoxShadow(
              color: baseColor.withValues(alpha: 0.15),
              blurRadius: 12,
              spreadRadius: 1,
              offset: const Offset(0, 4),
            )
          else
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 8,
              spreadRadius: 0,
              offset: const Offset(0, 2),
            ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(height / 2),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onPressed,
              borderRadius: BorderRadius.circular(height / 2),
              splashColor: baseColor.withValues(alpha: 0.2),
              highlightColor: baseColor.withValues(alpha: 0.1),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(height / 2),
                  border: Border.all(
                    color: isPrimary
                        ? baseColor.withValues(alpha: 0.3)
                        : Colors.white.withValues(alpha: 0.15),
                    width: 1.2,
                  ),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: isPrimary
                        ? [
                            baseColor.withValues(alpha: 0.25),
                            baseColor.withValues(alpha: 0.08),
                          ]
                        : [
                            Colors.white.withValues(alpha: 0.12),
                            Colors.white.withValues(alpha: 0.04),
                          ],
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (icon != null && isLeftIcon) ...[
                      Icon(icon, color: Colors.white, size: 14),
                      const SizedBox(width: 6),
                    ],
                    Text(
                      label,
                      style: TextStyle(
                        color: isPrimary ? Colors.white : Colors.white.withValues(alpha: 0.9),
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.3,
                      ),
                    ),
                    if (icon != null && !isLeftIcon) ...[
                      const SizedBox(width: 6),
                      Icon(icon, color: Colors.white, size: 14),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

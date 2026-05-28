import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/connectivity_provider.dart';

class ConnectivityWrapper extends ConsumerWidget {
  final Widget child;

  const ConnectivityWrapper({
    super.key,
    required this.child,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Stack(
      children: [
        KeyedSubtree(
          key: const ValueKey('app_content'),
          child: child,
        ),
        const SlidingConnectivityBanner(),
      ],
    );
  }
}

class SlidingConnectivityBanner extends ConsumerStatefulWidget {
  const SlidingConnectivityBanner({super.key});

  @override
  ConsumerState<SlidingConnectivityBanner> createState() => _SlidingConnectivityBannerState();
}

class _SlidingConnectivityBannerState extends ConsumerState<SlidingConnectivityBanner> {
  bool _isVisible = false;
  ConnectivityStatus _bannerStatus = ConnectivityStatus.connected;
  Timer? _dismissTimer;

  @override
  void initState() {
    super.initState();
    // Check initial connection status on build completion
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final currentStatus = ref.read(connectivityProvider);
      if (currentStatus == ConnectivityStatus.disconnected) {
        setState(() {
          _isVisible = true;
          _bannerStatus = ConnectivityStatus.disconnected;
        });
      }
    });
  }

  @override
  void dispose() {
    _dismissTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Listen to changes in connectivity provider
    ref.listen<ConnectivityStatus>(connectivityProvider, (previous, next) {
      _dismissTimer?.cancel();
      
      if (next == ConnectivityStatus.disconnected) {
        setState(() {
          _isVisible = true;
          _bannerStatus = ConnectivityStatus.disconnected;
        });
      } else if (next == ConnectivityStatus.checking) {
        setState(() {
          _isVisible = true;
          _bannerStatus = ConnectivityStatus.checking;
        });
      } else if (next == ConnectivityStatus.connected) {
        if (previous == ConnectivityStatus.disconnected || previous == ConnectivityStatus.checking) {
          // Temporarily show green "Restored" state
          setState(() {
            _isVisible = true;
            _bannerStatus = ConnectivityStatus.connected;
          });
          
          // Auto-hide after 3 seconds
          _dismissTimer = Timer(const Duration(seconds: 3), () {
            if (mounted) {
              setState(() {
                _isVisible = false;
              });
            }
          });
        } else {
          // If initialized as connected, keep hidden
          setState(() {
            _isVisible = false;
          });
        }
      }
    });

    final statusBarHeight = MediaQuery.of(context).padding.top;
    
    // Choose banner configuration based on current status
    Color backgroundColor;
    Color borderColor;
    Color iconBgColor;
    Color iconColor;
    IconData icon;
    String titleText;
    String subtitleText;
    
    switch (_bannerStatus) {
      case ConnectivityStatus.disconnected:
        backgroundColor = const Color(0xFFEF4444).withOpacity(0.08); // Red warning glow
        borderColor = const Color(0xFFEF4444).withOpacity(0.35);
        iconBgColor = const Color(0xFFEF4444).withOpacity(0.2);
        iconColor = const Color(0xFFFCA5A5);
        icon = Icons.wifi_off_rounded;
        titleText = 'Connection Lost';
        subtitleText = 'Working offline. Tap to retry connection.';
        break;
      case ConnectivityStatus.checking:
        backgroundColor = const Color(0xFFF59E0B).withOpacity(0.08); // Amber connecting glow
        borderColor = const Color(0xFFF59E0B).withOpacity(0.35);
        iconBgColor = const Color(0xFFF59E0B).withOpacity(0.2);
        iconColor = const Color(0xFFFDE68A);
        icon = Icons.sync_rounded;
        titleText = 'Checking Connection...';
        subtitleText = 'Verifying your internet connection.';
        break;
      case ConnectivityStatus.connected:
        backgroundColor = const Color(0xFF10B981).withOpacity(0.08); // Green success glow
        borderColor = const Color(0xFF10B981).withOpacity(0.35);
        iconBgColor = const Color(0xFF10B981).withOpacity(0.2);
        iconColor = const Color(0xFFA7F3D0);
        icon = Icons.wifi_rounded;
        titleText = 'Connection Restored';
        subtitleText = 'Back online! Syncing cached data.';
        break;
    }

    return AnimatedPositioned(
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeOutBack,
      top: _isVisible ? (statusBarHeight + 12) : -120,
      left: 16,
      right: 16,
      child: GestureDetector(
        onTap: () {
          // Force network check on tap
          ref.read(connectivityProvider.notifier).forceCheck();
        },
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF0F0F0F).withOpacity(0.7),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderColor, width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.35),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Icon with soft glowing background
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: iconBgColor,
                      shape: BoxShape.circle,
                    ),
                    child: _bannerStatus == ConnectivityStatus.checking
                        ? const Center(
                            child: SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFDE68A)),
                              ),
                            ),
                          )
                        : Icon(
                            icon,
                            color: iconColor,
                            size: 20,
                          ),
                  ),
                  const SizedBox(width: 14),
                  
                  // Text elements
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          titleText,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.3,
                            decoration: TextDecoration.none,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          subtitleText,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.6),
                            fontSize: 12,
                            fontWeight: FontWeight.normal,
                            decoration: TextDecoration.none,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Pulse online status indicator on the right
                  if (_bannerStatus == ConnectivityStatus.disconnected)
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFFEF4444),
                        shape: BoxShape.circle,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

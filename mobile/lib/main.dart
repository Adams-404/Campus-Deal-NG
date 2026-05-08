import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'src/core/constants/supabase_constants.dart';
import 'src/core/theme/app_theme.dart';
import 'src/features/auth/auth_provider.dart';
import 'src/features/auth/onboarding_provider.dart';
import 'src/features/auth/presentation/pages/login_screen.dart';
import 'src/features/auth/presentation/pages/onboarding_screen.dart';
import 'src/features/home/presentation/pages/home_screen.dart';
import 'src/features/navigation/presentation/widgets/bottom_nav_bar.dart';
import 'src/features/marketplace/presentation/pages/saved_items_screen.dart';
import 'src/features/marketplace/presentation/pages/settings_screen.dart';
import 'src/features/marketplace/presentation/pages/create_listing_screen.dart';
import 'src/features/messages/presentation/pages/messages_screen.dart';
import 'src/core/widgets/status_bar_blur.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: SupabaseConstants.url,
    anonKey: SupabaseConstants.anonKey,
  );

  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Campus Deal NG',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      builder: (context, child) {
        return Stack(
          children: [
            if (child != null) child,
            const StatusBarBlur(),
          ],
        );
      },
      home: const AuthWrapper(),
    );
  }
}

// ── Auth gate ─────────────────────────────────────────────────────────────────

class AuthWrapper extends ConsumerWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);

    return authState.when(
      data: (data) {
        if (data.session != null) {
          return const MainNavigationWrapper();
        } else {
          final onboardingState = ref.watch(onboardingProvider);
          return onboardingState.when(
            data: (hasSeen) {
              if (hasSeen) return const LoginScreen();
              return const OnboardingScreen();
            },
            loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
            error: (_, __) => const LoginScreen(),
          );
        }
      },
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (error, stack) => Scaffold(
        body: Center(child: Text('Error: $error')),
      ),
    );
  }
}

// ── Main shell ────────────────────────────────────────────────────────────────

class MainNavigationWrapper extends StatefulWidget {
  const MainNavigationWrapper({super.key});

  @override
  State<MainNavigationWrapper> createState() => _MainNavigationWrapperState();
}

class _MainNavigationWrapperState extends State<MainNavigationWrapper> {
  // Tracks which nav-bar tab is active (0=Home, 1=Saved, 2=Sell[modal], 3=Messages, 4=Settings)
  int _currentIndex = 0;

  // 4 screens (Sell at index 2 is a modal, not a screen)
  static const List<Widget> _screens = [
    HomeScreen(),        // nav 0
    SavedItemsScreen(),  // nav 1
    MessagesScreen(),    // nav 3
    SettingsScreen(),    // nav 4
  ];

  /// Map nav-bar index → stack index, skipping the Sell button (nav 2).
  int get _stackIndex {
    switch (_currentIndex) {
      case 0: return 0;
      case 1: return 1;
      case 3: return 2;
      case 4: return 3;
      default: return 0;
    }
  }

  void _onNavTap(int index) {
    if (index == 2) return; // Sell — modal, not a tab
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: IndexedStack(
        index: _stackIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: _currentIndex,
        onTap: _onNavTap,
        onSellTap: () => _showSellModal(context),
      ),
    );
  }

  void _showSellModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFF171717),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.fromLTRB(
            24, 24, 24, 24 + MediaQuery.of(ctx).viewInsets.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 28),
            // Icon
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF3B82F6), Color(0xFF6366F1)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF3B82F6).withOpacity(0.4),
                    blurRadius: 20,
                    spreadRadius: 4,
                  ),
                ],
              ),
              child: const Icon(Icons.add, color: Colors.white, size: 36),
            ),
            const SizedBox(height: 18),
            const Text(
              'Sell Something',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'List your items on the campus marketplace',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[400], fontSize: 14),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const CreateListingScreen(),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3B82F6),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: const Text('Create a Listing',
                    style: TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child:
                  Text('Cancel', style: TextStyle(color: Colors.grey[400])),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

// ── Messages placeholder ──────────────────────────────────────────────────────



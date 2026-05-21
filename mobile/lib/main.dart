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
import 'src/features/marketplace/presentation/widgets/create_listing_modal.dart';
import 'src/features/messages/presentation/pages/messages_screen.dart';
import 'src/core/widgets/status_bar_blur.dart';
import 'src/core/providers/app_mode_provider.dart';
import 'src/features/gigs/presentation/pages/gigs_browse_screen.dart';
import 'src/features/gigs/presentation/pages/my_gigs_screen.dart';
import 'src/features/gigs/presentation/widgets/create_gig_modal.dart';

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
            child ?? const SizedBox.shrink(),
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
            error: (err, stack) => const LoginScreen(),
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

class MainNavigationWrapper extends ConsumerStatefulWidget {
  const MainNavigationWrapper({super.key});

  @override
  ConsumerState<MainNavigationWrapper> createState() => _MainNavigationWrapperState();
}

class _MainNavigationWrapperState extends ConsumerState<MainNavigationWrapper> {
  // Tracks which nav-bar tab is active (0=Home, 1=Saved, 2=Sell[modal], 3=Messages, 4=Settings)
  int _currentIndex = 0;

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
    final mode = ref.watch(appModeProvider);

    List<Widget> currentScreens;
    if (mode == AppMode.gigs) {
      currentScreens = const [
        GigsBrowseScreen(),         // nav 0
        MyGigsScreen(),             // nav 1
        MessagesScreen(),           // nav 3
        SettingsScreen(),           // nav 4
      ];
    } else {
      // Default / Marketplace
      currentScreens = const [
        HomeScreen(),               // nav 0
        SavedItemsScreen(),         // nav 1
        MessagesScreen(),           // nav 3
        SettingsScreen(),           // nav 4
      ];
    }

    return Scaffold(
      extendBody: true,
      body: IndexedStack(
        index: _stackIndex,
        children: currentScreens,
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: _currentIndex,
        onTap: _onNavTap,
        onSellTap: () => _handleCenterAction(context, mode),
      ),
    );
  }

  void _handleCenterAction(BuildContext context, AppMode mode) {
    if (mode == AppMode.gigs) {
      _showCreateGigModal(context);
    } else {
      _showSellModal(context);
    }
  }

  void _showCreateGigModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => const CreateGigModal(),
    );
  }

  void _showSellModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => const CreateListingModal(),
    );
  }
}

// ── Messages placeholder ──────────────────────────────────────────────────────



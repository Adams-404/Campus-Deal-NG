import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/glass_search_bar.dart';
import '../../../../core/widgets/mode_switcher_pill.dart';
import '../../../auth/profile_provider.dart';
import 'package:skeletonizer/skeletonizer.dart';
import '../providers/gigs_provider.dart';
import '../widgets/gig_card.dart';
import 'gig_detail_screen.dart';
import '../../domain/models/gig_model.dart';

class GigsBrowseScreen extends ConsumerStatefulWidget {
  const GigsBrowseScreen({super.key});

  @override
  ConsumerState<GigsBrowseScreen> createState() => _GigsBrowseScreenState();
}

class _GigsBrowseScreenState extends ConsumerState<GigsBrowseScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            pinned: true,
            backgroundColor: Colors.transparent,
            surfaceTintColor: Colors.transparent,
            scrolledUnderElevation: 0,
            elevation: 0,
            flexibleSpace: const SizedBox.shrink(),
            title: Row(
              children: [
                const ModeSwitcherPill(),
                const SizedBox(width: 8),
                Expanded(
                  child: GlassSearchBar(
                    controller: _searchController,
                    hintText: 'Search gigs...',
                    onChanged: (v) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 8),
                _buildNotificationIcon(),
                const SizedBox(width: 8),
                _buildProfileAvatar(),
              ],
            ),
          ),
          // Gigs List
          ref.watch(gigsNotifierProvider).when(
            data: (gigs) {
              if (gigs.isEmpty) {
                return SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.work_off_outlined, size: 64, color: Colors.white.withOpacity(0.2)),
                        const SizedBox(height: 16),
                        const Text(
                          'No gigs found',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Try adjusting your search or check back later.',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.5),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }
              
              // Filter logic placeholder (can implement search here later)
              final filteredGigs = _searchController.text.isEmpty 
                  ? gigs 
                  : gigs.where((g) => g.title.toLowerCase().contains(_searchController.text.toLowerCase()) || 
                                      g.category.toLowerCase().contains(_searchController.text.toLowerCase())).toList();

              return SliverPadding(
                padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 100),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final gig = filteredGigs[index];
                      return GigCard(
                        gig: gig,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => GigDetailScreen(gig: gig),
                            ),
                          );
                        },
                      );
                    },
                    childCount: filteredGigs.length,
                  ),
                ),
              );
            },
            loading: () => SliverPadding(
              padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 100),
              sliver: Skeletonizer.sliver(
                enabled: true,
                child: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      return GigCard(
                        gig: Gig(
                          id: index.toString(),
                          title: 'Loading Gig Title...',
                          description: 'Loading description...',
                          category: 'Loading...',
                          price: 0,
                          userId: '',
                          status: 'active',
                          createdAt: DateTime.now(),
                        ),
                        onTap: () {},
                      );
                    },
                    childCount: 3,
                  ),
                ),
              ),
            ),
            error: (err, stack) => SliverFillRemaining(
              child: Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red))),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationIcon() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.08),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withOpacity(0.15), width: 1.0),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              const Icon(Icons.notifications_none, color: Colors.white, size: 20),
              Positioned(
                top: 10,
                right: 10,
                child: Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF59E0B),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  Widget _buildProfileAvatar() {
    final profileAsync = ref.watch(profileProvider);
    
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.08),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withOpacity(0.15), width: 1.0),
          ),
          child: profileAsync.when(
            data: (profile) {
              final avatarUrl = profile?['avatar_url'] as String?;
              final firstName = profile?['first_name'] as String? ?? '';
              final initial = firstName.isNotEmpty ? firstName[0].toUpperCase() : '?';
              
              return ClipOval(
                child: avatarUrl != null && avatarUrl.isNotEmpty
                    ? Image.network(avatarUrl, fit: BoxFit.cover)
                    : Center(
                        child: Text(
                          initial,
                          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                        ),
                      ),
              );
            },
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const Icon(Icons.account_circle, color: Colors.white, size: 24),
          ),
        ),
      ),
    );
  }
}

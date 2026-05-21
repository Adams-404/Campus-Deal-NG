import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:intl/intl.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:shimmer/shimmer.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/image_utils.dart';
import '../../../../core/widgets/safe_image.dart';
import '../providers/gigs_provider.dart';
import '../../domain/models/gig_model.dart';
import '../widgets/gig_card.dart';
import 'gig_detail_screen.dart';

class MyGigsScreen extends ConsumerStatefulWidget {
  const MyGigsScreen({super.key});

  @override
  ConsumerState<MyGigsScreen> createState() => _MyGigsScreenState();
}

class _MyGigsScreenState extends ConsumerState<MyGigsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _postedScrollController = ScrollController();
  final _appliedScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _postedScrollController.dispose();
    _appliedScrollController.dispose();
    super.dispose();
  }

  Future<void> _refreshData() async {
    ref.invalidate(userGigsProvider);
    ref.invalidate(userApplicationsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = const Color(0xFF3B82F6);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text(
          'My Gigs Workspace',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(30),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                child: Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.03),
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.08),
                      width: 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 10,
                        spreadRadius: 0,
                      )
                    ],
                  ),
                  child: TabBar(
                    controller: _tabController,
                    indicator: BoxDecoration(
                      borderRadius: BorderRadius.circular(30),
                      gradient: LinearGradient(
                        colors: [
                          primaryColor.withOpacity(0.3),
                          const Color(0xFF6366F1).withOpacity(0.2),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      border: Border.all(
                        color: primaryColor.withOpacity(0.4),
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: primaryColor.withOpacity(0.2),
                          blurRadius: 8,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                    labelColor: Colors.white,
                    unselectedLabelColor: Colors.white.withOpacity(0.4),
                    dividerColor: Colors.transparent,
                    indicatorSize: TabBarIndicatorSize.tab,
                    tabs: const [
                      Tab(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            FaIcon(FontAwesomeIcons.briefcase, size: 12),
                            SizedBox(width: 8),
                            Text(
                              'My Gigs',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Tab(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            FaIcon(FontAwesomeIcons.circleCheck, size: 12),
                            SizedBox(width: 8),
                            Text(
                              'Applied',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _refreshData,
        backgroundColor: const Color(0xFF1E1E1E),
        color: primaryColor,
        child: TabBarView(
          controller: _tabController,
          children: [
            _buildPostedGigsTab(),
            _buildApplicationsTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildPostedGigsTab() {
    final userGigsAsync = ref.watch(userGigsProvider);

    return userGigsAsync.when(
      data: (gigs) {
        if (gigs.isEmpty) {
          return _buildEmptyState(
            icon: FontAwesomeIcons.briefcase,
            title: 'No gigs posted',
            subtitle: 'Gigs you create as a provider will appear here.',
          );
        }

        return ListView.builder(
          controller: _postedScrollController,
          padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 100),
          itemCount: gigs.length,
          itemBuilder: (context, index) {
            final gig = gigs[index];
            return GigCard(
              gig: gig,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => GigDetailScreen(gig: gig)),
                );
              },
            );
          },
        );
      },
      loading: () => _buildSkeletonLoading(),
      error: (err, stack) => _buildErrorState(err),
    );
  }

  Widget _buildApplicationsTab() {
    final applicationsAsync = ref.watch(userApplicationsProvider);

    return applicationsAsync.when(
      data: (applications) {
        if (applications.isEmpty) {
          return _buildEmptyState(
            icon: FontAwesomeIcons.circleCheck,
            title: 'No applications yet',
            subtitle: 'Gigs you apply for will be tracked here.',
          );
        }

        return ListView.builder(
          controller: _appliedScrollController,
          padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 100),
          itemCount: applications.length,
          itemBuilder: (context, index) {
            final app = applications[index];
            if (app.gig == null) return const SizedBox.shrink();

            return _buildApplicationCard(app);
          },
        );
      },
      loading: () => _buildSkeletonLoading(),
      error: (err, stack) => _buildErrorState(err),
    );
  }

  Widget _buildApplicationCard(GigApplication app) {
    final gig = app.gig!;
    final primaryColor = const Color(0xFF3B82F6);
    final statusColor = _getStatusColor(app.status);

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => GigDetailScreen(gig: gig)),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.white.withOpacity(0.08),
              Colors.white.withOpacity(0.03),
            ],
          ),
          border: Border.all(
            color: Colors.white.withOpacity(0.1),
            width: 1,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top header: Status and date
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: statusColor.withOpacity(0.5)),
                        ),
                        child: Text(
                          app.status.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: statusColor,
                          ),
                        ),
                      ),
                      Text(
                        DateFormat('yMMMd').format(app.createdAt),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withOpacity(0.4),
                        ),
                      ),
                    ],
                  ),
                ),

                // Gig details block
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Little cover icon/image
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          width: 60,
                          height: 60,
                          color: Colors.white.withOpacity(0.05),
                          child: gig.gigImages.isNotEmpty
                              ? SafeImage(
                                  imageUrl: ImageUtils.getThumbnailUrl(
                                    ImageUtils.getFullUrl(gig.gigImages.first.imageUrl),
                                    width: 120,
                                    height: 120,
                                  ),
                                  fit: BoxFit.cover,
                                  memCacheWidth: 150,
                                  memCacheHeight: 150,
                                  fadeInDuration: const Duration(milliseconds: 200),
                                  placeholder: (context, url) => Shimmer.fromColors(
                                    baseColor: AppTheme.shimmerBase,
                                    highlightColor: AppTheme.shimmerHighlight,
                                    child: Container(color: Colors.white),
                                  ),
                                  errorWidget: (context, url, error) => Container(
                                    color: const Color(0xFF222222),
                                    child: const Center(
                                      child: Icon(Icons.broken_image_outlined, color: Colors.white24, size: 16),
                                    ),
                                  ),
                                )
                              : const Center(
                                  child: FaIcon(FontAwesomeIcons.briefcase, color: Colors.white30, size: 20),
                                ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              gig.title,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '₦${NumberFormat.decimalPattern().format(gig.price)}',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: primaryColor,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              gig.category,
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.white.withOpacity(0.5),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Your Message
                if (app.message != null && app.message!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.03),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white.withOpacity(0.05)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Your pitch / message:',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.white.withOpacity(0.4),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            app.message!,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withOpacity(0.7),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],

                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState({required FaIconData icon, required String title, required String subtitle}) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              shape: BoxShape.circle,
            ),
            child: FaIcon(icon, size: 40, color: Colors.white.withOpacity(0.2)),
          ),
          const SizedBox(height: 24),
          Text(
            title,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.white.withOpacity(0.5),
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSkeletonLoading() {
    return Skeletonizer(
      enabled: true,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 3,
        itemBuilder: (context, index) {
          return GigCard(
            gig: Gig(
              id: index.toString(),
              title: 'Loading Gig Title...',
              description: 'Loading description...',
              category: 'Loading...',
              price: 1000,
              userId: '',
              status: 'active',
              createdAt: DateTime.now(),
            ),
            onTap: () {},
          );
        },
      ),
    );
  }

  Widget _buildErrorState(Object err) {
    return Center(
      child: Text(
        'Error loading details: $err',
        style: const TextStyle(color: Colors.red),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'approved':
        return Colors.green;
      case 'rejected':
      case 'declined':
        return Colors.red;
      case 'pending':
      default:
        return Colors.orange;
    }
  }
}

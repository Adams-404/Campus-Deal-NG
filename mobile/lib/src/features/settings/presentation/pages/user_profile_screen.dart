import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../../auth/auth_provider.dart';
import '../../../../core/utils/image_utils.dart';
import '../../../../core/widgets/glass_app_bar.dart';
import '../../../../core/widgets/glass_skeleton.dart';
import '../../../messages/domain/models/chat_models.dart';
import '../../../messages/presentation/pages/chat_screen.dart';
import '../../../marketplace/presentation/pages/item_detail_screen.dart';

class UserProfileScreen extends ConsumerStatefulWidget {
  final String userId;

  const UserProfileScreen({super.key, required this.userId});

  @override
  ConsumerState<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends ConsumerState<UserProfileScreen> {
  Map<String, dynamic>? _profile;
  List<Map<String, dynamic>> _userItems = [];
  List<Map<String, dynamic>> _userGigs = [];
  bool _isLoading = true;
  bool _isCurrentUser = false;
  bool _isMessaging = false;
  
  // Custom Tab State
  String _selectedTab = '';
  List<String> _activeTabs = [];

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    try {
      final supabase = ref.read(supabaseClientProvider);
      final currentUser = supabase.auth.currentUser;
      _isCurrentUser = currentUser != null && currentUser.id == widget.userId;

      // 1. Fetch Profile Info
      final profileResponse = await supabase
          .from('profiles')
          .select('*')
          .eq('id', widget.userId)
          .maybeSingle();

      if (profileResponse == null) {
        setState(() => _isLoading = false);
        return;
      }

      // 2. Fetch active Listings (Items)
      final itemsResponse = await supabase
          .from('items')
          .select('id, title, price, status, category, condition, created_at, item_images(image_url)')
          .eq('seller_id', widget.userId)
          .eq('status', 'active')
          .order('created_at', ascending: false);

      // 3. Fetch active Gigs
      final gigsResponse = await supabase
          .from('gigs')
          .select('id, title, price, category, status, rating, reviews_count, created_at, gig_images(image_url)')
          .eq('user_id', widget.userId)
          .eq('status', 'active')
          .order('created_at', ascending: false);

      final itemsList = List<Map<String, dynamic>>.from(itemsResponse);
      final gigsList = List<Map<String, dynamic>>.from(gigsResponse);

      // Build active modes dynamically (No zero-count tabs!)
      final tabs = <String>[];
      if (itemsList.isNotEmpty) tabs.add('Listings');
      if (gigsList.isNotEmpty) tabs.add('Gigs');

      setState(() {
        _profile = profileResponse;
        _userItems = itemsList;
        _userGigs = gigsList;
        _activeTabs = tabs;
        if (tabs.isNotEmpty) {
          _selectedTab = tabs.first;
        }
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading user profile data: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _messageUser() async {
    if (_profile == null || _isMessaging) return;

    final supabase = ref.read(supabaseClientProvider);
    final user = supabase.auth.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sign in to message this user')),
      );
      return;
    }

    if (_isCurrentUser) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("You can't message yourself")),
      );
      return;
    }

    setState(() => _isMessaging = true);

    try {
      final existingConversation = await supabase
          .from('conversations')
          .select('id')
          .or('and(buyer_id.eq.${user.id},seller_id.eq.${widget.userId}),and(buyer_id.eq.${widget.userId},seller_id.eq.${user.id})')
          .isFilter('gig_id', null)
          .limit(1)
          .maybeSingle();

      String conversationId;
      if (existingConversation != null) {
        conversationId = existingConversation['id'] as String;
      } else {
        final newConversation = await supabase
            .from('conversations')
            .insert({
              'buyer_id': user.id,
              'seller_id': widget.userId,
              'last_message': 'Started a conversation',
              'last_message_at': DateTime.now().toIso8601String(),
            })
            .select('id')
            .single();
        conversationId = newConversation['id'] as String;
      }

      if (mounted) {
        final conv = Conversation(
          id: conversationId,
          buyerId: user.id,
          sellerId: widget.userId,
          lastMessage: 'Started a conversation',
          lastMessageAt: DateTime.now(),
          otherUser: ConvProfile(
            id: widget.userId,
            firstName: _profile!['first_name'] as String?,
            lastName: _profile!['last_name'] as String?,
            avatarUrl: _profile!['avatar_url'] as String?,
          ),
        );

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ChatScreen(
              conversation: conv,
              currentUserId: user.id,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error starting chat: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isMessaging = false);
    }
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return 'N/A';
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('MMMM yyyy').format(date);
    } catch (_) {
      return 'N/A';
    }
  }

  Widget _buildKycBadge() {
    final status = _profile?['kyc_status'] ?? 'pending';
    Color color;
    IconData icon;
    String label;

    switch (status) {
      case 'verified':
        color = const Color(0xFF10B981);
        icon = Icons.verified;
        label = 'Verified Student';
        break;
      case 'processing':
        color = Colors.orangeAccent;
        icon = Icons.hourglass_top;
        label = 'Processing Verification';
        break;
      case 'rejected':
        color = Colors.redAccent;
        icon = Icons.cancel;
        label = 'Verification Rejected';
        break;
      default:
        return const SizedBox.shrink(); // Hide if unverified for a clean, mature look
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 12),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAmbientGlow() {
    return Positioned.fill(
      child: Stack(
        children: [
          Positioned(
            top: -100,
            right: -80,
            width: 320,
            height: 320,
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF1E3A8A).withOpacity(0.18),
              ),
            ),
          ),
          Positioned(
            top: 250,
            left: -120,
            width: 300,
            height: 300,
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF3B82F6).withOpacity(0.06),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCircleButton({
    required IconData icon,
    Color? iconColor,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Icon(icon, color: iconColor ?? Colors.white, size: 18),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF0A0A0A),
        body: SafeArea(
          child: GlassShimmer(
            child: GlassSkeletonProfile(),
          ),
        ),
      );
    }

    if (_profile == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF0A0A0A),
        appBar: const GlassAppBar(title: 'Profile'),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.red.withOpacity(0.06),
                ),
                child: const Icon(Icons.person_off_outlined, color: Colors.redAccent, size: 40),
              ),
              const SizedBox(height: 16),
              const Text(
                'User not found',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF262626),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Go Back', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      );
    }

    final firstName = _profile!['first_name'] as String? ?? '';
    final lastName = _profile!['last_name'] as String? ?? '';
    final fullName = '$firstName $lastName'.trim();
    final displayName = fullName.isNotEmpty ? fullName : 'Anonymous User';
    final avatarLetter = displayName.isNotEmpty ? displayName[0].toUpperCase() : 'U';
    final avatarUrl = _profile!['avatar_url'] as String?;
    final address = _profile!['address'] as String? ?? '';
    final joinedDate = _formatDate(_profile!['created_at']);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: Stack(
        children: [
          _buildAmbientGlow(),
          SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + 64, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Minimal Matured Avatar with thin premium gradient ring
                Center(
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: [
                              const Color(0xFF3B82F6).withOpacity(0.6),
                              const Color(0xFF1D4ED8).withOpacity(0.1),
                              const Color(0xFF3B82F6).withOpacity(0.4),
                            ],
                          ),
                        ),
                        child: CircleAvatar(
                          radius: 50,
                          backgroundColor: const Color(0xFF141417),
                          backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty
                              ? CachedNetworkImageProvider(avatarUrl)
                              : null,
                          child: avatarUrl == null || avatarUrl.isEmpty
                              ? Text(
                                  avatarLetter,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 34,
                                    fontWeight: FontWeight.w300,
                                  ),
                                )
                              : null,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Name & Verification row
                Text(
                  displayName,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 8),
                _buildKycBadge(),
                const SizedBox(height: 14),

                // Minimalist Matured Meta Info (Inline list instead of boxy cards!)
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (address.isNotEmpty) ...[
                      const Icon(Icons.location_on_outlined, color: Colors.grey, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        address,
                        style: const TextStyle(color: Colors.grey, fontSize: 13),
                      ),
                      const SizedBox(width: 12),
                      Container(width: 4, height: 4, decoration: const BoxDecoration(color: Colors.grey, shape: BoxShape.circle)),
                      const SizedBox(width: 12),
                    ],
                    const Icon(Icons.calendar_today_outlined, color: Colors.grey, size: 12),
                    const SizedBox(width: 4),
                    Text(
                      'Joined $joinedDate',
                      style: const TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Primary Message/Share buttons
                if (!_isCurrentUser) ...[
                  Row(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                            child: Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFF3B82F6).withOpacity(0.85),
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF3B82F6).withOpacity(0.2),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  )
                                ],
                              ),
                              child: Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  onTap: _messageUser,
                                  child: Container(
                                    height: 48,
                                    alignment: Alignment.center,
                                    child: _isMessaging
                                        ? const SizedBox(
                                            width: 16,
                                            height: 16,
                                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                          )
                                        : const Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Icon(Icons.mail_outlined, color: Colors.white, size: 18),
                                              SizedBox(width: 8),
                                              Text(
                                                'Message',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 14,
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
                      ),
                      const SizedBox(width: 12),
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: const Color(0xFF16161A),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.white.withOpacity(0.08)),
                        ),
                        child: IconButton(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Profile link copied!')),
                            );
                          },
                          icon: const Icon(Icons.share_outlined, color: Colors.white, size: 18),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                ],

                // Divider line for premium separation
                Container(
                  height: 1,
                  color: Colors.white.withOpacity(0.05),
                ),
                const SizedBox(height: 20),

                // Render dynamic Matured tab selector
                if (_activeTabs.isNotEmpty) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: _activeTabs.map((tab) {
                      final isSelected = _selectedTab == tab;
                      final count = tab == 'Listings' ? _userItems.length : _userGigs.length;

                      return GestureDetector(
                        onTap: () => setState(() => _selectedTab = tab),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          margin: const EdgeInsets.only(right: 12),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF3B82F6).withOpacity(0.12) : Colors.transparent,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isSelected ? const Color(0xFF3B82F6).withOpacity(0.3) : Colors.transparent,
                            ),
                          ),
                          child: Text(
                            '$tab ($count)',
                            style: TextStyle(
                              color: isSelected ? const Color(0xFF3B82F6) : Colors.grey[500],
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              letterSpacing: 0.1,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 20),
                  
                  // Render active content tab
                  _selectedTab == 'Listings' ? _buildListingsTab() : _buildGigsTab(),
                ] else ...[
                  // Dynamic Elegant Empty Offerings State
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 64, horizontal: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF121215),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white.withOpacity(0.03)),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.inventory_2_outlined, color: Colors.grey[700], size: 36),
                        const SizedBox(height: 16),
                        const Text(
                          'No offerings yet',
                          style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _isCurrentUser
                              ? 'Start listing your items or services today!'
                              : 'This user hasn\'t posted any offerings yet.',
                          style: TextStyle(color: Colors.grey[600], fontSize: 13),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 90,
            child: IgnorePointer(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withOpacity(0.4),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 16,
            child: _buildCircleButton(
              icon: Icons.arrow_back_ios_new,
              onTap: () => Navigator.pop(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildListingsTab() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.82,
      ),
      itemCount: _userItems.length,
      itemBuilder: (context, index) {
        final item = _userItems[index];
        final images = item['item_images'] as List?;
        final imageUrl = images != null && images.isNotEmpty
            ? images[0]['image_url'] as String?
            : null;

        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ItemDetailScreen(itemId: item['id'] as String),
              ),
            );
          },
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF141417),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.04)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        if (imageUrl != null)
                          CachedNetworkImage(
                            imageUrl: ImageUtils.getThumbnailUrl(imageUrl, width: 300, height: 250),
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(color: const Color(0xFF1A1A1E)),
                          )
                        else
                          Container(
                            color: const Color(0xFF1A1A1E),
                            child: const Icon(Icons.image_not_supported_outlined, color: Colors.white12),
                          ),
                        if (item['condition'] != null)
                          Positioned(
                            top: 8,
                            left: 8,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.7),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                (item['condition'] as String).toLowerCase(),
                                style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['title'] ?? '',
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '₦${NumberFormat('#,##0').format(item['price'] ?? 0)}',
                        style: const TextStyle(color: Color(0xFF3B82F6), fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildGigsTab() {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _userGigs.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final gig = _userGigs[index];
        final images = gig['gig_images'] as List?;
        final imageUrl = images != null && images.isNotEmpty
            ? images[0]['image_url'] as String?
            : null;

        return GestureDetector(
          onTap: () {
            // Push to Gig detail page if available
          },
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF141417),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.04)),
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SizedBox(
                    width: 72,
                    height: 72,
                    child: imageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: ImageUtils.getThumbnailUrl(imageUrl, width: 160, height: 160),
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(color: const Color(0xFF1A1A1E)),
                          )
                        : Container(
                            color: const Color(0xFF1A1A1E),
                            child: const Icon(Icons.work_outline, color: Colors.white24),
                          ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        gig['title'] ?? '',
                        style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(Icons.star, color: Colors.amber[600], size: 12),
                          const SizedBox(width: 4),
                          Text(
                            '${gig['rating'] ?? 0.0}',
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '(${gig['reviews_count'] ?? 0})',
                            style: const TextStyle(color: Colors.grey, fontSize: 10),
                          ),
                          const Spacer(),
                          Text(
                            'From ₦${NumberFormat('#,##0').format(gig['price'] ?? 0)}',
                            style: const TextStyle(color: Color(0xFF3B82F6), fontSize: 13, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}



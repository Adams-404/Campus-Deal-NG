import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../auth/auth_provider.dart';
import '../../../../core/widgets/glass_app_bar.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  Map<String, dynamic>? _profile;
  List<Map<String, dynamic>> _userItems = [];
  bool _isLoading = true;
  bool _isUploading = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final supabase = ref.read(supabaseClientProvider);
      final user = supabase.auth.currentUser;
      if (user == null) {
        setState(() => _isLoading = false);
        return;
      }

      final profileResponse = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

      final itemsResponse = await supabase
          .from('items')
          .select('id, title, price, status, item_images(image_url)')
          .eq('seller_id', user.id)
          .eq('status', 'active')
          .order('created_at', ascending: false)
          .limit(4);

      setState(() {
        _profile = profileResponse;
        _userItems = List<Map<String, dynamic>>.from(itemsResponse ?? []);
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _pickAndUploadAvatar() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 80,
    );
    if (picked == null) return;

    setState(() => _isUploading = true);

    try {
      final supabase = ref.read(supabaseClientProvider);
      final user = supabase.auth.currentUser;
      if (user == null) return;

      final file = File(picked.path);
      final fileName = '${user.id}/${DateTime.now().millisecondsSinceEpoch}.jpg';

      await supabase.storage.from('avatars').upload(
            fileName,
            file,
            fileOptions: const FileOptions(upsert: true),
          );

      final publicUrl =
          supabase.storage.from('avatars').getPublicUrl(fileName);

      await supabase
          .from('profiles')
          .update({
            'avatar_url': publicUrl,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', user.id);

      await _loadProfile();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile picture updated!'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to upload image: $e'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      setState(() => _isUploading = false);
    }
  }

  void _showEditProfileSheet() {
    final firstNameController =
        TextEditingController(text: _profile?['first_name'] ?? '');
    final lastNameController =
        TextEditingController(text: _profile?['last_name'] ?? '');
    final phoneController =
        TextEditingController(text: _profile?['phone'] ?? '');
    final addressController =
        TextEditingController(text: _profile?['address'] ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(ctx).size.height * 0.85,
        ),
        decoration: const BoxDecoration(
          color: Color(0xFF171717),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Padding(
          padding: EdgeInsets.fromLTRB(
              24, 16, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.edit,
                          color: Color(0xFF3B82F6), size: 20),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Edit Profile',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // First Name
                _buildInputField(
                  label: 'First Name',
                  controller: firstNameController,
                  icon: Icons.person_outline,
                  iconColor: const Color(0xFF3B82F6),
                ),
                const SizedBox(height: 16),

                // Last Name
                _buildInputField(
                  label: 'Last Name',
                  controller: lastNameController,
                  icon: Icons.person_outline,
                  iconColor: const Color(0xFF3B82F6),
                ),
                const SizedBox(height: 16),

                // Phone
                _buildInputField(
                  label: 'Phone Number',
                  controller: phoneController,
                  icon: Icons.phone_outlined,
                  iconColor: Colors.green,
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),

                // Address
                _buildInputField(
                  label: 'Address',
                  controller: addressController,
                  icon: Icons.location_on_outlined,
                  iconColor: Colors.red,
                ),
                const SizedBox(height: 24),

                // Save button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      try {
                        final supabase = ref.read(supabaseClientProvider);
                        final user = supabase.auth.currentUser;
                        if (user == null) return;

                        await supabase.from('profiles').update({
                          'first_name': firstNameController.text.trim(),
                          'last_name': lastNameController.text.trim(),
                          'phone': phoneController.text.trim(),
                          'address': addressController.text.trim(),
                          'updated_at': DateTime.now().toIso8601String(),
                        }).eq('id', user.id);

                        if (mounted) Navigator.pop(ctx);
                        await _loadProfile();

                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Profile updated successfully!'),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Error: $e'),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3B82F6),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 0,
                    ),
                    child: const Text('Save Changes',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInputField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    required Color iconColor,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: iconColor),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: Colors.grey[400],
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            filled: true,
            fillColor: const Color(0xFF1F1F1F),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide:
                  const BorderSide(color: Color(0xFF3B82F6), width: 1),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return 'N/A';
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('MMM d, yyyy').format(date);
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
        color = Colors.green;
        icon = Icons.verified;
        label = 'Verified';
        break;
      case 'processing':
        color = Colors.orange;
        icon = Icons.hourglass_top;
        label = 'Processing';
        break;
      case 'rejected':
        color = Colors.red;
        icon = Icons.cancel;
        label = 'Rejected';
        break;
      default:
        color = Colors.yellow;
        icon = Icons.shield_outlined;
        label = 'Pending';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 14),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final supabase = ref.watch(supabaseClientProvider);
    final user = supabase.auth.currentUser;
    final firstName = _profile?['first_name'] as String? ?? '';
    final lastName = _profile?['last_name'] as String? ?? '';
    final fullName = '$firstName $lastName'.trim();
    final avatarUrl = _profile?['avatar_url'] as String?;
    final displayName =
        fullName.isNotEmpty ? fullName : (user?.email ?? 'User');
    final avatarLetter =
        displayName.isNotEmpty ? displayName[0].toUpperCase() : 'U';

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      extendBodyBehindAppBar: true,
      appBar: GlassAppBar(
        title: 'Profile',
        actions: [
          GestureDetector(
            onTap: _showEditProfileSheet,
            child: Container(
              margin: const EdgeInsets.only(right: 12),
              child: ClipOval(
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Colors.white.withValues(alpha: 0.18),
                          Colors.white.withValues(alpha: 0.06),
                        ],
                      ),
                    ),
                    child: const Center(
                      child: Icon(Icons.edit, color: Colors.white, size: 16),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + kToolbarHeight + 8, 16, 16),
              child: Column(
                children: [
                  // Avatar + cover
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                          color: const Color(0xFF3B82F6).withOpacity(0.3)),
                    ),
                    child: Column(
                      children: [
                        // Cover pattern
                        Container(
                          height: 100,
                          decoration: BoxDecoration(
                            borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(16)),
                            color: const Color(0xFF171717),
                            border: Border.all(
                                color:
                                    const Color(0xFF3B82F6).withOpacity(0.2)),
                          ),
                          child: Center(
                            child: Icon(Icons.auto_awesome,
                                color: const Color(0xFF3B82F6).withOpacity(0.3),
                                size: 40),
                          ),
                        ),
                        Transform.translate(
                          offset: const Offset(0, -50),
                          child: Column(
                            children: [
                              // Avatar
                              Stack(
                                children: [
                                  Container(
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                          color: const Color(0xFF0A0A0A),
                                          width: 4),
                                    ),
                                    child: CircleAvatar(
                                      radius: 50,
                                      backgroundColor:
                                          Colors.white.withOpacity(0.2),
                                      backgroundImage: avatarUrl != null &&
                                              avatarUrl.isNotEmpty
                                          ? CachedNetworkImageProvider(
                                              avatarUrl)
                                          : null,
                                      child: avatarUrl == null ||
                                              avatarUrl.isEmpty
                                          ? Text(avatarLetter,
                                              style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 32))
                                          : null,
                                    ),
                                  ),
                                  Positioned(
                                    bottom: 0,
                                    right: 0,
                                    child: GestureDetector(
                                      onTap: _isUploading
                                          ? null
                                          : _pickAndUploadAvatar,
                                      child: Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF3B82F6),
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                              color: const Color(0xFF0A0A0A),
                                              width: 2),
                                        ),
                                        child: _isUploading
                                            ? const SizedBox(
                                                width: 16,
                                                height: 16,
                                                child:
                                                    CircularProgressIndicator(
                                                  color: Colors.white,
                                                  strokeWidth: 2,
                                                ),
                                              )
                                            : const Icon(Icons.camera_alt,
                                                color: Colors.white, size: 16),
                                      ),
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 12),

                              // Name
                              Text(
                                displayName,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Member since ${_formatDate(_profile?['created_at'])}',
                                style: TextStyle(
                                    color: Colors.grey[500], fontSize: 13),
                              ),
                              const SizedBox(height: 10),
                              _buildKycBadge(),
                              const SizedBox(height: 16),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Info card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF171717),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                          color: const Color(0xFF3B82F6).withOpacity(0.2)),
                    ),
                    child: Column(
                      children: [
                        _buildInfoRow(
                            Icons.email_outlined,
                            'Email',
                            user?.email ?? 'N/A',
                            const Color(0xFF3B82F6)),
                        if (_profile?['phone'] != null &&
                            (_profile!['phone'] as String).isNotEmpty)
                          _buildInfoRow(Icons.phone_outlined, 'Phone',
                              _profile!['phone'], Colors.green),
                        if (_profile?['address'] != null &&
                            (_profile!['address'] as String).isNotEmpty)
                          _buildInfoRow(Icons.location_on_outlined, 'Address',
                              _profile!['address'], Colors.red),
                        _buildInfoRow(
                          Icons.calendar_today_outlined,
                          'Joined',
                          _formatDate(_profile?['created_at']),
                          Colors.orange,
                          showDivider: false,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // My Listings
                  if (_userItems.isNotEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF171717),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                            color: Colors.green.withOpacity(0.2)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Text('My Listings',
                                      style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600)),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.green.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      '${_userItems.length} items',
                                      style: const TextStyle(
                                          color: Colors.green, fontSize: 12),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 10,
                              mainAxisSpacing: 10,
                              childAspectRatio: 4 / 3,
                            ),
                            itemCount: _userItems.length,
                            itemBuilder: (context, index) {
                              final item = _userItems[index];
                              final images = item['item_images'] as List?;
                              final imageUrl = images != null &&
                                      images.isNotEmpty
                                  ? images[0]['image_url'] as String?
                                  : null;
                              return ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: Stack(
                                  fit: StackFit.expand,
                                  children: [
                                    if (imageUrl != null)
                                      CachedNetworkImage(
                                        imageUrl: imageUrl,
                                        fit: BoxFit.cover,
                                      )
                                    else
                                      Container(
                                        color: const Color(0xFF262626),
                                        child: const Icon(
                                            Icons.image_not_supported,
                                            color: Colors.grey),
                                      ),
                                    Container(
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          begin: Alignment.topCenter,
                                          end: Alignment.bottomCenter,
                                          colors: [
                                            Colors.transparent,
                                            Colors.black.withOpacity(0.8),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      bottom: 8,
                                      left: 8,
                                      right: 8,
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            item['title'] ?? '',
                                            style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 12,
                                                fontWeight: FontWeight.w500),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          Text(
                                            '₦${NumberFormat('#,##0').format(item['price'] ?? 0)}',
                                            style: const TextStyle(
                                                color: Colors.green,
                                                fontSize: 12),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 80),
                ],
              ),
            ),
    );
  }

  Widget _buildInfoRow(
      IconData icon, String label, String value, Color color,
      {bool showDivider = true}) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: color.withOpacity(0.2)),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label,
                        style: TextStyle(
                            color: Colors.grey[500], fontSize: 12)),
                    const SizedBox(height: 2),
                    Text(value,
                        style: const TextStyle(
                            color: Colors.white, fontSize: 14)),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (showDivider)
          Divider(height: 1, color: Colors.white.withOpacity(0.05)),
      ],
    );
  }
}

import 'dart:convert';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/gigs_provider.dart';
import '../../../../core/widgets/glass_skeleton.dart';

class CreateGigModal extends ConsumerStatefulWidget {
  const CreateGigModal({super.key});

  @override
  ConsumerState<CreateGigModal> createState() => _CreateGigModalState();
}

class _CreateGigModalState extends ConsumerState<CreateGigModal> {
  final _formKey = GlobalKey<FormState>();

  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();
  final _durationController = TextEditingController();
  final _tagController = TextEditingController();

  String? _selectedCategory;
  String? _selectedLocation;
  final List<String> _tags = [];
  final List<String> _base64Images = [];
  bool _isSubmitting = false;

  final List<String> _categories = [
    'Tutoring',
    'Design & Creative',
    'Tech & Programming',
    'Writing & Translation',
    'Delivery & Moving',
    'Event Services',
    'Cleaning & Maintenance',
    'Photography',
    'Music & Audio',
    'Other'
  ];

  final List<String> _locations = [
    'On Campus',
    'Remote',
    'Campus Wide',
    'Library',
    'Student Center',
    'Dorms',
    'Off Campus'
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _priceController.dispose();
    _durationController.dispose();
    _tagController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    if (_base64Images.length >= 3) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You can only upload up to 3 images')),
      );
      return;
    }

    try {
      final picker = ImagePicker();
      final image = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );

      if (image != null) {
        final bytes = await image.readAsBytes();
        final base64String = 'data:image/jpeg;base64,${base64Encode(bytes)}';
        setState(() {
          _base64Images.add(base64String);
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to pick image: $e')),
      );
    }
  }

  void _removeImage(int index) {
    setState(() {
      _base64Images.removeAt(index);
    });
  }

  void _addTag() {
    final tag = _tagController.text.trim();
    if (tag.isNotEmpty && !_tags.contains(tag) && _tags.length < 8) {
      setState(() {
        _tags.add(tag);
        _tagController.clear();
      });
    }
  }

  void _removeTag(String tag) {
    setState(() {
      _tags.remove(tag);
    });
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a category')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final price = num.parse(_priceController.text.trim());

      await ref.read(gigsNotifierProvider.notifier).createGig(
        title: _titleController.text.trim(),
        description: _descController.text.trim(),
        category: _selectedCategory!,
        price: price,
        location: _selectedLocation,
        duration: _durationController.text.trim().isEmpty ? null : _durationController.text.trim(),
        tags: _tags,
        images: _base64Images,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Gig posted successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error creating gig: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = const Color(0xFF3B82F6);
    final textTheme = Theme.of(context).textTheme;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF0F0F13).withOpacity(0.85),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
            border: Border.all(
              color: Colors.white.withOpacity(0.08),
              width: 1.5,
            ),
          ),
          padding: EdgeInsets.fromLTRB(
            20,
            16,
            20,
            16 + MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Top drag indicator bar
              Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(2.5),
                ),
              ),
              const SizedBox(height: 16),
              
              // Header title
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Create New Gig',
                    style: textTheme.titleLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 22,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close, color: Colors.white70),
                  ),
                ],
              ),
              const Divider(color: Colors.white10),
              const SizedBox(height: 12),

              // Form fields wrapper
              Flexible(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title
                        _buildLabel('Gig Title *'),
                        _buildGlassTextField(
                          controller: _titleController,
                          hintText: 'e.g., Physics Tutoring for Undergrads',
                          maxLength: 80,
                          validator: (v) =>
                              (v == null || v.trim().isEmpty) ? 'Title is required' : null,
                        ),
                        const SizedBox(height: 16),

                        // Description
                        _buildLabel('Description *'),
                        _buildGlassTextField(
                          controller: _descController,
                          hintText: 'Explain your offering, experience, expectations...',
                          maxLines: 4,
                          maxLength: 500,
                          validator: (v) =>
                              (v == null || v.trim().isEmpty) ? 'Description is required' : null,
                        ),
                        const SizedBox(height: 16),

                        // Category Dropdown
                        _buildLabel('Category *'),
                        _buildGlassDropdown<String>(
                          value: _selectedCategory,
                          items: _categories,
                          hintText: 'Select category',
                          onChanged: (val) {
                            setState(() => _selectedCategory = val);
                          },
                        ),
                        const SizedBox(height: 16),

                        // Price & Duration side-by-side
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('Price (₦) *'),
                                  _buildGlassTextField(
                                    controller: _priceController,
                                    hintText: 'e.g., 5000',
                                    keyboardType: TextInputType.number,
                                    validator: (v) {
                                      if (v == null || v.trim().isEmpty) return 'Price required';
                                      if (num.tryParse(v) == null) return 'Enter a number';
                                      if (num.parse(v) <= 0) return 'Must be positive';
                                      return null;
                                    },
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildLabel('Duration (Optional)'),
                                  _buildGlassTextField(
                                    controller: _durationController,
                                    hintText: 'e.g., 2 hours, Daily',
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Location Dropdown
                        _buildLabel('Location (Optional)'),
                        _buildGlassDropdown<String>(
                          value: _selectedLocation,
                          items: _locations,
                          hintText: 'Select location preference',
                          onChanged: (val) {
                            setState(() => _selectedLocation = val);
                          },
                        ),
                        const SizedBox(height: 16),

                        // Image Upload Block
                        _buildLabel('Images (Max 3)'),
                        _buildImagePickerBlock(),
                        const SizedBox(height: 16),

                        // Tags
                        _buildLabel('Tags (Max 8)'),
                        Row(
                          children: [
                            Expanded(
                              child: _buildGlassTextField(
                                controller: _tagController,
                                hintText: 'Add a tag (e.g. Calculus)',
                                textInputAction: TextInputAction.done,
                                onSubmitted: (_) => _addTag(),
                              ),
                            ),
                            const SizedBox(width: 10),
                            GestureDetector(
                              onTap: _addTag,
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.04),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.15),
                                    width: 1.2,
                                  ),
                                  gradient: LinearGradient(
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                    colors: [
                                      Colors.white.withValues(alpha: 0.12),
                                      Colors.white.withValues(alpha: 0.03),
                                    ],
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: primaryColor.withValues(alpha: 0.15),
                                      blurRadius: 8,
                                      spreadRadius: 1,
                                    ),
                                  ],
                                ),
                                child: Icon(Icons.add, color: primaryColor, size: 20),
                              ),
                            ),
                          ],
                        ),
                        if (_tags.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _tags.map((tag) => _buildTagChip(tag)).toList(),
                          ),
                        ],
                        const SizedBox(height: 28),

                        // Submit Button
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  primaryColor.withValues(alpha: 0.25),
                                  primaryColor.withValues(alpha: 0.08),
                                ],
                              ),
                              border: Border.all(
                                color: primaryColor.withValues(alpha: 0.45),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: primaryColor.withValues(alpha: 0.25),
                                  blurRadius: 16,
                                  spreadRadius: 1,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: ElevatedButton(
                              onPressed: _isSubmitting ? null : _submitForm,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                shadowColor: Colors.transparent,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              child: _isSubmitting
                                  ? const GlassShimmer(
                                      child: Text(
                                        'Posting Gig...',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    )
                                  : const Text(
                                      'Post Gig Now',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6, left: 4),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white70,
          fontWeight: FontWeight.bold,
          fontSize: 13,
        ),
      ),
    );
  }

  Widget _buildGlassTextField({
    required TextEditingController controller,
    required String hintText,
    int maxLines = 1,
    int? maxLength,
    TextInputType keyboardType = TextInputType.text,
    TextInputAction textInputAction = TextInputAction.next,
    String? Function(String?)? validator,
    void Function(String)? onSubmitted,
  }) {
    return Focus(
      child: Builder(
        builder: (context) {
          final isFocused = Focus.of(context).hasFocus;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.03),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isFocused ? const Color(0xFF3B82F6) : Colors.white.withOpacity(0.08),
                width: 1.5,
              ),
              boxShadow: isFocused
                  ? [
                      BoxShadow(
                        color: const Color(0xFF3B82F6).withOpacity(0.15),
                        blurRadius: 10,
                        spreadRadius: 1,
                      )
                    ]
                  : [],
            ),
            child: TextFormField(
              controller: controller,
              maxLines: maxLines,
              maxLength: maxLength,
              keyboardType: keyboardType,
              textInputAction: textInputAction,
              onFieldSubmitted: onSubmitted,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              validator: validator,
              buildCounter: maxLength != null
                  ? (context, {required currentLength, required isFocused, maxLength}) => null
                  : null,
              decoration: InputDecoration(
                hintText: hintText,
                hintStyle: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 14),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                border: InputBorder.none,
                errorStyle: const TextStyle(color: Colors.redAccent, fontSize: 11),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildGlassDropdown<T>({
    required T? value,
    required List<T> items,
    required String hintText,
    required void Function(T?) onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: Colors.white.withOpacity(0.08),
          width: 1.5,
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          hint: Text(
            hintText,
            style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 14),
          ),
          dropdownColor: const Color(0xFF13131A),
          borderRadius: BorderRadius.circular(14),
          icon: const Icon(Icons.arrow_drop_down, color: Colors.white70),
          isExpanded: true,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          items: items.map((T item) {
            return DropdownMenuItem<T>(
              value: item,
              child: Text(item.toString()),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildImagePickerBlock() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.015),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.06), width: 1),
      ),
      child: Column(
        children: [
          if (_base64Images.length < 3)
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                width: double.infinity,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withOpacity(0.1), style: BorderStyle.solid),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.image_outlined, color: Colors.white60, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Upload Images (${_base64Images.length}/3)',
                      style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
          if (_base64Images.isNotEmpty) ...[
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.start,
              children: _base64Images.asMap().entries.map((entry) {
                final index = entry.key;
                final base64Image = entry.value;
                final commaIndex = base64Image.indexOf(',');
                final bytes = base64Decode(base64Image.substring(commaIndex + 1));
                
                return Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.memory(
                          bytes,
                          width: 80,
                          height: 80,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 2,
                        right: 2,
                        child: GestureDetector(
                          onTap: () => _removeImage(index),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.black54,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.close,
                              color: Colors.white,
                              size: 14,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTagChip(String tag) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.white.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            tag,
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(width: 6),
          GestureDetector(
            onTap: () => _removeTag(tag),
            child: const Icon(
              Icons.close,
              color: Colors.white60,
              size: 14,
            ),
          ),
        ],
      ),
    );
  }
}

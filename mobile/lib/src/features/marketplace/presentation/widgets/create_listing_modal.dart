import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../auth/auth_provider.dart';
import '../../../../core/widgets/glass_skeleton.dart';

const _categories = [
  'Food', 'Clothing', 'Beauty', 'Jewelry', 'Art', 'Baby',
  'Bags', 'Shoes', 'Perfumes', 'Tools', 'Books', 'Electronics',
  'Stationary', 'Others',
];

const _conditions = [
  ('new', 'New'),
  ('like_new', 'Like New'),
  ('good', 'Good'),
  ('fair', 'Fair'),
  ('poor', 'Poor'),
];

class CreateListingModal extends ConsumerStatefulWidget {
  const CreateListingModal({super.key});

  @override
  ConsumerState<CreateListingModal> createState() => _CreateListingModalState();
}

class _CreateListingModalState extends ConsumerState<CreateListingModal> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _priceController = TextEditingController();
  final _descriptionController = TextEditingController();

  String? _selectedCategory;
  String _selectedCondition = 'good';
  final List<XFile> _pickedImages = [];
  bool _isSubmitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _priceController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    if (_pickedImages.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 5 images allowed')),
      );
      return;
    }
    try {
      final picker = ImagePicker();
      final remaining = 5 - _pickedImages.length;
      final picked = await picker.pickMultiImage(
        limit: remaining,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );
      if (picked.isNotEmpty) {
        setState(() => _pickedImages.addAll(picked));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to pick images: $e')),
      );
    }
  }

  Future<void> _pickFromCamera() async {
    if (_pickedImages.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 5 images allowed')),
      );
      return;
    }
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );
      if (picked != null) {
        setState(() => _pickedImages.add(picked));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to take photo: $e')),
      );
    }
  }

  void _removeImage(int index) {
    setState(() => _pickedImages.removeAt(index));
  }

  void _showPickerSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF0F0F13).withOpacity(0.9),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              border: Border.all(color: Colors.white.withOpacity(0.08), width: 1.5),
            ),
            child: SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 8),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ListTile(
                    leading: const Icon(Icons.photo_library_outlined, color: Colors.white70),
                    title: const Text('Choose from Gallery', style: TextStyle(color: Colors.white)),
                    onTap: () {
                      Navigator.pop(ctx);
                      _pickImages();
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.camera_alt_outlined, color: Colors.white70),
                    title: const Text('Take a Photo', style: TextStyle(color: Colors.white)),
                    onTap: () {
                      Navigator.pop(ctx);
                      _pickFromCamera();
                    },
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_pickedImages.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one photo')),
      );
      return;
    }
    if (_selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a category')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final supabase = ref.read(supabaseClientProvider);
      final user = supabase.auth.currentUser;
      if (user == null) throw Exception('You must be signed in to create a listing');

      // 1. Insert item
      final itemRes = await supabase.from('items').insert({
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'price': double.parse(_priceController.text.trim()),
        'category': _selectedCategory,
        'condition': _selectedCondition,
        'seller_id': user.id,
        'created_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      }).select('id').single();

      final itemId = itemRes['id'] as String;

      // 2. Upload images to Supabase storage bucket 'item_images'
      for (int i = 0; i < _pickedImages.length; i++) {
        final file = File(_pickedImages[i].path);
        final ext = _pickedImages[i].path.split('.').last;
        final fileName = '$itemId/${DateTime.now().millisecondsSinceEpoch}_$i.$ext';

        await supabase.storage.from('item_images').upload(fileName, file);

        final publicUrl = supabase.storage
            .from('item_images')
            .getPublicUrl(fileName);

        await supabase.from('item_images').insert({
          'item_id': itemId,
          'image_url': publicUrl,
          'is_primary': i == 0,
        });
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Listing created! 🎉'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context, true); // signal refresh to caller
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
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
                    'Create New Listing',
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
                        // Photo Picker Section
                        _buildLabel('Photos (Max 5) *'),
                        _buildPhotoPickerBlock(),
                        const SizedBox(height: 16),

                        // Title
                        _buildLabel('Listing Title *'),
                        _buildGlassTextField(
                          controller: _titleController,
                          hintText: 'e.g., Apple iPhone 13 Pro Max',
                          maxLength: 80,
                          validator: (v) =>
                              (v == null || v.trim().isEmpty) ? 'Title is required' : null,
                        ),
                        const SizedBox(height: 16),

                        // Price
                        _buildLabel('Price (₦) *'),
                        _buildGlassTextField(
                          controller: _priceController,
                          hintText: 'e.g., 450000',
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) return 'Price required';
                            if (double.tryParse(v.trim()) == null) return 'Enter a valid number';
                            if (double.parse(v.trim()) <= 0) return 'Must be positive';
                            return null;
                          },
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

                        // Condition Selector Chips
                        _buildLabel('Condition *'),
                        _buildGlassConditionChips(),
                        const SizedBox(height: 16),

                        // Description
                        _buildLabel('Description *'),
                        _buildGlassTextField(
                          controller: _descriptionController,
                          hintText: 'Describe your item in detail (condition, quirks, warranty...)',
                          maxLines: 4,
                          maxLength: 800,
                          validator: (v) =>
                              (v == null || v.trim().isEmpty) ? 'Description is required' : null,
                        ),
                        const SizedBox(height: 28),

                        // Submit Button (Premium Liquid Glass)
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
                              onPressed: _isSubmitting ? null : _submit,
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
                                        'Publishing listing...',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    )
                                  : const Text(
                                      'Publish Listing',
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

  Widget _buildPhotoPickerBlock() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.015),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.06), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_pickedImages.length < 5)
            GestureDetector(
              onTap: _showPickerSheet,
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
                    const Icon(Icons.add_photo_alternate_outlined, color: Colors.white60, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      _pickedImages.isEmpty ? 'Add Photos (0/5)' : 'Add More Photos (${_pickedImages.length}/5)',
                      style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
          if (_pickedImages.isNotEmpty) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 80,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                itemCount: _pickedImages.length,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.file(
                            File(_pickedImages[index].path),
                            width: 80,
                            height: 80,
                            fit: BoxFit.cover,
                          ),
                        ),
                        if (index == 0)
                          Positioned(
                            bottom: 2,
                            left: 2,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.blue.withOpacity(0.85),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'Cover',
                                style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                              ),
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
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildGlassConditionChips() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _conditions.map((c) {
        final isSelected = _selectedCondition == c.$1;
        return GestureDetector(
          onTap: () => setState(() => _selectedCondition = c.$1),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected
                  ? const Color(0xFF3B82F6).withValues(alpha: 0.15)
                  : Colors.white.withOpacity(0.02),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected
                    ? const Color(0xFF3B82F6).withValues(alpha: 0.5)
                    : Colors.white.withOpacity(0.08),
                width: 1.2,
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
                        blurRadius: 8,
                        spreadRadius: 1,
                      )
                    ]
                  : [],
            ),
            child: Text(
              c.$2,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.white60,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                fontSize: 13,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

import 'dart:io';
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

class CreateListingScreen extends ConsumerStatefulWidget {
  const CreateListingScreen({super.key});

  @override
  ConsumerState<CreateListingScreen> createState() =>
      _CreateListingScreenState();
}

class _CreateListingScreenState extends ConsumerState<CreateListingScreen> {
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
    final picker = ImagePicker();
    final remaining = 5 - _pickedImages.length;
    final picked = await picker.pickMultiImage(limit: remaining);
    if (picked.isNotEmpty) {
      setState(() => _pickedImages.addAll(picked));
    }
  }

  Future<void> _pickFromCamera() async {
    if (_pickedImages.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 5 images allowed')),
      );
      return;
    }
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.camera);
    if (picked != null) {
      setState(() => _pickedImages.add(picked));
    }
  }

  void _removeImage(int index) {
    setState(() => _pickedImages.removeAt(index));
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
      if (user == null) throw Exception('You must be signed in');

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

      // 2. Upload images
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
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0A),
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Create Listing',
            style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16, top: 8, bottom: 8),
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                elevation: 0,
              ),
              child: _isSubmitting
                  ? const GlassShimmer(
                      child: Text(
                        'Posting...',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    )
                  : const Text('Post',
                      style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Photos ──────────────────────────────────────────────
              _buildSectionLabel('Photos', '${_pickedImages.length}/5'),
              const SizedBox(height: 10),
              _buildPhotoGrid(),
              const SizedBox(height: 24),

              // ── Title ───────────────────────────────────────────────
              _buildSectionLabel('Title', ''),
              const SizedBox(height: 10),
              TextFormField(
                controller: _titleController,
                style: const TextStyle(color: Colors.white),
                decoration: _inputDecoration('What are you selling?'),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Title is required' : null,
              ),
              const SizedBox(height: 16),

              // ── Price ───────────────────────────────────────────────
              _buildSectionLabel('Price', ''),
              const SizedBox(height: 10),
              TextFormField(
                controller: _priceController,
                style: const TextStyle(color: Colors.white),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: _inputDecoration('0.00', prefix: '₦'),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Price is required';
                  if (double.tryParse(v.trim()) == null)
                    return 'Enter a valid number';
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // ── Category ────────────────────────────────────────────
              _buildSectionLabel('Category', ''),
              const SizedBox(height: 10),
              _buildDropdown(
                value: _selectedCategory,
                hint: 'Select a category',
                items: _categories,
                onChanged: (v) => setState(() => _selectedCategory = v),
              ),
              const SizedBox(height: 16),

              // ── Condition ───────────────────────────────────────────
              _buildSectionLabel('Condition', ''),
              const SizedBox(height: 10),
              _buildConditionChips(),
              const SizedBox(height: 16),

              // ── Description ─────────────────────────────────────────
              _buildSectionLabel('Description', ''),
              const SizedBox(height: 10),
              TextFormField(
                controller: _descriptionController,
                style: const TextStyle(color: Colors.white),
                maxLines: 5,
                decoration:
                    _inputDecoration('Describe your item in detail...'),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Description is required' : null,
              ),

              const SizedBox(height: 32),

              // ── Submit ──────────────────────────────────────────────
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: _isSubmitting
                      ? const GlassShimmer(
                          child: Text('Publishing listing...',
                              style: TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold)),
                        )
                      : const Text('Publish Listing',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),

              const SizedBox(height: 60),
            ],
          ),
        ),
      ),
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  Widget _buildPhotoGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 1,
      ),
      itemCount: _pickedImages.length < 5
          ? _pickedImages.length + 1
          : _pickedImages.length,
      itemBuilder: (ctx, i) {
        if (i == _pickedImages.length && _pickedImages.length < 5) {
          return _buildAddPhotoTile();
        }
        return _buildImageTile(i);
      },
    );
  }

  Widget _buildAddPhotoTile() {
    return GestureDetector(
      onTap: () => _showPickerSheet(),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF171717),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: Colors.white.withOpacity(0.3),
              style: BorderStyle.solid),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_photo_alternate_outlined,
                color: Colors.white.withOpacity(0.8), size: 28),
            const SizedBox(height: 4),
            Text(
              _pickedImages.isEmpty ? 'Add Photos' : 'Add More',
              style: TextStyle(
                  color: Colors.white.withOpacity(0.8),
                  fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageTile(int index) {
    return Stack(
      fit: StackFit.expand,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.file(
            File(_pickedImages[index].path),
            fit: BoxFit.cover,
          ),
        ),
        if (index == 0)
          Positioned(
            bottom: 4,
            left: 4,
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text('Cover',
                  style: TextStyle(color: Colors.white, fontSize: 9)),
            ),
          ),
        Positioned(
          top: 4,
          right: 4,
          child: GestureDetector(
            onTap: () => _removeImage(index),
            child: Container(
              decoration: const BoxDecoration(
                  color: Colors.red, shape: BoxShape.circle),
              padding: const EdgeInsets.all(3),
              child: const Icon(Icons.close, color: Colors.white, size: 12),
            ),
          ),
        ),
      ],
    );
  }

  void _showPickerSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF171717),
      shape:
          const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined,
                  color: Colors.white),
              title: const Text('Choose from Gallery',
                  style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(ctx);
                _pickImages();
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined,
                  color: Colors.white),
              title: const Text('Take a Photo',
                  style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(ctx);
                _pickFromCamera();
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _buildConditionChips() {
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
                  ? Colors.white.withOpacity(0.15)
                  : const Color(0xFF171717),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                  color: isSelected
                      ? Colors.white
                      : Colors.white.withOpacity(0.1)),
            ),
            child: Text(
              c.$2,
              style: TextStyle(
                  color: isSelected ? Colors.white : Colors.grey,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  fontSize: 13),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildDropdown(
      {required String? value,
      required String hint,
      required List<String> items,
      required ValueChanged<String?> onChanged}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.grey[900]?.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: DropdownButton<String>(
        value: value,
        hint: Text(hint, style: TextStyle(color: Colors.grey[500])),
        isExpanded: true,
        underline: const SizedBox.shrink(),
        dropdownColor: const Color(0xFF1A1A1A),
        style: const TextStyle(color: Colors.white, fontSize: 15),
        icon: const Icon(Icons.keyboard_arrow_down, color: Colors.grey),
        items: items
            .map((e) => DropdownMenuItem(
                  value: e,
                  child: Text(e),
                ))
            .toList(),
        onChanged: onChanged,
      ),
    );
  }

  Widget _buildSectionLabel(String label, String trailing) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 15)),
        if (trailing.isNotEmpty)
          Text(trailing,
              style: TextStyle(color: Colors.grey[500], fontSize: 13)),
      ],
    );
  }

  InputDecoration _inputDecoration(String hint, {String? prefix}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: Colors.grey[600]),
      prefixText: prefix,
      prefixStyle:
          const TextStyle(color: Colors.grey, fontSize: 15),
      filled: true,
      fillColor: Colors.grey[900]?.withOpacity(0.5),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide:
              const BorderSide(color: Colors.white, width: 1)),
      errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red, width: 1)),
      focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red, width: 1)),
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );
  }
}

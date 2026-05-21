import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../auth/auth_provider.dart';
import '../../../../core/widgets/glass_app_bar.dart';
import '../../../../core/widgets/glass_skeleton.dart';

class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() =>
      _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isSubmitting = false;
  bool _showCurrent = false;
  bool _showNew = false;
  bool _showConfirm = false;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final newPassword = _newPasswordController.text;
    final confirmPassword = _confirmPasswordController.text;
    final currentPassword = _currentPasswordController.text;

    if (newPassword.length < 8) {
      _showSnackBar('Password must be at least 8 characters long', isError: true);
      return;
    }

    if (newPassword != confirmPassword) {
      _showSnackBar('New passwords do not match', isError: true);
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final supabase = ref.read(supabaseClientProvider);
      final user = supabase.auth.currentUser;

      if (user == null || user.email == null) {
        _showSnackBar('You need to be signed in to change your password',
            isError: true);
        return;
      }

      // Re-authenticate using current password
      final signInResponse = await supabase.auth.signInWithPassword(
        email: user.email!,
        password: currentPassword,
      );

      if (signInResponse.user == null) {
        _showSnackBar('Current password is incorrect', isError: true);
        return;
      }

      // Update password
      await supabase.auth.updateUser(
        UserAttributes(password: newPassword),
      );

      _showSnackBar('Password updated successfully!');
      if (mounted) Navigator.pop(context);
    } on AuthException catch (e) {
      _showSnackBar(e.message, isError: true);
    } catch (e) {
      _showSnackBar('Failed to update password: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showSnackBar(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red[700] : Colors.green[700],
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      extendBodyBehindAppBar: true,
      appBar: const GlassAppBar(title: 'Change Password'),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + kToolbarHeight + 16, 20, 20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF171717),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.orange.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.lock_outline,
                          color: Colors.orange, size: 22),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Update your password',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600)),
                          SizedBox(height: 2),
                          Text('Enter your current password to set a new one',
                              style:
                                  TextStyle(color: Colors.grey, fontSize: 13)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Current password
              _buildPasswordField(
                label: 'Current password',
                controller: _currentPasswordController,
                isVisible: _showCurrent,
                onToggle: () =>
                    setState(() => _showCurrent = !_showCurrent),
                hint: '••••••••',
              ),
              const SizedBox(height: 16),

              // New password
              _buildPasswordField(
                label: 'New password',
                controller: _newPasswordController,
                isVisible: _showNew,
                onToggle: () => setState(() => _showNew = !_showNew),
                hint: 'At least 8 characters',
              ),
              const SizedBox(height: 16),

              // Confirm password
              _buildPasswordField(
                label: 'Confirm new password',
                controller: _confirmPasswordController,
                isVisible: _showConfirm,
                onToggle: () =>
                    setState(() => _showConfirm = !_showConfirm),
                hint: 'Retype new password',
              ),
              const SizedBox(height: 28),

              // Submit button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3B82F6),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor:
                        const Color(0xFF3B82F6).withOpacity(0.5),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: _isSubmitting
                      ? const GlassShimmer(
                          child: Text('Updating password...',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 16)),
                        )
                      : const Text('Update Password',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
              const SizedBox(height: 16),

              Text(
                'Forgot your current password? Sign out and use the Forgot Password flow.',
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPasswordField({
    required String label,
    required TextEditingController controller,
    required bool isVisible,
    required VoidCallback onToggle,
    required String hint,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[400],
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: !isVisible,
          style: const TextStyle(color: Colors.white),
          validator: (v) => v == null || v.isEmpty ? 'Required' : null,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey[700]),
            filled: true,
            fillColor: const Color(0xFF1F1F1F),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                  color: Color(0xFF3B82F6), width: 1),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            suffixIcon: IconButton(
              icon: Icon(
                isVisible ? Icons.visibility_off : Icons.visibility,
                color: Colors.grey[600],
                size: 20,
              ),
              onPressed: onToggle,
            ),
          ),
        ),
      ],
    );
  }
}

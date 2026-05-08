import 'package:flutter/material.dart';
import '../../../../core/widgets/glass_app_bar.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _subjectCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _subjectCtrl.dispose();
    _messageCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);
    try {
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Feedback sent! Thank you.'),
          backgroundColor: Color(0xFF22C55E),
          behavior: SnackBarBehavior.floating,
        ));
        _nameCtrl.clear();
        _emailCtrl.clear();
        _subjectCtrl.clear();
        _messageCtrl.clear();
      }
    } catch (_) {}
    if (mounted) setState(() => _isSubmitting = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      extendBodyBehindAppBar: true,
      appBar: const GlassAppBar(title: 'Feedback'),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + kToolbarHeight + 12, 20, 20),
        child: Form(
          key: _formKey,
          child: Column(children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.purple.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.chat_bubble_outline,
                  color: Colors.purple, size: 36),
            ),
            const SizedBox(height: 16),
            const Text('We Value Your Feedback',
                style: TextStyle(color: Colors.white, fontSize: 20,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Text(
              'Your feedback helps us improve Campus Deal.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[500], fontSize: 13),
            ),
            const SizedBox(height: 28),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF171717),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.06)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _field('Name *', _nameCtrl,
                      validator: (v) => v!.isEmpty ? 'Required' : null),
                  const SizedBox(height: 14),
                  _field('Email *', _emailCtrl,
                      keyboard: TextInputType.emailAddress,
                      validator: (v) => v!.isEmpty ? 'Required' : null),
                  const SizedBox(height: 14),
                  _field('Subject', _subjectCtrl,
                      hint: 'Briefly describe your feedback'),
                  const SizedBox(height: 14),
                  _field('Message *', _messageCtrl,
                      hint: 'Provide as much detail as possible...',
                      lines: 5,
                      validator: (v) => v!.isEmpty ? 'Required' : null),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isSubmitting ? null : _submit,
                      icon: _isSubmitting
                          ? const SizedBox(width: 16, height: 16,
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2))
                          : const Icon(Icons.send, size: 16),
                      label: Text(_isSubmitting ? 'Sending...' : 'Send Feedback'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple.withOpacity(0.15),
                        foregroundColor: Colors.purple,
                        side: BorderSide(color: Colors.purple.withOpacity(0.3)),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 80),
          ]),
        ),
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl,
      {String? hint, TextInputType keyboard = TextInputType.text,
      int lines = 1, String? Function(String?)? validator}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: Colors.grey[400], fontSize: 13,
            fontWeight: FontWeight.w500)),
        const SizedBox(height: 6),
        TextFormField(
          controller: ctrl, keyboardType: keyboard, maxLines: lines,
          validator: validator,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey[700], fontSize: 13),
            filled: true, fillColor: const Color(0xFF0A0A0A),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: Colors.purple.withOpacity(0.2))),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: Colors.purple.withOpacity(0.15))),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: Colors.purple.withOpacity(0.4))),
            contentPadding: const EdgeInsets.symmetric(
                horizontal: 14, vertical: 12),
          ),
        ),
      ],
    );
  }
}

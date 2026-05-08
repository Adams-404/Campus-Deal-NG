import 'package:flutter/material.dart';
import '../../../../core/widgets/glass_app_bar.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  static const _sections = [
    {
      'icon': Icons.storage_outlined,
      'title': 'Data Collection',
      'color': 0xFFEAB308,
      'content':
          'We collect information that you provide directly to us, including:\n• Account information (name, email, phone number)\n• Profile information (profile picture, bio)\n• Listing information (photos, descriptions, prices)\n• Messages between users\n• Transaction information',
    },
    {
      'icon': Icons.visibility_outlined,
      'title': 'How We Use Your Data',
      'color': 0xFFEAB308,
      'content':
          'Your data helps us:\n• Provide and improve our services\n• Personalize your experience\n• Process your transactions\n• Send you important updates\n• Maintain platform security',
    },
    {
      'icon': Icons.person_outline,
      'title': 'Your Rights',
      'color': 0xFFEAB308,
      'content':
          'You have the right to:\n• Access your personal data\n• Correct inaccurate data\n• Request data deletion\n• Export your data\n• Opt-out of marketing communications',
    },
    {
      'icon': Icons.lock_outline,
      'title': 'Data Security',
      'color': 0xFFEAB308,
      'content':
          'We protect your data through:\n• Encryption in transit and at rest\n• Regular security audits\n• Access controls and monitoring\n• Secure data storage practices\n• Regular backups',
    },
    {
      'icon': Icons.notifications_outlined,
      'title': 'Communication Preferences',
      'color': 0xFFEAB308,
      'content':
          'You can control:\n• Push notifications\n• Email notifications\n• Marketing communications\n• In-app messages\n• Update frequency',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      extendBodyBehindAppBar: true,
      appBar: const GlassAppBar(title: 'Privacy Policy'),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + kToolbarHeight + 12, 16, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'At Campus Deal, we take your privacy seriously. This policy outlines how we collect, use, and protect your personal information.',
              style: TextStyle(color: Colors.grey[400], fontSize: 14, height: 1.6),
            ),
            const SizedBox(height: 20),
            ..._sections.map((s) => _ExpandSection(
                  icon: s['icon'] as IconData,
                  title: s['title'] as String,
                  content: s['content'] as String,
                  color: Color(s['color'] as int),
                )),
            const SizedBox(height: 24),
            Center(
              child: Column(children: [
                Text('Last updated: March 2025',
                    style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                const SizedBox(height: 4),
                Text('Questions? Contact us at the Help Center.',
                    style: TextStyle(color: Colors.grey[600], fontSize: 12)),
              ]),
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }
}

class _ExpandSection extends StatefulWidget {
  final IconData icon;
  final String title;
  final String content;
  final Color color;
  const _ExpandSection(
      {required this.icon, required this.title,
      required this.content, required this.color});

  @override
  State<_ExpandSection> createState() => _ExpandSectionState();
}

class _ExpandSectionState extends State<_ExpandSection> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF171717),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.06)),
        ),
        child: Column(children: [
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: widget.color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(widget.icon, color: widget.color, size: 16),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(widget.title,
                      style: const TextStyle(color: Colors.white,
                          fontSize: 14, fontWeight: FontWeight.w500)),
                ),
                AnimatedRotation(
                  turns: _expanded ? 0.5 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(Icons.keyboard_arrow_down,
                      color: Colors.grey[600], size: 20),
                ),
              ]),
            ),
          ),
          AnimatedCrossFade(
            duration: const Duration(milliseconds: 200),
            firstChild: const SizedBox.shrink(),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              child: Text(widget.content,
                  style: TextStyle(color: Colors.grey[400],
                      fontSize: 13, height: 1.6)),
            ),
            crossFadeState: _expanded
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
          ),
        ]),
      ),
    );
  }
}

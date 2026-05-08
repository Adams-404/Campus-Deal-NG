import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/widgets/glass_app_bar.dart';

class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});

  static const List<Map<String, String>> _faqs = [
    {
      'question': 'How do I list an item for sale?',
      'answer':
          "To list an item, tap the '+' button in the bottom navigation bar. Fill in the item details including photos, title, price, and description. Make sure to select the appropriate category and condition before listing.",
    },
    {
      'question': 'How do I message a seller?',
      'answer':
          "Click on any item you're interested in, then tap the 'Message Seller' button. You can discuss details, arrange meetups, and negotiate prices through our messaging system.",
    },
    {
      'question': 'Is my payment secure?',
      'answer':
          'We recommend using secure payment methods and meeting in safe, public locations for transactions. Never share your payment details through messages.',
    },
    {
      'question': 'How do I report an issue?',
      'answer':
          "If you encounter any problems, tap the 'Report' button on the item or user profile. Our team will review your report and take appropriate action within 24 hours.",
    },
    {
      'question': 'Can I edit my listing after posting?',
      'answer':
          "Yes, you can edit your listing anytime. Go to your profile, find the listing under 'My Items', and tap the 'Edit' button to make changes.",
    },
  ];

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      extendBodyBehindAppBar: true,
      appBar: const GlassAppBar(title: 'Help Center'),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + kToolbarHeight + 12, 16, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Quick support
            Row(
              children: [
                Expanded(
                  child: _buildSupportCard(
                    icon: Icons.email_outlined,
                    label: 'Email Support',
                    subtitle: 'support@campusdeal.ng',
                    color: Colors.teal,
                    onTap: () => _launchUrl('mailto:support@campusdeal.ng'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSupportCard(
                    icon: Icons.chat_outlined,
                    label: 'WhatsApp',
                    subtitle: '+234 906 706 3781',
                    color: Colors.teal,
                    onTap: () => _launchUrl('https://wa.me/09067063781'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 28),

            // FAQs
            const Text(
              'Frequently Asked Questions',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 14),
            ..._faqs.map((faq) => _FaqTile(
                  question: faq['question']!,
                  answer: faq['answer']!,
                )),

            const SizedBox(height: 32),

            // Still need help
            Center(
              child: Column(
                children: [
                  const Text(
                    'Still Need Help?',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Our support team is here to assist you with any questions or concerns.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey[500], fontSize: 13),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () =>
                        _launchUrl('mailto:support@campusdeal.ng'),
                    icon: const Icon(Icons.headset_mic_outlined, size: 18),
                    label: const Text('Contact Support'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3B82F6),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 12),
                    ),
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

  Widget _buildSupportCard({
    required IconData icon,
    required String label,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF171717),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 10),
            Text(label,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(subtitle,
                style: TextStyle(color: Colors.grey[500], fontSize: 11),
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _FaqTile extends StatefulWidget {
  final String question;
  final String answer;

  const _FaqTile({required this.question, required this.answer});

  @override
  State<_FaqTile> createState() => _FaqTileState();
}

class _FaqTileState extends State<_FaqTile> {
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
        child: Column(
          children: [
            InkWell(
              onTap: () => setState(() => _expanded = !_expanded),
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.teal.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.help_outline,
                          color: Colors.teal, size: 16),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(widget.question,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w500)),
                    ),
                    AnimatedRotation(
                      turns: _expanded ? 0.5 : 0,
                      duration: const Duration(milliseconds: 200),
                      child: Icon(Icons.keyboard_arrow_down,
                          color: Colors.grey[600], size: 20),
                    ),
                  ],
                ),
              ),
            ),
            AnimatedCrossFade(
              duration: const Duration(milliseconds: 200),
              firstChild: const SizedBox.shrink(),
              secondChild: Padding(
                padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                child: Text(
                  widget.answer,
                  style: TextStyle(
                      color: Colors.grey[400], fontSize: 13, height: 1.5),
                ),
              ),
              crossFadeState: _expanded
                  ? CrossFadeState.showSecond
                  : CrossFadeState.showFirst,
            ),
          ],
        ),
      ),
    );
  }
}

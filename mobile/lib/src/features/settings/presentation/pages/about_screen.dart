import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/widgets/glass_app_bar.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  Future<void> _launch(String url) async {
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
      appBar: const GlassAppBar(title: 'About Campus Deal'),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + kToolbarHeight + 12, 16, 16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Mission
          _card(
            icon: Icons.flag_outlined,
            title: 'Our Mission',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Campus Deal connects students, local businesses, and peers through a single ecosystem that offers personalized deals, peer-to-peer buying/selling, and on-campus job opportunities.',
                  style: TextStyle(color: Colors.grey[400], fontSize: 13, height: 1.6),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.cyan.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.cyan.withOpacity(0.2)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('🌍 Our Vision',
                          style: TextStyle(color: Colors.cyan,
                              fontWeight: FontWeight.w600, fontSize: 13)),
                      const SizedBox(height: 6),
                      Text(
                        'To become the go-to lifestyle and opportunity platform for students across Nigeria and Africa.',
                        style: TextStyle(color: Colors.cyan[200], fontSize: 12, height: 1.5),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Features
          _card(
            icon: Icons.star_outline,
            title: 'Key Features',
            child: Column(
              children: [
                _featureItem('Campus Marketplace', 'Buy, sell, or trade items within your university community.'),
                _featureItem('Gig Economy Hub', 'Find or post on-campus jobs and freelance opportunities.'),
                _featureItem('Student Verification', 'Secure platform with verified students only.'),
                _featureItem('Secure Messaging', 'Built-in chat without sharing personal info.'),
                _featureItem('Smart Recommendations', 'Personalized suggestions based on your interests.'),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Team
          _card(
            icon: Icons.people_outline,
            title: 'Meet the Founder',
            child: Row(children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(40),
                child: Builder(
                  builder: (context) {
                    const tokenPart1 = 'eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lN2M5ZWEwNS1hZDNhLTQwYjgtODQ0Yy0yODJhYTNhMTVjYTMiLCJhbGciOiJIUzI1NiJ9';
                    const tokenPart2 = 'eyJ1cmwiOiJ0ZWFtL011aGFtbWFkLUFkYW11LnBuZyIsImlhdCI6MTc1MzEzNDI5NCwiZXhwIjo5MTMyNTU4Mjk0fQ';
                    const tokenPart3 = 'yy8YwgSWm6QW7OLLVMV2_3u4N_AWOko0mSa6Iw4tkF8';
                    const imageUrl = 'https://llrmbyafcffporpjtbka.supabase.co/storage/v1/object/sign/team/Muhammad-Adamu.png?token=$tokenPart1.$tokenPart2.$tokenPart3';
                    return CachedNetworkImage(
                      imageUrl: imageUrl,
                      width: 64, height: 64, fit: BoxFit.cover,
                      placeholder: (_, __) => Container(width: 64, height: 64,
                          color: const Color(0xFF262626)),
                      errorWidget: (_, __, ___) => Container(width: 64, height: 64,
                          color: const Color(0xFF262626),
                          child: const Icon(Icons.person, color: Colors.grey)),
                    );
                  },
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Muhammad Aliyu',
                        style: TextStyle(color: Colors.white,
                            fontWeight: FontWeight.w600, fontSize: 15)),
                    const SizedBox(height: 2),
                    Text('Founder and CEO',
                        style: TextStyle(color: Colors.grey[500], fontSize: 13)),
                    const SizedBox(height: 8),
                    Row(children: [
                      _socialIcon(Icons.link, () => _launch('https://github.com/Adams-404')),
                      const SizedBox(width: 12),
                      _socialIcon(Icons.alternate_email, () => _launch('https://x.com/_Adam_Alee')),
                      const SizedBox(width: 12),
                      _socialIcon(Icons.email_outlined, () => _launch('mailto:muhammadadamualiyu33@gmail.com')),
                    ]),
                  ],
                ),
              ),
            ]),
          ),
          const SizedBox(height: 12),

          // Contact
          Center(
            child: Column(children: [
              const SizedBox(height: 8),
              ElevatedButton.icon(
                onPressed: () => _launch('mailto:muhammadadamualiyu33@gmail.com'),
                icon: const Icon(Icons.email_outlined, size: 18),
                label: const Text('Contact Us'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3B82F6),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
              const SizedBox(height: 20),
              Text('Version 1.0.0', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
              const SizedBox(height: 4),
              Text('© 2025 Campus Deal. All rights reserved.',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12)),
            ]),
          ),
          const SizedBox(height: 80),
        ]),
      ),
    );
  }

  Widget _card({required IconData icon, required String title, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF171717),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, color: Colors.cyan, size: 18),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(color: Colors.white,
              fontSize: 16, fontWeight: FontWeight.w600)),
        ]),
        const SizedBox(height: 14),
        child,
      ]),
    );
  }

  Widget _featureItem(String title, String desc) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          margin: const EdgeInsets.only(top: 6),
          width: 6, height: 6,
          decoration: const BoxDecoration(
              color: Colors.cyan, shape: BoxShape.circle),
        ),
        const SizedBox(width: 10),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(color: Colors.white,
                fontSize: 13, fontWeight: FontWeight.w500)),
            const SizedBox(height: 2),
            Text(desc, style: TextStyle(color: Colors.grey[500], fontSize: 12)),
          ],
        )),
      ]),
    );
  }

  Widget _socialIcon(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Icon(icon, color: Colors.grey[500], size: 18),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

enum AppMode {
  marketplace,
  gigs,
  events,
  news,
  study,
  lostfound,
  accommodation,
}

/// Metadata for each app mode — icon, label, color, availability.
class AppModeInfo {
  final AppMode mode;
  final String label;
  final String description;
  final FaIconData icon;
  final Color color;
  final bool available;

  const AppModeInfo({
    required this.mode,
    required this.label,
    required this.description,
    required this.icon,
    required this.color,
    required this.available,
  });
}

/// All app modes with their metadata.
const _kAccentBlue = Color(0xFF3B82F6);

final List<AppModeInfo> appModes = [
  AppModeInfo(
    mode: AppMode.marketplace,
    label: 'Marketplace',
    description: 'Buy & sell on campus',
    icon: FontAwesomeIcons.bagShopping,
    color: const Color(0xFF22C55E), // green
    available: true,
  ),
  AppModeInfo(
    mode: AppMode.gigs,
    label: 'Gigs',
    description: 'Find & post gigs',
    icon: FontAwesomeIcons.briefcase,
    color: const Color(0xFFF59E0B), // amber
    available: true,
  ),
  AppModeInfo(
    mode: AppMode.events,
    label: 'Events',
    description: 'Campus events',
    icon: FontAwesomeIcons.calendarDays,
    color: const Color(0xFFF97316), // orange
    available: false,
  ),
  AppModeInfo(
    mode: AppMode.news,
    label: 'News',
    description: 'Campus news',
    icon: FontAwesomeIcons.newspaper,
    color: const Color(0xFFEC4899), // pink
    available: false,
  ),
  AppModeInfo(
    mode: AppMode.study,
    label: 'Study',
    description: 'Study resources',
    icon: FontAwesomeIcons.bookOpen,
    color: const Color(0xFFEF4444), // red
    available: false,
  ),
  AppModeInfo(
    mode: AppMode.lostfound,
    label: 'Lost & Found',
    description: 'Lost items portal',
    icon: FontAwesomeIcons.magnifyingGlass,
    color: const Color(0xFF14B8A6), // teal
    available: false,
  ),
  AppModeInfo(
    mode: AppMode.accommodation,
    label: 'Rooms',
    description: 'Find roommates',
    icon: FontAwesomeIcons.house,
    color: const Color(0xFF8B5CF6), // purple
    available: false,
  ),
];

/// Get mode info for a specific mode.
AppModeInfo getModeInfo(AppMode mode) {
  return appModes.firstWhere((m) => m.mode == mode);
}

class AppModeNotifier extends Notifier<AppMode> {
  @override
  AppMode build() => AppMode.marketplace;

  void setMode(AppMode mode) => state = mode;
}

final appModeProvider = NotifierProvider<AppModeNotifier, AppMode>(AppModeNotifier.new);

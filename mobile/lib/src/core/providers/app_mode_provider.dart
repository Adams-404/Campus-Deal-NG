import 'package:flutter_riverpod/flutter_riverpod.dart';

enum AppMode {
  marketplace,
  gigs,
  events,
  news,
  study,
  lostfound,
  accommodation,
}

class AppModeNotifier extends Notifier<AppMode> {
  @override
  AppMode build() => AppMode.marketplace;

  void setMode(AppMode mode) => state = mode;
}

final appModeProvider = NotifierProvider<AppModeNotifier, AppMode>(AppModeNotifier.new);

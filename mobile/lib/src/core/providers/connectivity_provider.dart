import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../utils/connectivity_utils.dart';

enum ConnectivityStatus {
  connected,
  disconnected,
  checking,
}

class ConnectivityNotifier extends StateNotifier<ConnectivityStatus> {
  ConnectivityNotifier() : super(ConnectivityStatus.checking) {
    checkConnection();
    // Check periodically every 10 seconds to auto-detect connection restore
    _timer = Timer.periodic(const Duration(seconds: 10), (_) => checkConnection());
  }

  Timer? _timer;
  bool _isChecking = false;

  Future<void> checkConnection() async {
    if (_isChecking) return;
    _isChecking = true;
    
    final isOnline = await ConnectivityUtils.hasInternetConnection();
    
    if (isOnline) {
      state = ConnectivityStatus.connected;
    } else {
      state = ConnectivityStatus.disconnected;
    }
    _isChecking = false;
  }

  Future<bool> forceCheck() async {
    state = ConnectivityStatus.checking;
    // Brief delay to feel premium and intentional
    await Future.delayed(const Duration(milliseconds: 600));
    final isOnline = await ConnectivityUtils.hasInternetConnection();
    state = isOnline ? ConnectivityStatus.connected : ConnectivityStatus.disconnected;
    return isOnline;
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

final connectivityProvider = StateNotifierProvider<ConnectivityNotifier, ConnectivityStatus>((ref) {
  return ConnectivityNotifier();
});

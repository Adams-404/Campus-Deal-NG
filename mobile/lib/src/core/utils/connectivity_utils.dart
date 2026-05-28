import 'dart:io';
import 'package:flutter/foundation.dart';

class ConnectivityUtils {
  /// Check if the device has actual internet connection by pinging dns.google or similar host.
  /// This is robust, platform-agnostic, and avoids mock cell-tower fake connections.
  static Future<bool> hasInternetConnection() async {
    if (kIsWeb) {
      // In web, standard browser behaviors apply. We assume true for startup 
      // and let the browser's own request fail/succeed naturally.
      return true;
    }
    try {
      // Lookup google DNS which is highly reliable
      final result = await InternetAddress.lookup('dns.google').timeout(const Duration(seconds: 4));
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } catch (_) {
      try {
        // Fallback to cloudflare dns if dns.google fails or is blocked (e.g. in some regions)
        final result = await InternetAddress.lookup('one.one.one.one').timeout(const Duration(seconds: 4));
        return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
      } catch (_) {
        return false;
      }
    }
  }
}

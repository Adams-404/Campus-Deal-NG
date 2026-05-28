import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../auth/auth_provider.dart';
import '../../../../core/providers/connectivity_provider.dart';

class PendingMessage {
  final String tempId;
  final String content;
  final String senderId;
  final String conversationId;
  final DateTime createdAt;

  PendingMessage({
    required this.tempId,
    required this.content,
    required this.senderId,
    required this.conversationId,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'tempId': tempId,
        'content': content,
        'senderId': senderId,
        'conversationId': conversationId,
        'createdAt': createdAt.toIso8601String(),
      };

  factory PendingMessage.fromJson(Map<String, dynamic> json) => PendingMessage(
        tempId: json['tempId'] as String,
        content: json['content'] as String,
        senderId: json['sender_id'] as String,
        conversationId: json['conversationId'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

class OfflineMessagesNotifier extends StateNotifier<List<PendingMessage>> {
  OfflineMessagesNotifier(this._ref) : super([]) {
    _loadFromPrefs().then((_) {
      // Listen to connectivity status changes to trigger automatic sync
      _ref.listen<ConnectivityStatus>(connectivityProvider, (previous, next) {
        if (next == ConnectivityStatus.connected) {
          syncPendingMessages();
        }
      });
    });
  }

  final Ref _ref;
  static const _prefsKey = 'pending_offline_messages';
  bool _isSyncing = false;

  Future<void> _loadFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = prefs.getStringList(_prefsKey);
      if (list != null) {
        state = list
            .map((item) => PendingMessage.fromJson(jsonDecode(item) as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('Error loading pending offline messages: $e');
    }
  }

  Future<void> _saveToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = state.map((item) => jsonEncode(item.toJson())).toList();
      await prefs.setStringList(_prefsKey, list);
    } catch (e) {
      debugPrint('Error saving pending offline messages: $e');
    }
  }

  Future<void> queueMessage(PendingMessage message) async {
    state = [...state, message];
    await _saveToPrefs();
  }

  Future<void> removeMessage(String tempId) async {
    state = state.where((m) => m.tempId != tempId).toList();
    await _saveToPrefs();
  }

  Future<void> syncPendingMessages() async {
    if (state.isEmpty || _isSyncing) return;
    _isSyncing = true;

    try {
      final supabase = _ref.read(supabaseClientProvider);
      final pendingCopy = List<PendingMessage>.from(state);

      for (final msg in pendingCopy) {
        try {
          final timestamp = msg.createdAt.toIso8601String();
          
          // 1. Insert message to Supabase
          await supabase.from('messages').insert({
            'conversation_id': msg.conversationId,
            'content': msg.content,
            'sender_id': msg.senderId,
            'created_at': timestamp,
          });

          // 2. Update conversation last_message
          await supabase.from('conversations').update({
            'last_message': msg.content,
            'last_message_at': timestamp,
          }).eq('id', msg.conversationId);

          // 3. Remove from local memory state and SharedPreferences
          await removeMessage(msg.tempId);
        } catch (e) {
          debugPrint('Failed to sync offline message ${msg.tempId}: $e');
          // If we fail, stop the batch to retry later (e.g. if we went offline again)
          break;
        }
      }
    } finally {
      _isSyncing = false;
    }
  }
}

final offlineMessagesProvider = StateNotifierProvider<OfflineMessagesNotifier, List<PendingMessage>>((ref) {
  return OfflineMessagesNotifier(ref);
});

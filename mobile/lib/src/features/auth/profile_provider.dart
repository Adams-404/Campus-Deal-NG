import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'auth_provider.dart';

final profileProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final supabase = ref.watch(supabaseClientProvider);
  final user = ref.watch(currentUserProvider);
  
  if (user == null) return null;

  final response = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, phone')
      .eq('id', user.id)
      .maybeSingle();
      
  return response;
});

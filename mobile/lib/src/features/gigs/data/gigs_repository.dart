import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/models/gig_model.dart';

class GigsRepository {
  final SupabaseClient _client;

  GigsRepository(this._client);

  Future<List<Gig>> fetchGigs({String? category, String? userId, String? status}) async {
    var query = _client.from('gigs').select('''
        *,
        gig_images (image_url, is_primary),
        profiles:user_id (id, first_name, last_name, avatar_url)
      ''').eq('is_active', true).neq('status', 'deleted');

    if (category != null) {
      query = query.eq('category', category);
    }
    if (userId != null) {
      query = query.eq('user_id', userId);
    }
    if (status != null) {
      query = query.eq('status', status);
    }

    final data = await query.order('created_at', ascending: false);
    return (data as List).map((e) => Gig.fromJson(e)).toList();
  }

  Future<Gig> fetchGigById(String id) async {
    final data = await _client.from('gigs').select('''
        *,
        gig_images (image_url, is_primary),
        profiles:user_id (id, first_name, last_name, avatar_url)
      ''').eq('id', id).single();
    return Gig.fromJson(data);
  }

  Future<List<GigApplication>> fetchApplications() async {
    final user = _client.auth.currentUser;
    if (user == null) return [];

    final data = await _client.from('gig_applications').select('''
        *,
        gig:gig_id (
          *,
          gig_images (image_url, is_primary),
          profiles:user_id (id, first_name, last_name, avatar_url)
        ),
        profile:applicant_id (id, first_name, last_name, avatar_url)
      ''').eq('applicant_id', user.id).order('created_at', ascending: false);

    return (data as List).map((e) => GigApplication.fromJson(e)).toList();
  }

  Future<void> deleteGig(String id) async {
    await _client.from('gigs').update({
      'status': 'deleted',
      'is_active': false,
    }).eq('id', id);
  }
}

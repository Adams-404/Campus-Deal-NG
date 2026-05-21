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

  Future<Gig> createGig({
    required String title,
    required String description,
    required String category,
    required num price,
    String? location,
    String? duration,
    List<String>? tags,
    List<String>? images,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('You must be logged in to create a gig');

    final newGigData = await _client.from('gigs').insert({
      'title': title,
      'description': description,
      'category': category,
      'price': price,
      'location': location,
      'duration': duration,
      'tags': tags ?? [],
      'user_id': user.id,
      'is_active': true,
      'status': 'active',
    }).select().single();

    final newGigId = newGigData['id'] as String;

    if (images != null && images.isNotEmpty) {
      final imageRecords = images.asMap().entries.map((entry) {
        final index = entry.key;
        final url = entry.value;
        return {
          'gig_id': newGigId,
          'image_url': url,
          'is_primary': index == 0,
        };
      }).toList();

      await _client.from('gig_images').insert(imageRecords);
    }

    return fetchGigById(newGigId);
  }
}

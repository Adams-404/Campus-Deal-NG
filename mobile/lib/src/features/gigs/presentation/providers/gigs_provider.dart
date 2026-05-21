import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../domain/models/gig_model.dart';
import '../../data/gigs_repository.dart';

final gigsRepositoryProvider = Provider<GigsRepository>((ref) {
  return GigsRepository(Supabase.instance.client);
});

final gigsNotifierProvider = AsyncNotifierProvider<GigsNotifier, List<Gig>>(() {
  return GigsNotifier();
});

class GigsNotifier extends AsyncNotifier<List<Gig>> {
  static List<Gig>? _cachedGigs;

  @override
  Future<List<Gig>> build() async {
    if (_cachedGigs != null && _cachedGigs!.isNotEmpty) {
      _fetchBackground();
      return _cachedGigs!;
    }

    return ref.read(gigsRepositoryProvider).fetchGigs().then((gigs) {
      _cachedGigs = gigs;
      return gigs;
    });
  }

  Future<void> fetchGigs() async {
    state = const AsyncValue.loading();
    try {
      final realGigs = await ref.read(gigsRepositoryProvider).fetchGigs();
      _cachedGigs = realGigs;
      state = AsyncValue.data(realGigs);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  void _fetchBackground() async {
    try {
      final realGigs = await ref.read(gigsRepositoryProvider).fetchGigs();
      _cachedGigs = realGigs;
      state = AsyncValue.data(realGigs);
    } catch (e) {
      debugPrint('Background fetch error: $e');
    }
  }

  Future<void> deleteGig(String id) async {
    try {
      await ref.read(gigsRepositoryProvider).deleteGig(id);
      _cachedGigs = null; // reset cache
      ref.invalidateSelf();
      ref.invalidate(userGigsProvider);
    } catch (e) {
      debugPrint('Error deleting gig: $e');
      rethrow;
    }
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
    try {
      final gig = await ref.read(gigsRepositoryProvider).createGig(
        title: title,
        description: description,
        category: category,
        price: price,
        location: location,
        duration: duration,
        tags: tags,
        images: images,
      );
      _cachedGigs = null; // reset cache
      ref.invalidateSelf();
      ref.invalidate(userGigsProvider);
      return gig;
    } catch (e) {
      debugPrint('Error creating gig: $e');
      rethrow;
    }
  }
}

// Provider for fetching gigs posted by the current user
final userGigsProvider = FutureProvider<List<Gig>>((ref) async {
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) return [];
  return ref.read(gigsRepositoryProvider).fetchGigs(userId: user.id);
});

// Provider for fetching gig applications made by the current user
final userApplicationsProvider = FutureProvider<List<GigApplication>>((
  ref,
) async {
  return ref.read(gigsRepositoryProvider).fetchApplications();
});

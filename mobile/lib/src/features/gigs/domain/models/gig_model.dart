import 'package:freezed_annotation/freezed_annotation.dart';

part 'gig_model.freezed.dart';
part 'gig_model.g.dart';

@freezed
class Gig with _$Gig {
  const factory Gig({
    required String id,
    required String title,
    String? description,
    required String category,
    required num price,
    String? location,
    String? duration,
    @Default(0) num rating,
    @JsonKey(name: 'reviews_count') @Default(0) int reviewsCount,
    @Default([]) List<String> tags,
    @JsonKey(name: 'user_id') required String userId,
    @JsonKey(name: 'is_active') @Default(true) bool isActive,
    required String status,
    @JsonKey(name: 'created_at') required DateTime createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
    // Joined data
    @JsonKey(name: 'gig_images') @Default([]) List<GigImage> gigImages,
    @JsonKey(name: 'profiles') GigProfile? profile,
  }) = _Gig;

  factory Gig.fromJson(Map<String, dynamic> json) => _$GigFromJson(json);
}

@freezed
class GigImage with _$GigImage {
  const factory GigImage({
    @JsonKey(name: 'image_url') required String imageUrl,
    @JsonKey(name: 'is_primary') @Default(false) bool isPrimary,
  }) = _GigImage;

  factory GigImage.fromJson(Map<String, dynamic> json) =>
      _$GigImageFromJson(json);
}

@freezed
class GigProfile with _$GigProfile {
  const factory GigProfile({
    required String id,
    @JsonKey(name: 'first_name') String? firstName,
    @JsonKey(name: 'last_name') String? lastName,
    @JsonKey(name: 'avatar_url') String? avatarUrl,
  }) = _GigProfile;

  factory GigProfile.fromJson(Map<String, dynamic> json) =>
      _$GigProfileFromJson(json);
}

@freezed
class GigApplication with _$GigApplication {
  const factory GigApplication({
    required String id,
    @JsonKey(name: 'gig_id') required String gigId,
    @JsonKey(name: 'applicant_id') required String applicantId,
    String? message,
    required String status,
    @JsonKey(name: 'created_at') required DateTime createdAt,
    @JsonKey(name: 'updated_at') DateTime? updatedAt,
    Gig? gig,
    GigProfile? profile,
  }) = _GigApplication;

  factory GigApplication.fromJson(Map<String, dynamic> json) =>
      _$GigApplicationFromJson(json);
}

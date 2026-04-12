import 'package:freezed_annotation/freezed_annotation.dart';

part 'product.freezed.dart';
part 'product.g.dart';

@freezed
class Product with _$Product {
  const factory Product({
    required String id,
    required String title,
    required double price,
    required String category,
    required List<String> images,
    @JsonKey(name: 'created_at') required DateTime createdAt,
    String? description,
    String? condition,
    String? status,
    @JsonKey(name: 'seller_id') String? sellerId,
    Seller? seller,
  }) = _Product;

  factory Product.fromJson(Map<String, dynamic> json) => _$ProductFromJson(json);
}

@freezed
class Seller with _$Seller {
  const factory Seller({
    required String id,
    @JsonKey(name: 'full_name') String? fullName,
    @JsonKey(name: 'first_name') String? firstName,
    @JsonKey(name: 'last_name') String? lastName,
    @JsonKey(name: 'avatar_url') String? avatarUrl,
  }) = _Seller;

  factory Seller.fromJson(Map<String, dynamic> json) => _$SellerFromJson(json);
}

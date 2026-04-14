import 'package:freezed_annotation/freezed_annotation.dart';
import '../../../home/domain/models/product.dart';

part 'saved_item.freezed.dart';
part 'saved_item.g.dart';

@freezed
class SavedItem with _$SavedItem {
  const factory SavedItem({
    required String id,
    @JsonKey(name: 'item_id') required String itemId,
    @JsonKey(name: 'user_id') required String userId,
    @JsonKey(name: 'created_at') required DateTime createdAt,
    Product? item,
  }) = _SavedItem;

  factory SavedItem.fromJson(Map<String, dynamic> json) =>
      _$SavedItemFromJson(json);
}

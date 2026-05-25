class ChatMessage {
  final String id;
  final String content;
  final String senderId;
  final String conversationId;
  final DateTime createdAt;
  final String? imageUrl;
  final String? itemId;
  final String? itemTitle;
  final double? itemPrice;
  final String? itemImageUrl;

  const ChatMessage({
    required this.id,
    required this.content,
    required this.senderId,
    required this.conversationId,
    required this.createdAt,
    this.imageUrl,
    this.itemId,
    this.itemTitle,
    this.itemPrice,
    this.itemImageUrl,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json, String convId) {
    final item = json['items'] as Map<String, dynamic>?;
    final images = item?['item_images'] as List<dynamic>?;
    return ChatMessage(
      id: json['id'] as String,
      content: json['content'] as String,
      senderId: json['sender_id'] as String,
      conversationId: convId,
      createdAt: DateTime.parse(json['created_at'] as String),
      imageUrl: json['image_url'] as String?,
      itemId: json['item_id'] as String?,
      itemTitle: item?['title'] as String?,
      itemPrice: (item?['price'] as num?)?.toDouble(),
      itemImageUrl: images?.isNotEmpty == true
          ? images!.first['image_url'] as String?
          : null,
    );
  }
}

class Conversation {
  final String id;
  final String buyerId;
  final String sellerId;
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final ConvProfile otherUser;
  final String? itemTitle;
  final double? itemPrice;
  final String? itemImageUrl;
  final String? gigId;

  const Conversation({
    required this.id,
    required this.buyerId,
    required this.sellerId,
    this.lastMessage,
    this.lastMessageAt,
    required this.otherUser,
    this.itemTitle,
    this.itemPrice,
    this.itemImageUrl,
    this.gigId,
  });
}

class ConvProfile {
  final String id;
  final String? firstName;
  final String? lastName;
  final String? avatarUrl;

  const ConvProfile({
    required this.id,
    this.firstName,
    this.lastName,
    this.avatarUrl,
  });

  String get displayName {
    final f = firstName ?? '';
    final l = lastName ?? '';
    final full = '$f $l'.trim();
    return full.isNotEmpty ? full : 'User';
  }

  String get initials => displayName[0].toUpperCase();
}

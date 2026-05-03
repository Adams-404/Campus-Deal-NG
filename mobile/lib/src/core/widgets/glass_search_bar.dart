import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class GlassSearchBar extends StatefulWidget {
  final TextEditingController controller;
  final String hintText;
  final VoidCallback? onClear;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;

  const GlassSearchBar({
    super.key,
    required this.controller,
    this.hintText = 'Search items...',
    this.onClear,
    this.onChanged,
    this.onSubmitted,
  });

  @override
  State<GlassSearchBar> createState() => _GlassSearchBarState();
}

class _GlassSearchBarState extends State<GlassSearchBar> {
  bool _isFocused = false;
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    _focusNode.addListener(() {
      setState(() {
        _isFocused = _focusNode.hasFocus;
      });
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
      height: 48,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          if (_isFocused)
            BoxShadow(
              color: const Color(0xFF3B82F6).withOpacity(0.2),
              blurRadius: 15,
              spreadRadius: 2,
            ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white.withOpacity(_isFocused ? 0.15 : 0.08),
                  Colors.white.withOpacity(_isFocused ? 0.05 : 0.02),
                ],
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: _isFocused 
                    ? const Color(0xFF3B82F6).withOpacity(0.6) 
                    : Colors.white.withOpacity(0.15),
                width: 1.2,
              ),
            ),
            child: TextField(
              controller: widget.controller,
              focusNode: _focusNode,
              onChanged: widget.onChanged,
              onSubmitted: widget.onSubmitted,
              style: const TextStyle(
                color: Colors.white, 
                fontSize: 14,
                fontWeight: FontWeight.w400,
                letterSpacing: 0.2,
              ),
              decoration: InputDecoration(
                filled: false, // Ensure we don't use the theme's dark background
                hintText: widget.hintText,
                hintStyle: TextStyle(
                  color: Colors.white.withOpacity(0.5), 
                  fontSize: 14,
                  fontWeight: FontWeight.w300,
                ),
                prefixIcon: Container(
                  padding: const EdgeInsets.all(12),
                  child: FaIcon(
                    FontAwesomeIcons.magnifyingGlass,
                    color: _isFocused ? const Color(0xFF3B82F6) : Colors.white.withOpacity(0.6),
                    size: 16,
                  ),
                ),
                suffixIcon: widget.controller.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close, color: Colors.white70, size: 18),
                        onPressed: () {
                          widget.controller.clear();
                          if (widget.onClear != null) widget.onClear!();
                          setState(() {});
                        },
                      )
                    : Container(
                        padding: const EdgeInsets.all(12),
                        child: FaIcon(
                          FontAwesomeIcons.wandMagicSparkles,
                          color: Colors.white.withOpacity(0.25),
                          size: 14,
                        ),
                      ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

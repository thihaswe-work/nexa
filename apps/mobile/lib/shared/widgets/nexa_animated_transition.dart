import 'package:flutter/material.dart';

class NexaFadeIn extends StatefulWidget {
  final Widget child;
  final Duration duration;
  final double begin;
  final int delayMilliseconds;

  const NexaFadeIn({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 400),
    this.begin = 0.0,
    this.delayMilliseconds = 0,
  });

  @override
  State<NexaFadeIn> createState() => _NexaFadeInState();
}

class _NexaFadeInState extends State<NexaFadeIn> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    Future.delayed(Duration(milliseconds: widget.delayMilliseconds), _controller.forward);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _animation,
      child: widget.child,
    );
  }
}

class NexaSlideUp extends StatefulWidget {
  final Widget child;
  final Duration duration;
  final int delayMilliseconds;

  const NexaSlideUp({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 350),
    this.delayMilliseconds = 0,
  });

  @override
  State<NexaSlideUp> createState() => _NexaSlideUpState();
}

class _NexaSlideUpState extends State<NexaSlideUp> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<Offset> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _animation = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
    Future.delayed(Duration(milliseconds: widget.delayMilliseconds), _controller.forward);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(position: _animation, child: widget.child);
  }
}

class NexaScaleIn extends StatefulWidget {
  final Widget child;
  final Duration duration;

  const NexaScaleIn({super.key, required this.child, this.duration = const Duration(milliseconds: 300)});

  @override
  State<NexaScaleIn> createState() => _NexaScaleInState();
}

class _NexaScaleInState extends State<NexaScaleIn> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeOutBack);
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(scale: _animation, child: widget.child);
  }
}

class NexaStaggeredList extends StatelessWidget {
  final int itemCount;
  final Widget Function(BuildContext, int) itemBuilder;
  final Duration itemDuration;
  final int startDelay;

  const NexaStaggeredList({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.itemDuration = const Duration(milliseconds: 300),
    this.startDelay = 0,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: itemCount,
      padding: EdgeInsets.zero,
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      itemBuilder: (context, index) {
        return NexaSlideUp(
          duration: itemDuration,
          delayMilliseconds: startDelay + (index * 60),
          child: itemBuilder(context, index),
        );
      },
    );
  }
}

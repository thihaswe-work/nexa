import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class NexaSkeleton extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const NexaSkeleton({
    super.key,
    this.width = double.infinity,
    required this.height,
    this.borderRadius = 8,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Shimmer.fromColors(
      baseColor: theme.colorScheme.surfaceContainerHighest,
      highlightColor:
          theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.6),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

class NexaSkeletonAvatar extends StatelessWidget {
  final double size;
  const NexaSkeletonAvatar({super.key, this.size = 48});

  @override
  Widget build(BuildContext context) {
    return NexaSkeleton(width: size, height: size, borderRadius: size / 2);
  }
}

class NexaSkeletonList extends StatelessWidget {
  final int itemCount;
  const NexaSkeletonList({super.key, this.itemCount = 6});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: itemCount,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (_, __) => const _SkeletonListItem(),
    );
  }
}

class NexaSkeletonCard extends StatelessWidget {
  const NexaSkeletonCard({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: _SkeletonCardItem(),
    );
  }
}

class _SkeletonListItem extends StatelessWidget {
  const _SkeletonListItem();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        NexaSkeletonAvatar(),
        SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              NexaSkeleton(width: 140, height: 14, borderRadius: 4),
              SizedBox(height: 8),
              NexaSkeleton(width: 200, height: 12, borderRadius: 4),
            ],
          ),
        ),
      ],
    );
  }
}

class _SkeletonCardItem extends StatelessWidget {
  const _SkeletonCardItem();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const NexaSkeletonAvatar(size: 56),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                NexaSkeleton(width: 160, height: 16, borderRadius: 4),
                SizedBox(height: 8),
                NexaSkeleton(width: 100, height: 13, borderRadius: 4),
                SizedBox(height: 6),
                NexaSkeleton(
                    width: double.infinity, height: 11, borderRadius: 4),
              ],
            ),
          ),
          const SizedBox(width: 12),
          const NexaSkeleton(width: 60, height: 30, borderRadius: 15),
        ],
      ),
    );
  }
}

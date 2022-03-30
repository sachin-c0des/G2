import { InferComponent as IC, InferredEncode } from '../runtime';

export type MaybeTooltipOptions = Record<string, never>;

function inferEncode(encode: InferredEncode) {
  const { y, tooltip: t } = encode;
  if (t !== undefined || y === undefined) return encode;
  return { ...encode, tooltip: y[0] };
}

/**
 * Add zero constant encode for x channel.
 * This is useful for interval geometry.
 */
export const MaybeTooltip: IC<MaybeTooltipOptions> = () => {
  return ({ encode, transform }) => ({
    encode: inferEncode(encode),
    transform,
  });
};

MaybeTooltip.props = {};

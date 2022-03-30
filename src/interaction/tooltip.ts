import { InteractionComponent as IC } from '../runtime';
import { TooltipInteraction } from '../spec';

export type TooltipOptions = Omit<TooltipInteraction, 'type'>;

export const Tooltip: IC<TooltipOptions> = () => ({
  start: [
    {
      trigger: 'plot:mousemove',
      action: 'tooltip:show',
      throttle: { wait: 50, leading: true, trailing: false },
    },
    {
      trigger: 'plot:touchmove',
      action: 'tooltip:show',
      throttle: { wait: 50, leading: true, trailing: false },
    },
  ],
  end: [
    { trigger: 'plot:mouseleave', action: 'tooltip:hide' },
    { trigger: 'plot:leave', action: 'tooltip:hide' },
    { trigger: 'plot:touchend', action: 'tooltip:hide' },
  ],
});

Tooltip.props = {};

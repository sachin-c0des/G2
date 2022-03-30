import { InteractionComponent as IC } from '../runtime';
import { ElementActiveInteraction } from '../spec';

export type ElementActiveOptions = Omit<ElementActiveInteraction, 'type'>;

export const ElementActive: IC<ElementActiveOptions> = ({ color }) => ({
  start: [
    {
      trigger: 'element:mouseenter',
      action: { type: 'elementHighlight:highlight', color },
    },
  ],
  end: [{ trigger: 'element:mouseleave', action: 'elementHighlight:reset' }],
});

ElementActive.props = {};

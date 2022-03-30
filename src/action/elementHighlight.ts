import { Action, ActionComponent as AC } from '../runtime';

export type ElementHighlightOptions = {
  action?: string;
  color?: string;
};

export const ElementHighlight: AC<ElementHighlightOptions> = (options) => {
  const { action, color } = options;

  const highlight: Action = (event, store, theme) => {
    const { elementActiveStroke } = theme;
    const { target } = event;
    const { id } = target;
    const { stroke, lineWidth } = target.style;
    store.set(id, { stroke, lineWidth });
    target.style.stroke = color || elementActiveStroke;
    target.style.lineWidth = lineWidth || 1;
  };

  const reset: Action = (event, store, theme) => {
    const { target } = event;
    const { id } = target;
    const { stroke, lineWidth } = store.get(id);
    target.style.stroke = stroke;
    target.style.lineWidth = lineWidth;
  };

  return action === 'highlight' ? highlight : reset;
};

ElementHighlight.props = {};

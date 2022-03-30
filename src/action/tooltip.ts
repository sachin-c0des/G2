import { Group } from '@antv/g';
import { Tooltip as TooltipComponent } from '@antv/gui';
import {
  Action,
  ActionComponent as AC,
  G2Event,
  G2Theme,
  Scale,
} from '../runtime';

export type TooltipOptions = {
  action?: string;
};

function getContainer(group: Group) {
  // @ts-ignore
  return group.getRootNode().defaultView.getConfig().container;
}

function updateTooltip(
  event: G2Event,
  tooltip: TooltipComponent,
  datum: Record<string, any>,
  descriptorScale: Map<{ type?: string; [key: string]: any }, Scale>,
  theme: G2Theme,
) {
  const { tooltip: item, x, color } = datum;
  // const scale = new Map(
  //   Array.from(descriptorScale.entries()).map(([options, scale]) => [
  //     options.name,
  //     { options, scale },
  //   ]),
  // );

  // console.log(t);
  console.log(item);

  // @ts-ignore
  const { offsetX, offsetY } = event;
  tooltip.update({
    x: offsetX,
    y: offsetY,
    title: x ? x[0] : 0,
    position: 'bottom-right',
    offset: [10, 10],
    items: [item],
  });
}

let tooltip: TooltipComponent;

export const Tooltip: AC<TooltipOptions> = (options) => {
  const { action } = options;

  const getTooltip = (group: Group): TooltipComponent => {
    if (tooltip) return tooltip;
    const container = getContainer(group);
    const newTooltip = new TooltipComponent({
      className: 'tooltip',
      style: {
        container: { x: 0, y: 0 },
        items: [],
        bounding: {
          x: 0,
          y: 0,
          width: 500,
          height: 500,
        },
      },
    });
    container.appendChild(newTooltip.HTMLTooltipElement);
    tooltip = newTooltip;
    return newTooltip;
  };

  const show: Action = (e, context, theme) => {
    const { store, scale } = context;
    const { currentTarget: container, target: shape } = e;
    const tooltip = getTooltip(container);
    if (shape === container) {
      tooltip.hide();
    } else {
      const { id } = shape;
      const { datum } = store.get(id);
      updateTooltip(e, tooltip, datum, scale, theme);
      tooltip.show();
    }
  };

  const hide: Action = (e) => {
    const { target: container } = e;
    const tooltip = getTooltip(container);
    tooltip.hide();
  };

  return action === 'hide' ? hide : show;
};

Tooltip.props = {};

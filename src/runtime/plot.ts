import { Canvas, DisplayObject, Group } from '@antv/g';
import { group } from 'd3-array';
import { throttle } from '@antv/util';
import { Coordinate } from '@antv/coord';
import { mapObject } from '../utils/array';
import { Container } from '../utils/container';
import { error } from '../utils/helper';
import {
  G2ViewTree,
  G2Context,
  G2Area,
  G2MarkOptions,
  G2ScaleOptions,
  G2GuideComponentOptions,
  G2ThemeOptions,
  G2Mark,
  G2Library,
  G2ShapeOptions,
  G2AnimationOptions,
  G2Display,
  G2InteractionOptions,
  G2ActionOptions,
  G2Store,
} from './types/options';
import {
  ThemeComponent,
  Theme,
  MarkComponent,
  Mark,
  MarkProps,
  ScaleComponent,
  Scale,
  GuideComponentComponent,
  GuideComponent,
  MarkChannel,
  Shape,
  ShapeComponent,
  AnimationComponent,
  Animation,
  InteractionComponent,
  Interaction,
  ActionComponent,
  Action,
  Step,
} from './types/component';
import { Channel, G2Theme } from './types/common';
import { useLibrary } from './library';
import { initializeMark } from './mark';
import { inferComponent } from './component';
import { computeLayout, placeComponents } from './layout';
import { createCoordinate } from './coordinate';
import { applyScale } from './scale';

export async function plot<T extends G2ViewTree>(
  options: T,
  context: G2Context,
): Promise<void> {
  const {
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    data,
    coordinate,
    theme,
    component,
    interaction,
    ...mark
  } = options;

  const area = {
    x: 0,
    y: 0,
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    theme,
    coordinate,
    component,
    interaction,
    marks: [{ data, ...mark }],
  };

  const { canvas, library, store } = context;
  const container = canvas.appendChild(new Group());
  return plotArea(area, container, store, library);
}

async function plotArea(
  options: G2Area,
  container: Group,
  store: G2Store,
  library: G2Library,
): Promise<void> {
  const [useTheme] = useLibrary<G2ThemeOptions, ThemeComponent, Theme>(
    'theme',
    library,
  );
  const [useMark, createMark] = useLibrary<G2MarkOptions, MarkComponent, Mark>(
    'mark',
    library,
  );
  const [useScale] = useLibrary<G2ScaleOptions, ScaleComponent, Scale>(
    'scale',
    library,
  );
  const [useGuideComponent] = useLibrary<
    G2GuideComponentOptions,
    GuideComponentComponent,
    GuideComponent
  >('component', library);

  // Initialize theme.
  const { theme: partialTheme, marks: partialMarks, interaction } = options;
  const theme = useTheme(inferTheme(partialTheme));

  // Infer options and calc props for each mark.
  const markProps = new Map<G2Mark, MarkProps>();
  const channelScale = new Map<string, G2ScaleOptions>();
  const marks = [];
  for (const partialMark of partialMarks) {
    const { type = error('G2Mark type is required.') } = partialMark;
    const { props: partialProps } = createMark(type);
    const markAndProps = await initializeMark(
      partialMark,
      partialProps,
      channelScale,
      theme,
      options,
      library,
    );
    if (markAndProps) {
      const [mark, props] = markAndProps;
      markProps.set(mark, props);
      marks.push(mark);
    }
  }

  // Collect scales from marks.
  const scales = Array.from(
    new Set(marks.flatMap((d) => Object.values(d.scale))),
  );

  // Infer guide components by scales and create coordinate.
  const [components, componentScale] = inferComponent(scales, options, library);
  const layout = computeLayout(components, options);
  const coordinate = createCoordinate(layout, options, library);

  // Place each component by layout and coordinate.
  const componentBBox = placeComponents(
    components,
    coordinate,
    layout,
    options,
  );

  // Sort marks and components by zIndex.
  const displays = normalizeDisplays(marks, components);
  displays.sort((a, b) => a.zIndex - b.zIndex);

  const componentContainer = new Group();
  componentContainer.className = 'component';
  container.appendChild(componentContainer);

  const plotContainer = new Group();
  plotContainer.className = 'plot';
  container.appendChild(plotContainer);

  const descriptorScale = new Map(scales.map((d) => [d, useScale(d)]));

  for (const { type, display } of displays) {
    if (type === 'component') {
      // Render components with corresponding bbox and scale(if required).
      const scaleDescriptor = componentScale.get(display);
      const scale = descriptorScale.get(scaleDescriptor) || null;
      const { field, domain } = scaleDescriptor;
      const value = { field, domain };
      const bbox = componentBBox.get(display);

      const render = useGuideComponent(display);
      const group = render(scale, bbox, value, coordinate, theme);
      componentContainer.appendChild(group);
    } else {
      // Render marks with corresponding channel values.
      const props = markProps.get(display);
      const { scale: scaleDescriptor, animate = {} } = display;
      const { index, channels, defaultShape } = props;
      const { defaultColor } = theme;

      const scale = mapObject(scaleDescriptor, (d) => descriptorScale.get(d));
      const value = Container.of<MarkChannel>(channels)
        .map(applyScale, scale)
        .map(animationFunction, index, animate, defaultShape, library)
        .map(shapeFunction, index, defaultShape, library)
        .map(tooltipObject, index, defaultColor, scaleDescriptor)
        .value();

      for (const i of index) {
        const datum = Object.entries(value).reduce(
          (obj, [k, v]) => ((obj[k] = v[i]), obj),
          {},
        );
        console.log(datum);
      }

      // // Apply atheistic attributes.
      // const render = useMark(display);
      // const shapes = render(index, scale, value, coordinate, theme);
      // const { key: K } = value;
      // for (let i = 0; i < shapes.length; i++) {
      //   const shape = shapes[i];
      //   const datum = channels.reduce(
      //     (datum, { name, value }) => ((datum[name] = value[i]), datum),
      //     {},
      //   );
      //   const id = `${K[i]}`;
      //   shape.className = 'element';
      //   shape.id = id;
      //   store.set(id, { datum });
      //   plotContainer.appendChild(shape);
      // }

      // // Apply animation attributes.
      // applyAnimation(index, shapes, value, coordinate, theme);
    }
  }

  // const context = {
  //   store,
  //   scale: descriptorScale,
  // };
  // applyInteraction(container, interaction, context, theme, library);
}

function applyInteraction(
  container: Group,
  partialInteraction: G2InteractionOptions[],
  context: {
    store: G2Store;
    scale: Map<G2ScaleOptions, Scale>;
  },
  theme: G2Theme,
  library: G2Library,
) {
  const [useInteraction] = useLibrary<
    G2InteractionOptions,
    InteractionComponent,
    Interaction
  >('interaction', library);
  const [useAction] = useLibrary<G2ActionOptions, ActionComponent, Action>(
    'action',
    library,
  );

  const interactions = inferInteraction(partialInteraction);
  for (const options of interactions) {
    const interaction = useInteraction(options);
    const { start, end } = interaction;
    const steps = [...start, ...end];
    for (const { trigger, action, throttle: throttleOptions } of steps) {
      const actions = normalizeAction(action).map(useAction);
      const [className, eventName] = trigger.split(':');
      const nodes = selectNodes(container, className);
      for (const node of nodes) {
        node.addEventListener(eventName, (event) => {
          for (const action of actions) {
            const throttled = throttleOptions
              ? throttle(action, throttleOptions.wait, throttleOptions)
              : action;
            throttled(event, context, theme);
          }
        });
      }
    }
  }
}

function selectNodes(container: Group, className: string) {
  if (container.className === className) return [container];
  return container.getElementsByClassName(className);
}

function normalizeAction(action: Step['action']) {
  return [action].flat(1).map((d) => {
    const [type, options] = typeof d === 'string' ? [d, {}] : [d.type, d];
    const [t, a] = type.split(':');
    return { ...options, type: t, action: a };
  });
}

function inferTheme(theme: G2ThemeOptions = { type: 'light' }): G2ThemeOptions {
  const { type = 'light' } = theme;
  return { ...theme, type };
}

function inferInteraction(
  interaction: G2InteractionOptions[] = [],
): G2InteractionOptions[] {
  return [...interaction, { type: 'tooltip' }];
}

function normalizeDisplays(
  marks: G2Mark[],
  components: G2GuideComponentOptions[],
): G2Display[] {
  return [
    ...components.map(
      (component): G2Display => ({
        type: 'component',
        zIndex: component.zIndex || -1,
        display: component,
      }),
    ),
    ...marks.map(
      (mark): G2Display => ({
        type: 'mark',
        zIndex: mark.zIndex || 0,
        display: mark,
      }),
    ),
  ];
}

function applyAnimation(
  I: number[],
  shapes: DisplayObject[],
  value: Record<string, any>,
  coordinate: Coordinate,
  theme: G2Theme,
) {
  const {
    enterType: ET,
    enterDelay: EDL = [],
    enterEasing: EE = [],
    enterDuration: EDR = [],
  } = value;

  // A shape may correspond to a group of data(e.g. line).
  // Map shape index(group index) to the index of first data for this group.
  const valueIndex = createIndex(I, shapes, value);
  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    const index = valueIndex(i);
    const animate = ET[index];
    const style = {
      duration: EDR[index],
      easing: EE[index],
      delay: EDL[index],
    };
    animate(shape, style, coordinate, theme);
  }
}

function createIndex(
  index: number[],
  shapes: DisplayObject[],
  value: Record<string, any>,
): (i: number) => number {
  if (index.length === shapes.length) return (i) => i;

  // Group shapes by series channel.
  const { series: S } = value;
  const groups = S ? Array.from(group(index, (i) => S[i]).values()) : [index];

  // Using the index of the first shape for the group as the group index.
  const groupIndex = new Map(groups.map((g, i) => [i, g[0]]));
  return (i) => groupIndex.get(i);
}

function tooltipObject(
  value: Record<string, any>,
  index: number[],
  defaultColor: string,
  scaleDescriptor: G2ScaleOptions,
) {
  const { tooltip: T, color: C } = value;
  const { tooltip: scale } = scaleDescriptor;
  return {
    ...value,
    tooltip: index.map((i) => {
      const value = T[i];
      if (typeof value === 'object') return value;
      const color = C?.[i] || defaultColor;
      const { field } = scale;
      return {
        color,
        value,
        ...(field && { name: field }),
      };
    }),
  };
}

function animationFunction(
  value: Record<string, any>,
  index: number[],
  animate: G2AnimationOptions,
  defaultShape: string,
  library: G2Library,
) {
  const [, createShape] = useLibrary<G2ShapeOptions, ShapeComponent, Shape>(
    'shape',
    library,
  );
  const [useAnimation] = useLibrary<
    G2AnimationOptions,
    AnimationComponent,
    Animation
  >('animation', library);

  const { enterType: ET } = value;
  const { defaultEnterAnimation } = createShape(defaultShape).props;
  const { enter = {} } = animate;
  const { type = defaultEnterAnimation } = enter;
  const animationFunctions = Array.isArray(ET)
    ? ET.map((type) => useAnimation({ ...enter, type }))
    : index.map(() => useAnimation({ ...enter, type }));
  return { ...value, enterType: animationFunctions };
}

function shapeFunction(
  value: Record<string, Channel>,
  index: number[],
  defaultShape: string,
  library: G2Library,
): {
  shape: Shape[];
  [key: string]: Channel | Shape[];
} {
  const [useShape] = useLibrary<G2ShapeOptions, ShapeComponent, Shape>(
    'shape',
    library,
  );
  const { shape } = value;
  const shapeFunctions = Array.isArray(shape)
    ? shape.map((type) => useShape(normalizeOptions(type)))
    : index.map(() => useShape({ type: defaultShape }));
  return { ...value, shape: shapeFunctions };
}

function normalizeOptions(options: string | Record<string, any>) {
  return typeof options === 'object' ? options : { type: options };
}

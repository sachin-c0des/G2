export type Interaction = ElementActiveInteraction | TooltipInteraction;

export type InteractionTypes = 'elementActive' | 'tooltip';

export type ElementActiveInteraction = {
  type?: 'elementActive';
  color?: string;
};

export type TooltipInteraction = {
  type?: 'tooltip';
};

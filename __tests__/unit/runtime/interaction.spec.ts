import { G2Spec, render } from '../../../src';
import { createDiv, mount, unmountAll } from '../../utils/dom';

describe('Interaction', () => {
  it.only('render({...} renders chart with tooltip', (done) => {
    const chart = render<G2Spec>(
      {
        type: 'interval',
        data: [
          { genre: 'Sports', sold: 275 },
          { genre: 'Strategy', sold: 115 },
          { genre: 'Action', sold: 120 },
          { genre: 'Shooter', sold: 350 },
          { genre: 'Other', sold: 150 },
        ],
        encode: {
          x: 'genre',
          y: 'sold',
          color: 'genre',
        },
      },
      {},
      done,
    );
    mount(createDiv(), chart);
  });

  // it.only('render({...} renders chart with tooltip', (done) => {
  //   const chart = render<G2Spec>(
  //     {
  //       type: 'interval',
  //       data: [
  //         { genre: 'Sports', sold: 275 },
  //         { genre: 'Strategy', sold: 115 },
  //         { genre: 'Action', sold: 120 },
  //         { genre: 'Shooter', sold: 350 },
  //         { genre: 'Other', sold: 150 },
  //       ],
  //       scale: {
  //         tooltip: { field: ['sold', 'index'] },
  //       },
  //       encode: {
  //         x: 'genre',
  //         y: 'sold',
  //         color: 'genre',
  //         tooltip: ['sold', (_, i) => i],
  //       },
  //     },
  //     {},
  //     done,
  //   );
  //   mount(createDiv(), chart);
  // });

  it('render({...} renders chart with elementActive', (done) => {
    const chart = render<G2Spec>(
      {
        type: 'interval',
        data: [
          { genre: 'Sports', sold: 275 },
          { genre: 'Strategy', sold: 115 },
          { genre: 'Action', sold: 120 },
          { genre: 'Shooter', sold: 350 },
          { genre: 'Other', sold: 150 },
        ],
        encode: {
          x: 'genre',
          y: 'sold',
          color: 'genre',
        },
        interaction: [{ type: 'elementActive' }],
      },
      {},
      done,
    );
    mount(createDiv(), chart);
  });
});

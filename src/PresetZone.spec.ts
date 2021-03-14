import { presetZone } from './PresetZone';
require('mocha').describe('test', () => {
  require('mocha').it('freebe', () => {
    require('chai')
      .expect(1)
      .to.eq(2 - 1);
  });
});

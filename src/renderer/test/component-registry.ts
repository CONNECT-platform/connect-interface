import { should, expect } from 'chai'; should();

import registry from '../component-registry';
import { ComponentRegistry } from '../component-registry';

import { RenderingComponent } from '../types';


class _NotAComponent implements RenderingComponent<any> {
  clone() { return new _NotAComponent(); }
}

describe('ComponentRegistry', () => {
  describe('.register()', () => {
    it('should register a component factory with a given tag, which is then invoked via `.create()`', done => {
      let r = new ComponentRegistry();
      r.register('comp', () => done() as any);
      r.create('comp', undefined, undefined);
    });

    it('should override the factory object if it is already registered.', done => {
      let r = new ComponentRegistry();
      r.register('comp', () => undefined);
      r.create('comp', undefined, undefined);
      r.register('comp', () => done() as any);
      r.create('comp', undefined, undefined);
    });

    it('should emit an "registered" event.', done => {
      let r = new ComponentRegistry();
      let f = ():any => undefined;

      r.on('registered').subscribe(event => {
        event.tag.should.equal('comp');
        event.factory.should.equal(f);
        done();
      });
      r.register('comp', f);
    });
  });

  describe('.registered()', () => {
    it('should return true if a factory with given tag is registered, false otherwise.', () => {
      new ComponentRegistry().register('A', () => undefined).registered('A').should.be.true;
      new ComponentRegistry().register('A', () => undefined).registered('B').should.be.false;
    });
  });

  describe('.create()', () => {
    it('should invoke the registered factory and return the result.', () => {
      new ComponentRegistry().register('X', () => new _NotAComponent).create('X', undefined, undefined).should.be.instanceOf(_NotAComponent);
    });

    it('should invoke the registered factory with proper parameters.', done => {
      let r = new ComponentRegistry().register('X', (a, b) => {
        a.should.equal('hellow');
        b.should.equal('world');
        done();
        return new _NotAComponent();
      });

      r.create('X', 'hellow' as any, 'world' as any);
    });

    it('should return `undefined` if the given tag is not registered.', () => {
      expect(new ComponentRegistry().create('X', undefined, undefined)).to.be.undefined;
    });

    it('should emit a "created" event.', done => {
      let r = new ComponentRegistry();
      r.register('comp', () => 'hellow' as any);
      r.on('created').subscribe(event => {
        event.tag.should.equal('comp');
        event.created.should.equal('hellow');
        done();
      });
      r.create('comp', undefined, undefined);
    });
  });

  describe('.onRegistered', () => {
    it('should be equal to `on("registered")`', () => {
      let r = new ComponentRegistry();
      r.onRegistered.should.equal(r.on('registered'));
    });
  });

  describe('.onCreated', () => {
    it('should be equal to `on("created")`', () => {
      let r = new ComponentRegistry();
      r.onCreated.should.equal(r.on('created'));
    });
  });
});

describe('registry', () => {
  it('should be a `ComponentRegistry`', () => {
    registry.should.be.instanceOf(ComponentRegistry);
  });
});

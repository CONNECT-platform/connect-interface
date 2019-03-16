import { should } from 'chai'; should();
import 'jsdom-global/register';

import compile from '../compiler';

import { AbstractComponent } from '../../../renderer/component';
import { RendererType } from '../../../renderer/types';
import { ComponentRegistry, ComponentFactory } from '../../../renderer/component-registry';

import { HTMLNode } from '../../../renderer/html/node';
import { HTMLRenderer } from '../../../renderer/html/renderer';


class _C extends AbstractComponent<HTMLNode> {
  private _code: string;

  constructor(_code: string, renderer: RendererType<HTMLNode>, node: HTMLNode) {
    super({}, renderer, node, (_this) => {
      _this._code = _code;
    });
  }

  render() {
    let _compiled = compile(this._code);
    let _func: () => void = eval(_compiled);
    _func.apply(this);
  }

  clone(node: HTMLNode): _C {
    return new _C(this._code, this.renderer, node);
  }
}

function _c(_code: string): ComponentFactory<HTMLNode> {
  return (renderer: RendererType<HTMLNode>, node: HTMLNode) => {
    return new _C(_code, renderer, node);
  }
}

describe.only('compiler', () => {
  it('should compile a piece of pseudo-html code into a rendering function applicable on an `AbstractComponent`.', () => {
    let R = new HTMLRenderer(new ComponentRegistry());
    R.registry.register('A', _c(`<span></span>`));

    let host = R.createNode('host');
    R.render('A').on(host);

    host.children[0].children[0].native.nodeName.toLowerCase().should.equal('span');
  });

  it('should create separate text nodes for text.', () => {
    let R = new HTMLRenderer(new ComponentRegistry());
    R.registry.register('A', _c(`<span>hellow</span>`));

    let host = R.createNode('host');
    R.render('A').on(host);

    host.children[0].children[0].children[0].textContent.should.equal('hellow');
  });

  it('should return a rendering function that properly handles non-trivial dom trees.', () => {
    let R = new HTMLRenderer(new ComponentRegistry());
    R.registry.register('A', _c(`
      <div>
        hellow
        <span>world</span>
        from the compiled code
        <span>in <b>HERE</b></span>
      </div>
    `));

    let host = R.createNode('host');
    R.render('A').on(host);

    host.children[0].children[0].native.nodeName.toLowerCase().should.equal('div');
    host.children[0].children[0].children[0].textContent.should.equal('hellow');
    host.children[0].children[0].children[1].native.nodeName.toLowerCase().should.equal('span');
    host.children[0].children[0].children[1].children[0].textContent.should.equal('world');
    host.children[0].children[0].children[2].textContent.should.equal('from the compiled code');
    host.children[0].children[0].children[3].native.nodeName.toLowerCase().should.equal('span');
    host.children[0].children[0].children[3].children[1].native.nodeName.toLowerCase().should.equal('b');
  });

  it('should return a function properly handling self-closing tags even those who are not supported in HTML.', () => {
    let R = new HTMLRenderer(new ComponentRegistry());
    R.registry.register('A', _c(`
      <div>
        hellow
        <span/>
        world!
      </div>
    `));

    let host = R.createNode('host');
    R.render('A').on(host);

    host.children[0].children[0].children[1].native.nodeName.toLowerCase().should.equal('span');
    host.children[0].children[0].children[2].textContent.should.equal('world!');
  });

  describe('attributes:', () => {
    it('should return a rendering function that handles attributes properly.', () => {
      let R = new HTMLRenderer(new ComponentRegistry());
      R.registry.register('A', _c(`<span hellow="world"></span>`));

      let host = R.createNode('host');
      R.render('A').on(host);

      (host.children[0].children[0].native as HTMLElement).getAttribute('hellow').should.equal('world');
    });

    it('should skip attributes starting with "@", and instead attach them as trans tag for the resulting node.', () => {
      let R = new HTMLRenderer(new ComponentRegistry());
      R.registry.register('A', _c(`<span @hook></span>`));

      let host = R.createNode('host');
      R.render('A').on(host);

      host.children[0].children[0].attributes.length.should.equal(0);
      host.children[0].children[0].transtag().should.equal('@hook');
    });
  });
});

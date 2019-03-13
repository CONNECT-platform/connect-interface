import { RenderingComponent, RendererType } from './types';
import { AbstractNode } from './node';

import { Signature } from '../core/base/signature';
import { Composite } from '../core/composite';


export abstract class AbstractComponent<_Node extends AbstractNode<_Node>> extends Composite
  implements RenderingComponent<_Node> {

  private _renderer: RendererType<_Node>;
  private _hooks: {[tag: string]: _Node[]} = {};
  protected $: {[name: string]: _Node} = {};

  constructor(signature: Signature,
      renderer: RendererType<_Node>,
      private _node: _Node,
    ) {

    super(signature);
    this._renderer = renderer.within(this);

    this.render();
    this.wire();
  }

  protected render() {}
  protected wire() {}

  public get renderer() { return this._renderer; }
  public get root() { return this._node; }

  hook(tag: string, node: _Node): AbstractComponent<_Node> {
    if (!this._hooks[tag]) this._hooks[tag] = [];
    this._hooks[tag].push(node);
    return this;
  }

  hooks(tag: string): _Node[] {
    return this._hooks[tag] || [];
  }

  public abstract clone(node?: _Node): AbstractComponent<_Node>;

  public proxy(component: AbstractComponent<_Node>): AbstractComponent<_Node> {
    super.proxy(component);
    return this;
  }
}
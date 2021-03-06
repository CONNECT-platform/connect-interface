import { Signature } from './base/signature';
import { Agent } from './base/agent';
import { PinMap } from './base/pinmap';
import { InputPin, OutputPin } from './base/io';
import { ControlPin, SignalPin } from './base/control';

import { Expr, ExprFunction } from './expr';
import { Relay } from './relay';
import { State } from './state';
import { Switch, SwitchCaseType } from './switch';
import { Value } from './value';
import { Call } from './call';

import _registry from './node-registry';
import { NodeRegistry } from './node-registry';


//
// TODO: change it so when the composite is merely a proxy, its internal connections are not fired.
//
export class Composite extends Agent {
  protected ins: PinMap<OutputPin<any>>;
  protected outs: PinMap<InputPin<any>>;
  protected sigs: PinMap<ControlPin>;
  protected ctrl: SignalPin;

  private _children: { [tag: string]: Agent };
  private _locked: boolean;

  constructor(signature: Signature, private registry: NodeRegistry = _registry) {
    super(signature, (_this: Composite) => {
      _this.registry = registry;
    });
  }

  protected preBuild() {
    this._children = {};
    this._locked = false;
  }

  protected bind() {
    this.ins = new PinMap<OutputPin<any>>();
    this.inputs.entries.forEach(entry => {
      let pin = new OutputPin<any>();
      this.ins.attach(entry.tag, pin);
      entry.pin.onReceived.subscribe(data => { if (!this.proxied) pin.send(data) });
    });

    this.outs = new PinMap<InputPin<any>>();
    this.outputs.entries.forEach(entry => {
      let pin = new InputPin<any>();
      this.outs.attach(entry.tag, pin);
      pin.onReceived.subscribe(data => { if (!this.proxied) entry.pin.send(data) });
    });

    this.sigs = new PinMap<ControlPin>();
    this.signals.entries.forEach(entry => {
      let pin = new ControlPin();
      this.sigs.attach(entry.tag, pin);
      pin.onActivated.subscribe(() => { if (!this.proxied) entry.pin.activate(); });
    });

    this.ctrl = new SignalPin();
    this.control.onActivated.subscribe(() => { if (!this.proxied) this.ctrl.activate() });

    this.ins.lock();
    this.outs.lock();
    this.sigs.lock();

    this.build();
    this.lock();
  }

  protected build(): void {}

  public get children(): {[tag: string]: Agent} { return this._children; }
  public get locked(): boolean { return this._locked; }
  public lock(): Composite { this._locked = true; return this; }

  public cleanup() {
    super.cleanup();
    Object.values(this._children).forEach(child => child.cleanup());
    this.ins.cleanup();
    this.outs.cleanup();
    this.sigs.cleanup();
    this.ctrl.cleanup();
  }

  protected in(tag: string) { return this.ins.get(tag); }
  protected out(tag: string) { return this.outs.get(tag); }
  protected sig(tag: string) { return this.sigs.get(tag); }

  protected add(tag: string, child: Agent): Agent {
    if (!this.locked) {
      this._children[tag] = child;
      return child;
    }
    else return undefined;
  }

  protected relay(tag: string): Relay {
    return this.add(tag, new Relay()) as Relay;
  }

  protected state<_Type>(tag: string, value?: _Type): State<_Type> {
    return this.add(tag, new State(value)) as State<_Type>;
  }

  protected switch(tag: string, cases: SwitchCaseType[]): Switch {
    return this.add(tag, new Switch(cases)) as Switch;
  }

  protected value<_Type>(tag: string, value: _Type): Value<_Type> {
    return this.add(tag, new Value(value)) as Value<_Type>;
  }

  protected expr(tag: string, inputs: string[], expr: ExprFunction): Expr {
    return this.add(tag, new Expr(inputs, expr, { parent: this })) as Expr;
  }

  protected call(tag: string, path: string, registry?: NodeRegistry): Call {
    return this.add(tag, new Call(path, registry || this.registry)) as Call;
  }
}

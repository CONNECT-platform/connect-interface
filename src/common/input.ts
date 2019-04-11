import { HTMLComponent } from '../renderer/html/component';
import component from '../renderer/decorator';


//
// TODO: write tests for this.
//
@component('input', {
  inputs: ['value'],
  outputs: ['value'],
})
class InputComponent extends HTMLComponent {
  build() {
    this.expr('o', ['event'], () => {
      let input = this.root.native as HTMLInputElement;
      let type = input.getAttribute('type');
      if (type === 'checkbox' || type === 'radio') {
        return input.checked;
      }
      else return input.value;
    });

    this.expr('i', ['value'], value => {
      let input = this.root.native as HTMLInputElement;
      let type = input.getAttribute('type');
      if (type === 'checkbox' || type === 'radio') {
        input.checked = value;
      }
      else
        input.value = value;
    });
  }

  wire() {
    ['keyup','keypress','keydown','blur','focus','change']
      .forEach(event => {
        this.root.outputs.get(event).connect(this.children.o.inputs.get('event'));
      });

    this.children.o.outputs.get('result').connect(this.out.get('value'));
    this.in.get('value').connect(this.children.i.inputs.get('value'));
    this.in.get('value').connect(this.out.get('value'));
  }
}
# ampersand-select-view

![](https://travis-ci.org/AmpersandJS/ampersand-select-view.svg) ![](https://badge.fury.io/js/ampersand-select-view.svg)

A view module for intelligently rendering and validating selectbox input. Works well with ampersand-form-view.

<!-- starthide -->
Part of the [Ampersand.js toolkit](http://ampersandjs.com) for building clientside applications.
<!-- endhide -->

## install

```
npm install ampersand-select-view
```

## example

```javascript
var FormView = require('ampersand-form-view');
var SelectView = require('ampersand-select-view');


module.exports = FormView.extend({
    fields: function () {
        return [
            new SelectView({
                label: 'Pick a color!',
                // actual field name
                name: 'color',
                parent: this,
                // you can pass simple string options
                options: ['blue', 'orange', 'red'],
                // if included this will add option for an unselected state
                unselectedText: 'please choose one',
                // you can specify that they have to pick one
                required: true
            }),
            new SelectView({
                name: 'option',
                parent: this,
                // you can also pass array, first is the value, second is used for the label
                // and an optional third value can used to disable the option
                options: [ ['a', 'Option A'], ['b', 'Option B'], ['c', 'Option C', true] ]
            }),
            new SelectView({
                name: 'model',
                parent: this,
                // you can pass in a collection here too
                options: collection,
                // and pick an item from the collection as the selected one
                value: collection1.at(2),
                // here you specify which attribute on the objects in the collection
                // to use for the value returned.
                idAttribute: 'id',
                // you can also specify which model attribute to use as the title
                textAttribute: 'title',
                // you can also specify a boolean model attribute to render items as disabled
                disabledAttribute: 'disabled',
                // here you can specify if it should return the selected model from the
                // collection, or just the id attribute
                yieldModel: false
            })
        ];
    }
});

```
## API Reference

### setValue `selectView.setValue([value], [skipValidation|bool])`

Setter for value that will fire all appropriate handlers/tests. Called by user input or can be used to set `value` manually.

Passing `true` as second argument will skip validation. This is mainly for internal use.

#### Setting select.value on non-user input
This module assumes that the value of the select element will be set by the user.  This is the only event that can be reliably listened for on an select element.  If you have a third-party library (i.e. Bootstrap or jQuery) that is going to be affecting the select value directly you will need to let your model know about the change via `setValue`.

```javascript
var mySelect = new SelectView({
    options: ['one', 'two', 'three']
    name: 'numbers'
});
mySelect.render();
document.body.appendChild(mySelect.el);

$('[name=numbers]').jQueryPlugin({
    onSelect: function (value) {
        mySelect.setValue(value);
    }
});
 
```

### reset `selectView.reset()`

Set value to back original value. If you passed a `value` when creating the view it will reset to that. Otherwise it will reset to the value of first option or the `unseletedText` option if specified.


### clear `selectView.clear()`

Sets value to `undefined` if there is an 'unselectedText' option specified. Otherwise it will be set to the value of first option.

## browser support

[![testling badge](https://ci.testling.com/AmpersandJS/ampersand-select-view.png)](https://ci.testling.com/AmpersandJS/ampersand-select-view)

## credits

Written by [@philip_roberts](twitter.com/philip_roberts).

## license

MIT


/* $AMPERSAND_VERSION */
var domify = require('domify');
var dom = require('ampersand-dom');
var matches = require('matches-selector');

//Replaceable with anything with label, message-container, message-text data-hooks and a <select>
var defaultTemplate = [
    '<label class="select">',
        '<span data-hook="label"></span>',
        '<select></select>',
        '<span data-hook="message-container" class="message message-below message-error">',
            '<p data-hook="message-text"></p>',
        '</span>',
    '</label>'
].join('\n');


/* opts:
 *  - name:       name of the field
 *  - parent:     parent form reference
 *  - options:    array/collection of options to render into the select box
 *  - [unselectedText]: text to display if unselected
 *  - [value]:    initial value for the field
 *  - [el]:       dom node to use for the view
 *  - [required]: is field required
 *
 *  - [validClass]: class to apply to root element if valid
 *  - [invalidClass]: class to apply to root element if invalid
 *  - [requiredMessage]: message to display if invalid and required
 *
 *  Additional opts, if options is a collection:
 *  - [idAttribute]: model attribute to use as the id for the option node
 *  - [textAttribute]: model attribute to use as the text of the option node in the select box
 *  - [disabledAttribute]: boolean model attribute to flag disabling of the option node
 *  - [yieldModel]: (defaults true) if options is a collection, yields the full model rather than just it's id to .value
 */

function SelectView (opts) {
    opts = opts || {};

    if (typeof opts.name !== 'string') throw new Error('SelectView requires a name property.');
    this.name = opts.name;

    if (!opts.options || !Array.isArray(opts.options) && !opts.options.isCollection) {
        throw new Error('SelectView requires select options.');
    }
    this.options = opts.options;

    if (this.options.isCollection) {
        this.idAttribute = opts.idAttribute || this.options.mainIndex || 'id';
        this.textAttribute = opts.textAttribute || 'text';
        this.disabledAttribute = opts.disabledAttribute;
    }

    this.el = opts.el;
    this.value = null;
    this.startingValue = opts.value;
    this.label = opts.label || this.name;
    this.parent = opts.parent;
    this.template = opts.template || defaultTemplate;
    this.unselectedText = opts.unselectedText;
    this.yieldModel = (opts.yieldModel === false) ? false : true;

    this.required = opts.required || false;
    this.validClass = opts.validClass || 'input-valid';
    this.invalidClass = opts.invalidClass || 'input-invalid';
    this.requiredMessage = opts.requiredMessage || 'Selection required';

    this.onChange = this.onChange.bind(this);

    this.render();

    if((typeof this.startingValue === 'undefined') && this.required) {
        this.clear();
    } else {
        this.setValue(this.startingValue);
    }
}

SelectView.prototype.render = function () {
    if (this.rendered) return;

    if (!this.el) this.el = domify(this.template);

    var label = this.el.querySelector('[data-hook~=label]');
    if (label) {
        label.textContent = this.label;
    }

    this.select = this.el.querySelector('select');
    if (matches(this.el, 'select')) this.select = this.el;
    if (this.select) this.select.setAttribute('name', this.name);

    this.bindDOMEvents();
    this.renderOptions();
    this.updateSelectedOption();

    if (this.options.isCollection) {
        this.options.on('add remove reset', function () {
            this.renderOptions();
            this.updateSelectedOption();
        }.bind(this));
    }

    this.mContainer = this.el.querySelector('[data-hook~=message-container]');
    this.mText = this.el.querySelector('[data-hook~=message-text]');

    this.rendered = true;
    return this;
};

SelectView.prototype.onChange = function () {
    var value = this.select.options[this.select.selectedIndex].value;

    if (this.options.isCollection && this.yieldModel) {
        value = this.findModelForId(value);
    }

    this.setValue(value);
};

SelectView.prototype.findModelForId = function (id) {
    return this.options.filter(function (model) {
        if (!model[this.idAttribute]) return false;

        //intentionally coerce for '1' == 1
        return model[this.idAttribute] == id;
    }.bind(this))[0];
};

SelectView.prototype.bindDOMEvents = function () {
    this.el.addEventListener('change', this.onChange, false);
};

SelectView.prototype.renderOptions = function () {
    if (!this.select) return;

    this.select.innerHTML = '';
    if (this.unselectedText) {
        this.select.appendChild(
            createOption(null, this.unselectedText)
        );
    }

    this.options.forEach(function (option) {
        this.select.appendChild(
            createOption(this.getOptionValue(option), this.getOptionText(option), this.getOptionDisabled(option))
        );
    }.bind(this));
};

SelectView.prototype.updateSelectedOption = function () {
    var lookupValue = this.value;

    if (!this.select) return;

    if (!lookupValue) {
        this.select.selectedIndex = 0;
        return;
    }

    //Pull out the id if it's a model
    if (this.options.isCollection && this.yieldModel) {
        lookupValue = lookupValue && lookupValue[this.idAttribute];
    }

    if (lookupValue) {
        for (var i = this.select.options.length; i--; i) {
            if (this.select.options[i].value === lookupValue.toString()) {
                this.select.selectedIndex = i;
                return;
            }
        }
    }

    //If failed to match any
    this.select.selectedIndex = 0;
};

SelectView.prototype.remove = function () {
    if (this.el) this.el.parentNode.removeChild(this.el);
    this.el.removeEventListener('change', this.onChange, false);
};

SelectView.prototype.reset = function() {
    if(this.startingValue) {
        this.setValue(this.startingValue, true);
    } else {
        this.clear();
    }
};

SelectView.prototype.clear = function() {
    if(this.unselectedText) {
        this.setValue(undefined, true);
    } else {
        this.setValue(this.select.options[0] && this.select.options[0].value, true);
    }
};

SelectView.prototype.setValue = function (value, skipValidation) {
    if (value === this.value) return;

    //Coerce and find the right value based on yieldModel
    if (this.options.isCollection) {
        var model;

        if (this.options.indexOf(value) === -1) {
            model = this.findModelForId(value);
        } else {
            model = value;
        }

        if (this.yieldModel) {
            value = model;
        } else {
            if (model) {
                value = model[this.idAttribute];
            } else {
                value = void 0;
            }
        }
    }

    this.value = value;

    if(skipValidation) {
        this.clearMessage();
    } else {
        this.validate();
    }

    this.updateSelectedOption();
    if (this.parent) this.parent.update(this);
};

SelectView.prototype.beforeSubmit = function () {
    this.validate();
};

SelectView.prototype.validate = function () {
    if(!this.value && !this.required) {
        this.valid = true;
    } else {
        this.valid = this.options.some(function (element) {
            //If it's a collection, ensure it's in the collection
            if (this.options.isCollection) {
                if (this.yieldModel) {
                    return this.options.indexOf(this.value) > -1;
                } else {
                    return !!this.findModelForId(this.value);
                }
            }

            //[ ['foo', 'Foo Text'], ['bar', 'Bar Text'] ]
            if (Array.isArray(element) && element.length === 2) {
                return element[0] === this.value;
            }

            //[ 'foo', 'bar', 'baz' ]
            return element === this.value;
        }.bind(this));
    }

    if (!this.valid && this.required) {
        this.setMessage(this.requiredMessage);
    } else {
        this.setMessage();
    }

    return this.valid;
};

SelectView.prototype.getOptionValue = function (option) {
    if (Array.isArray(option)) return option[0];

    if (this.options.isCollection) {
        if (this.idAttribute && option[this.idAttribute]) {
            return option[this.idAttribute];
        }
    }

    return option;
};

SelectView.prototype.getOptionText = function (option) {
    if (Array.isArray(option)) return option[1];

    if (this.options.isCollection) {
        if (this.textAttribute && option[this.textAttribute]) {
            return option[this.textAttribute];
        }
    }

    return option;
};

SelectView.prototype.getOptionDisabled = function (option) {
    if (Array.isArray(option)) return option[2];

    if (this.options.isCollection && this.disabledAttribute) return option[this.disabledAttribute];

    return false;
};

SelectView.prototype.setMessage = function (message) {
    if (!this.mContainer || !this.mText) return;

    if (message) {
        dom.show(this.mContainer);
        this.mText.textContent = message;
        dom.addClass(this.el, this.invalidClass);
        dom.removeClass(this.el, this.validClass);
    } else {
        dom.hide(this.mContainer);
        this.mText.textContent = '';
        dom.addClass(this.el, this.validClass);
        dom.removeClass(this.el, this.invalidClass);
    }
};

SelectView.prototype.clearMessage = function () {
    if (!this.mContainer || !this.mText) return;

    dom.removeClass(this.el, this.validClass);
    dom.removeClass(this.el, this.invalidClass);
    dom.hide(this.mContainer);
    this.mText.textContent = '';
};

function createOption (value, text, disabled) {
    var node = document.createElement('option');

    //Set to empty-string if undefined or null, but not if 0, false, etc
    if (value === null || value === undefined) { value = ''; }

    if(disabled) node.disabled = true;
    node.textContent = text;
    node.value = value;

    return node;
}

module.exports = SelectView;

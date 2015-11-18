// If the component doesn't exist, we're likely in RSuite 4.
if (!RSuite.component.Select2) {
    RSuite.component.Select2 = Ember.Select.extend({
        classNames: [ 'form-control', 'tag-control' ],
        classNameBindings: [ 'inputSize' ],
        inputSize: 'input-md',
        attributeBindings: ['name'],
        select2OptionBindings: [
            'ajax',
            'allowClear',
            'closeOnSelect',
            'dataAdapter',
            'dropdownAutoWidth',
            'dropdownParent',
            'escapeMarkup',
            'language',
            'matcher',
            'maximumInputLength',
            'maximumSelectionLength',
            'minimumInputLength',
            'minimumResultsForSearch',
            'multiple',
            'placeholder',
            'selectOnClose',
            'sorter',
            'tags',
            'templateResult',
            'templateSelection',
            'theme',
            'width'
        ],
        // Copy of Ember.Select's defaultTemplate, with a small change so we can modify the SelectOption
        defaultTemplate: Ember.Handlebars.compile('{{#if view.placeholder}}<option value>{{view.placeholder}}</option>{{/if}}{{#each view.content}}{{view view.SelectOption contentBinding="this"}}{{/each}}'),
        // This prevents the options from being regenerated every time we set the selection.
        SelectOption: Ember.SelectOption.extend({
            selected: false
        }),
        initialSelect2OptionBindings: [
            'value'
        ],
        placeholder: null,
        multiple: false,
        _select2Options: function () {
            // Much simpler (and more extensible) method of collecting options
            return this.get('select2OptionBindings').reduce(function (opts, name) {
                var tgtName = name,
                    i = name.indexOf(':');
                // A downstream developer may want to use a different name for an option
                //  versus its representation on the class.  We use the Ember convention of
                //  localName:foreignName, as seen in classNameBindings and attributeBindings
                if (i !== -1) {
                    tgtName = name.substr(i);
                    name = name.substr(0, i);
                }
                var opt = this.get(name);
                if (opt) {
                    // If it's a function, we want to maintain its context,
                    //  so we use Function#bind, which most modern browsers support, and
                    //  for which this plugin provides a polyfill
                    if (opt instanceof Function && !Ember.Object.detect(opt)) {
                        opt = opt.bind(this);
                    }

                    // ajax is a special case: it should be a complex object used for
                    //  jQuery.ajax to fetch data.  We'll want those functions to be
                    //  bound to the View as well.
                    if (name === 'ajax') {
                        Object.keys(opt).forEach(function (key) {
                            var aj = opt[key];
                            if (aj instanceof Function && !Ember.Object.detect(aj)) {
                                aj = aj.bind(this);
                            }
                        }, this);
                    }
                    opts[tgtName] = opt;
                }
                return opts;
            }.bind(this), {});
        },
        // We'll set this on init
        select2Options: null,
        // If any referenced name changes, notify select2Options that it should update
        _select2OptionsBindingsChanged: function () {
            if (this.isDestroying || this.isDestroyed) { return; }
            // Simply redefine the method.
            Ember.defineProperty(this, 'select2Options', this._select2Options.property(this.get('select2OptionBindings')));
        }.observes('select2OptionBindings', 'select2OptionBindings.length', 'select2OptionBindings.@each'),
        init: function () {
            this._super();
            // Connect the bindings on init
            this._select2OptionsBindingsChanged();
            window.tagCtl = this;

            this.on('didInsertElement', this, '_applySelect2');

            // This is used below, in the selection-handling stuff, to observe `selection`
            this._selectionContentObserver = {
                willChange: function () {},
                didChange: 'selectionContentChanged'
            };
            if (!this.get('content')) {
                this.set('content', []);
            }
            if (!this.get('selection')) {
                this.set('selection', []);
            }
        },
        // Called after the View has been removed from the DOM.
        destroy: function () {
            if (this.get('element')) {
                // When the view is gone, so should be the select2 instance, but `$()` won't work now.
                var $this = $(this.get('element'));
                // Calling select2('destroy') on an already-destroyed select2 will
                //      throw an exception; this prevents the double-tap
                if ($this.data('select2')) {
                    $this.select2('destroy');
                }
            }
            // Remove listeners from the selection.
            this.selectionWillChange();
            this._super();
        },
        // Cache the previous option set, so we can unset existing values.
        _select2OptionsWillChange: function () {
            this._oldSelect2Options = this.get('select2Options');
        }.observesBefore('select2Options'),
        // Create a set of options that is the combination of the current set, along with
        //  all the options that _used_ to be there, and are now unset.
        _select2OptionsDidChange: function () {
            // If the view is destroyed, don't bother trying to update the select2 instance
            //  If the element isn't present, select2 hasn't been configured yet, so no need to
            //  reconfigure.
            if (this.isDestroying || this.isDestroyed || !this.get('element')) { return; }
            var newOptions = this.get('select2Options'),
                oldOptions = this._oldSelect2Options,
                combinedOptions = {};
            Object.keys(oldOptions).forEach(function (key) {
               if (!(key in newOption)) {
                   newOption[key] = null;
               }
            });
            delete this._oldSelect2Options;

        }.observesBefore('select2Options'),
        _applySelect2: function () {
            if (this.state !== 'inDOM') { return; }
            // The native size of the element will not be set until the DOM settles.
            var $this = this.$() || jQuery(this.get('element'));
            if (!$this.width()) {
                requestAnimationFrame(this._applySelect2.bind(this));
                return;
            }
            var options = this.get('select2Options');
            this.$().select2(options);
            this.selectionDidChange();
        },
        //Override the default DOM change handler
        _change: function (event) {
            if (this._updating) { return; }
            this._updating = true;
            var selection = this.get('selection'),
                value = this.$().val();
            if (this.get('multiple')) {
                value = value || [];
            } else {
                value = value ? [ value ] : [];
            }
            // Something in RSuite's utility form infrastructure is adding a blank.
            value = value.filter(function (val) { return !!val; });
            // Replace the existing selection with the new content.
            selection.replace(0, selection.length, value);
            this._updating = false;
        },
        // Override the default selection change handlers
        //  These should be named with leading underscores, but I needed to
        //  override the defaults in Ember.Select

        // We watch the selection array when it gets replaced.
        //  This removes the observer from the selection array
        selectionWillChange: function () {
            var selection = this.get('selection');
            selection.removeEnumerableObserver(this, this._selectionContentObserver);
        }.observesBefore('selection'),
        // This will add the observer to the selection array, then signal the View
        //  that it needs to update Select2
        selectionDidChange: function () {
            var selection = this.get('selection');
            if (Array.isArray(selection) && this.get('multiple')) {
                selection.addEnumerableObserver(this, this._selectionContentObserver);
            }
            this.selectionContentChanged();
        }.observes('selection'),
        // When an item in the selection list changes, or the selection itself changes
        //  this will apprise Select2 of the change.
        selectionContentChanged: function () {
            if (this._updating) { return; }
            this._updating = true;
            // Only attempt to get `$()` after the object is in the DOM; doing so while
            //  the View is in the hasElement state (e.g., before inBuffer, but after preRender),
            //  can cause the View to hang the browser, especially if this is also called from
            //  didInsertElement, which it is. (it's called, uselessly in this case, from
            //  Ember.Select#init, which I can't reasonably avoid)
            if (this.state === 'inDOM') {
                var contentMap,
                    valueKey = this.get('optionValuePath');
                this.$().val(this.get('selection')).trigger('change');
            }
            this._updating = false;
        }
    });
    RSuite.component.Select2[Ember.GUID_KEY + '_name'] = 'RSuite.component.Select2';
    Ember.Handlebars.registerHelper('select2', function (options) {
        options = arguments[arguments.length - 1];
        return Ember.Handlebars.helpers.view(this, "RSuite.component.Select2", options);
    });
}

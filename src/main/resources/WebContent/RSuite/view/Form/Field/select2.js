(function () {
    if (RSuite.view.Form.Field.select2) {
        return;
    }
    var select2OptionBindings = RSuite.component.Select2.proto().select2OptionBindings,
        UtilitySelect = RSuite.component.Select2.extend(select2OptionBindings.reduce(function (ext, key) {
            ext[key + 'Binding'] = 'model.propertyMap.select2.' + key;
            return ext;
        }, {
            idBinding: "fieldId",
            nameBinding: "model.name",
            readonlyBinding: "model.readOnly",
            multiple: function () {
                if (this.get("model.allowMultiple")) {
                    return true;
                }
                var type = this.get('model.formControlType') || this.get('model.dataType.formControlType'),
                    size = parseInt(this.get('model.size'));
                if (type === 'multiselect' && size === 1) {
                    return true;
                }
                return false;
            }.property('model.allowMultiple', 'model.formControlType', 'model.dataType.formControlType', 'model.size'),
            selectionBinding: "model.values",
            contentBinding: "model.options",
            optionValuePath: "content.value",
            optionLabelPath: "content.label"
        }));

    RSuite.view.Form.Field.select2 = RSuite.view.Form.Field.extend({
        classNames: [ "select2" ],
        templateName: RSuite.url("@pluginId@", "RSuite/view/Form/Field/select2.hbr"),
        disclosed: true,
        UtilitySelect: UtilitySelect,
        // Select2 handles the change events just fine; no need to use RSuite's defaults.
        change: null
    });
    RSuite.view.Form.Field.select2[Ember.GUID_KEY + '_name'] = 'RSuite.view.Form.Field.select2';
}());

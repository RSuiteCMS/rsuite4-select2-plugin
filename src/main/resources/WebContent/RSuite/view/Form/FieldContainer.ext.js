RSuite.view.Form.FieldContainer.reopen({
	formControlType: function () {
		var type = (this.get("model.formControlType") || this.get("model.dataType.formControlType") || "text");
		if (type === 'multiselect' && parseInt(this.get('model.size')) === 1) {
			return 'select2';
		}
		return type;
	}.property('model.formControlType', 'model.dataType.formControlType', 'model.size')
});

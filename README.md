# RSuite 4 support for Select2

## What is it?

This plugin provides a formControlType that allows use of [jQuery.Select2](https://select2.github.io/) in RSuite utility forms,
and as helper in templates, for RSuite 4.x.  Its deployment will not be necessary in RSuite 5, and it will avoid creation and
extension of the relevant client-side classes in RS 5.

## How do I use it?

### Build (requires Java to be installed and an internet connection to fetch the gradle jar):

    $ ./gradlew build -PpluginVersion=github-SNAPSHOT

### Deploy:

Copy build/libs/rsuite4-select2-github-SNAPSHOT.jar to your RSuite plugins directory (usually {RSUITE_HOME}/plugins).

### Consume:

#### Utility form (in rsuite-plugin.xml):

This plugin provides both a new formControlType, `select2`, that allows full control over the scalar options for
select2 via parameter properties with their names prefixed with "select2".

	<param formControlType="select2" label="Select2 tag-style multiple select" name="multi" allowMultiple="true">
		<property name="select2.placeholder" value="Select an option" />
		<optionList>
			<option label="John Smith" value="jsmith@company.com" />
			<option label="Susan Jones" value="sjones@company.com" />
			<option label="Lucas Davenport" value="ldavenport@company.com" />
			<option label="Gregory Hubble" value="ghubble@company.com" />
		</optionList>
	</param>

Additionally, it will replace the specific configuration pattern of `formControlType="multiselect"` `size="1"` with a
select2 field.  In these cases, you do not need to specify `allowMutliple="true"`, as it's implied.

	<param formControlType="multiselect" size="1" label="Select2 multiselect" name="single">
		<property name="select2.placeholder" value="Select an option" />
		<optionList>
			<option label="John Smith" value="jsmith@company.com" />
			<option label="Susan Jones" value="sjones@company.com" />
			<option label="Lucas Davenport" value="ldavenport@company.com" />
			<option label="Gregory Hubble" value="ghubble@company.com" />
		</optionList>
	</param>

#### Template:

If you deploy Handlebars templates in your plugin, select2 is made available via the `{{select2 ...}}` helper.  The
signature is similar to that for Ember.Select, except that the `value` and `selection` fields are not the objects passed
in `content`, but the strings extracted via the `optionValuePath`.  Additionally, you can set any scalar property from
a template, or bind it appropriately.  This example assumes the following View:

##### MyView.js

	var MyView = Ember.View.extend({
		template: RSuite.url("my-plugin", "path/to/MyView.hbr")
		myOptionList: [
			{ name: "One", index: 1 },
			{ name: "Two", index: 2 },
			{ name: "Three", index: 3 },
			{ name: "Four", index: 4 }
		],
		selection: Ember.A.property()
	});

##### MyView.hbr

	<h3>Please select a number:</h3>
	{{select2 contentBinding="view.myOptionList" optionLabelPath="content.index" optionValue="content.name" width="200px"}}

##### Options:

The list of supported select2 options is:

* ajax	Object	Use a custom AJAX call to populate the option model

* allowClear	Boolean	This will display an "x" that the user can click to clear the current selection. It is designed
						to be used for cases where a single selection can be made.

* closeOnSelect	Boolean	Select2 will automatically close the dropdown when an element is selected, similar to what is
						done with a normal select box. This behavior can be changed though to keep the dropdown open
						when results are selected, allowing for multiple options to be selected quickly.
* dropdownAutoWidth	undocumented feature
* dropdownParent	jQuery|DOMNode	By default, Select2 will attach the dropdown to the end of the body and will
									absolutely position it to appear below the selection container.
* escapeMarkup	Function	Method used to clear tags from passed labels
* language	String|Object	Locale to use, or Object containing relevant functions, for international Select2 support
* matcher	Function	When users filter down the results by entering search terms into the search box, Select2 uses an
						internal "matcher" to match search terms to results.
* maximumInputLength	Integer	Maximum length of search term for filtering options
* minimumInputLength	Integer	Minimum length of search term for filtering options
* maximumSelectionLength	Integer	Maximum number of selected options
* minimumResultsForSearch	Integer	When working with smaller data sets, the search box can take up more space than is
								necessary, as there are not enough results for filtering to be effective. Select2 allows
								you to only display the search box when the number of search results reaches a certain
								threshold.
* multiple	Boolean	Whether or not to use the tag multi-select style control
* placeholder	String	Select2 can display a placeholder for a single-value select that will replace an option, or be
						shown when no options are selected for multiple-value selects.
* selectOnClose	Boolean	When users close the dropdown, the last highlighted option can be automatically selected. This
						is commonly used in combination with tagging and placeholders and other situations where the
						user is required to select an option, or they need to be able to quickly select multiple
						options.
* tags	Boolean	If the tags option is passed into Select2, if a user types anything into the search box which doesn't
				already exist, it will be displayed at the top and the user will be able to select it.
* theme	String	If you have implemented a different look-and-feel for select2 by decorating classes beneath
				.select2-container--{your theme name}, this will set that class name on the container for the select2
				instance
* width	String|Number	Sets the width of the container, or sets the strategy used to find the width.  Strategies are:
	* "element"	Uses javascript to calculate the width of the source element.
	* "style"	Copies the value of the width style attribute set on the source element.
	* "resolve"	Tries to use style to determine the width, falling back to element.


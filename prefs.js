
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import GLib from "gi://GLib";

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';



function formatTargetDate(year, month, day) {

    const monthString = month < 10 ? `0${month}` : `${month}`;
    const dayString = day < 10 ? `0${day}` : `${day}`;

    return `${year}/${monthString}/${dayString}`;

}


function simpleHash() {

    const timestamp = Date.now();
    const randomNum = Math.random();

    const hash = timestamp + randomNum;

    return hash.toString().substring(7, 13);

}



export default class DayCounterPreferences extends ExtensionPreferences {

    _settings = null;
    _groupList = {};
    _group = null;



    fillPreferencesWindow(window) {

        this._settings = this.getSettings();

        const page = this._createPreferencesPage();
        this._group = this._createCounterGroup(window);

        page.add(this._group);
        page.add(this._createAppearanceGroup());
        window.add(page);

        this._refreshList();

        window._settings = this.getSettings();
    }



    _createPreferencesPage() {

        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'general-symbolic',
        });

        return page;

    }



    _createCounterGroup(window) {

        const addButton = new Gtk.Button({
            child: new Adw.ButtonContent({
                icon_name: 'list-add-symbolic',
                label: _('Add')
            })
        });

        const group = new Adw.PreferencesGroup({
            title: _('Counter'),
            header_suffix: addButton,
            description: _('Create your counter to add on panel'),
        })

        addButton.connect('clicked', () => this._addCounterDialog(window));

        return group;

    }



    _createAppearanceGroup() {
        const group = new Adw.PreferencesGroup({
            title: _("Appearance"),
            description: _('Adjust the position of Indicator in statusbar'),
        });

        const positionOptions = new Gtk.StringList();
        positionOptions.append(_("Left"));
        positionOptions.append(_("Center"));
        positionOptions.append(_("Right"));

        const indicatorPositionComboRow = new Adw.ComboRow({
            title: _("Indicator position"),
            subtitle: _("Position of the extension in the panel"),
            model: positionOptions,
            selected: this._settings.get_enum("indicator-position"),
        });

        indicatorPositionComboRow.connect("notify::selected", (comboRow) => {
            this._settings.set_enum("indicator-position", comboRow.selected);
        });
        group.add(indicatorPositionComboRow);

        const indicatorIndexActionRow = new Adw.ActionRow({
            title: _("Indicator index"),
            subtitle: _("Index of the Indicator in the panel"),
        });
        group.add(indicatorIndexActionRow);

        const indicatorIndexSpinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 10,
                stepIncrement: 1,
            }),
            numeric: true,
            marginTop: 10,
            marginBottom: 10,
        });
        indicatorIndexActionRow.add_suffix(indicatorIndexSpinButton);
        indicatorIndexActionRow.set_activatable_widget(indicatorIndexSpinButton);

        this._settings.bind("indicator-index", indicatorIndexSpinButton, "value", Gio.SettingsBindFlags.DEFAULT);

        return group;
    }



    _addCounterDialog(window) {

        const addDialog = new Adw.PreferencesDialog();

        // Create preferences pages and groups here
        const dialogPage = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'preferences-general-symbolic'
        });
        addDialog.add(dialogPage);

        const saveButton = new Gtk.Button({
            child: new Adw.ButtonContent({
                icon_name: 'emblem-ok-symbolic',     // list-add-symbolic
                label: _('Save')
            })
        });

        const dialogGroup = new Adw.PreferencesGroup({
            title: _('Create Counter'),
            header_suffix: saveButton
        });
        dialogPage.add(dialogGroup);


        // Create a input feild for Counter Name
        const counterName = new Adw.ActionRow({
            title: _("Counter Name"),
            subtitle: _("Hint: GATE Counter"),
        });
        dialogGroup.add(counterName);

        const counterNameEntryBuffer = new Gtk.EntryBuffer();
        this._settings.bind("name-string", counterNameEntryBuffer, "text", Gio.SettingsBindFlags.DEFAULT);


        const counterNameEntry = new Gtk.Entry({
            buffer: counterNameEntryBuffer,
            marginTop: 10,
            marginBottom: 10,
            widthRequest: 168,
            placeholderText: _("Counter")
        });

        counterName.add_suffix(counterNameEntry);
        counterName.set_activatable_widget(counterNameEntry);



        // Create a input feild for Counter Name
        const counterIcon = new Adw.ActionRow({
            title: _("Counter Icon"),
            subtitle: _("Hint: network-vpn-symbolic"),
        });
        dialogGroup.add(counterIcon);

        const counterIconEntryBuffer = new Gtk.EntryBuffer();
        this._settings.bind("icon-string", counterIconEntryBuffer, "text", Gio.SettingsBindFlags.DEFAULT);

        const counterIconEntry = new Gtk.Entry({
            buffer: counterIconEntryBuffer,
            marginTop: 10,
            marginBottom: 10,
            widthRequest: 168,
            placeholderText: _("network-vpn-symbolic")
        });

        counterIcon.add_suffix(counterIconEntry);
        counterIcon.set_activatable_widget(counterIconEntry);



        const counterType = new Adw.SwitchRow({
            title: _('Count Up/Down'),
            subtitle: _('Toggle Count Up or Count Down'),
        });
        dialogGroup.add(counterType);
        this._settings.bind("counter-boolean", counterType, 'active', Gio.SettingsBindFlags.DEFAULT);



        // Create a input field for date
        const targetYear = this._settings.get_int('target-year');
        const targetMonth = this._settings.get_int('target-month');
        const targetDay = this._settings.get_int('target-day');



        const targetDate = new Adw.ActionRow({
            title: _("Target Date"),
            subtitle: _("Date in YYYY/MM/DD Format"),
        });
        dialogGroup.add(targetDate);

        const targetDateButton = new Gtk.MenuButton({
            label: formatTargetDate(targetYear, targetMonth, targetDay),
            marginTop: 10,
            marginBottom: 10,
        });
        targetDate.add_suffix(targetDateButton);
        targetDate.set_activatable_widget(targetDateButton);

        const targetDatePopOver = new Gtk.Popover();
        targetDateButton.set_popover(targetDatePopOver);

        const targetCalender = new Gtk.Calendar();
        targetCalender.select_day(GLib.DateTime.new_local(targetYear, targetMonth, targetDay, 0, 0, 0));
        targetDatePopOver.set_child(targetCalender);


        for (const event of ["day-selected", "prev-year", "next-year", "prev-month", "next-month"]) {
            targetCalender.connect(event, (calendar) => this._syncInputDate(calendar, targetDateButton));
        }

        saveButton.connect('clicked', () => this._prepareList(addDialog));

        addDialog.present(window);
    }



    _prepareList(addDialog) {

        const name = this._settings.get_string('name-string');
        const icon = this._settings.get_string('icon-string');
        const count = (this._settings.get_boolean('counter-boolean')) ? 'U' : 'D';
        const year = this._settings.get_int('target-year');
        const month = this._settings.get_int('target-month');
        const day = this._settings.get_int('target-day');
        const hash = simpleHash();

        const item = (`${hash},${name},${icon},${count},${year},${month},${day}`);

        let list = this._settings.get_strv('counter-list');
        this._settings.set_strv('counter-list', [...list, item]);


        this._refreshList();

        addDialog.close();

    }



    _refreshList() {

        let list = this._settings.get_strv('counter-list');


        for (let i in list) {

            let str = list[i].split(',');

            if (!this._groupList.hasOwnProperty(str[0])) {
                this._groupList[str[0]] = {};
                this._groupList[str[0]].ButtonBox = new Gtk.Box({
                    orientation: Gtk.Orientation.HORIZONTAL,
                    halign: Gtk.Align.CENTER,
                    spacing: 5,
                    hexpand: false,
                    vexpand: false
                });
                this._groupList[str[0]].DeleteButton = new Gtk.Button({
                    icon_name: 'edit-delete-symbolic',
                    valign: Gtk.Align.CENTER,
                    css_classes: ['error'],
                    hexpand: false,
                    vexpand: false
                });


                const appIcon = new Gtk.Image({
                    icon_name: str[2],
                    pixel_size: 16
                });

                this._groupList[str[0]].Row = new Adw.ActionRow({
                    title: str[1],
                    activatable: true
                });


                this._groupList[str[0]].ButtonBox.append(this._groupList[str[0]].DeleteButton);
                this._groupList[str[0]].Row.add_prefix(appIcon);
                this._groupList[str[0]].Row.add_suffix(this._groupList[str[0]].ButtonBox);

                this._group.add(this._groupList[str[0]].Row);
            }

        }


        const copyGroupList = { ...this._groupList };
        for (let i in copyGroupList) {

            this._groupList[i].DeleteButton.connect('clicked', () => {
                this._settings.set_strv('counter-list',
                    this._settings.get_strv('counter-list').filter((id) => {  // this need to be fixed
                        return id.split(',')[0] !== i;
                    })
                );
                this._group.remove(this._groupList[i].Row);

                delete this._groupList[i];
            });

        }

    }



    _syncInputDate(calendar, targetDateButton) {
        const year = calendar.year;
        const month = calendar.month + 1;
        const day = calendar.day;

        targetDateButton.set_label(formatTargetDate(year, month, day));

        this._settings.set_int("target-year", year);
        this._settings.set_int("target-month", month);
        this._settings.set_int("target-day", day);
    }
}

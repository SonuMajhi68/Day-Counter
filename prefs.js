
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import GLib from "gi://GLib";
import GObject from 'gi://GObject';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';



function formatTargetDate(year, month, day) {
    const monthString = month < 10 ? `0${month}` : `${month}`;
    const dayString = day < 10 ? `0${day}` : `${day}`;

    return `${year}/${monthString}/${dayString}`;
}


function simpleHash() {
    const timestamp = Date.now();       // Get current timestamp in milliseconds
    const randomNum = Math.random();    // Add randomness for uniqueness

    const hash = timestamp + randomNum; // Simple hash function (replace with a more robust one if needed)

    return hash.toString().substring(7,13);
}



export default class DayCounterPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        let groupList = {};


        // Create a preferences page, with a single group
        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'general-symbolic',
        });

        let addAppsButton = new Gtk.Button({
            child: new Adw.ButtonContent({
                icon_name: 'list-add-symbolic',
                label: _('Add')
            })
        });

        const group = new Adw.PreferencesGroup({
            title: _('Counter'),
            header_suffix: addAppsButton,
            description: _('Create/Select your counter to add on tray'),
        });

        const appearanceGroup = new Adw.PreferencesGroup({
            title: _("Appearance"),
            description: _('Adjust the position of Indicator in statusbar'),
        });



        // This area for "appearanceGroup"
        const positionOptions = new Gtk.StringList();
        positionOptions.append(_("Left"));
        positionOptions.append(_("Center"));
        positionOptions.append(_("Right"));

        const indicatorPositionComboRow = new Adw.ComboRow({
            title: _("Indicator position"),
            subtitle: _("Position of the extension in the panel"),
            model: positionOptions,
            selected: settings.get_enum("indicator-position"),
        });

        indicatorPositionComboRow.connect("notify::selected", (comboRow) => {
            settings.set_enum("indicator-position", comboRow.selected);
        });
        appearanceGroup.add(indicatorPositionComboRow);

        const indicatorIndexActionRow = new Adw.ActionRow({
            title: _("Indicator index"),
            subtitle: _("Index of the Indicator in the panel"),
        });
        appearanceGroup.add(indicatorIndexActionRow);

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
      
        settings.bind("indicator-index", indicatorIndexSpinButton, "value", Gio.SettingsBindFlags.DEFAULT);


        page.add(group);
        page.add(appearanceGroup);
        window.add(page);



        // Refresh the Counter List
        const refreshList = () => {
            let list = settings.get_strv('counter-list');


            for(let i in list){
                let str = list[i].split(',');

                if(!groupList.hasOwnProperty(str[0])){
                    groupList[str[0]] = {};
                    groupList[str[0]].ButtonBox = new Gtk.Box({
                        orientation: Gtk.Orientation.HORIZONTAL,
                        halign: Gtk.Align.CENTER,
                        spacing: 5,
                        hexpand: false,
                        vexpand: false
                    });
                    groupList[str[0]].DeleteButton = new Gtk.Button({
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

                    groupList[str[0]].Row = new Adw.ActionRow({
                        title: str[1],
                        activatable: true
                    });


                    groupList[str[0]].ButtonBox.append(groupList[str[0]].DeleteButton);
                    groupList[str[0]].Row.add_prefix(appIcon);
                    groupList[str[0]].Row.add_suffix(groupList[str[0]].ButtonBox);
                    
                    group.add(groupList[str[0]].Row);
                }
            }
            
            

            const copyGroupList = {...groupList};
            for (let i in copyGroupList) {
                
                groupList[i].DeleteButton.connect('clicked', () => {
                    settings.set_strv('counter-list',
                        settings.get_strv('counter-list').filter((id) => {  // this need to be fixed
                            return id.split(',')[0] !== i;
                        })
                    );
                    group.remove(groupList[i].Row);

                    delete groupList[i];
                });
            }
        }



        refreshList();

        const addCounter = () => {

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
            settings.bind("name-string", counterNameEntryBuffer, "text", Gio.SettingsBindFlags.DEFAULT);
          
            
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
            settings.bind("icon-string", counterIconEntryBuffer, "text", Gio.SettingsBindFlags.DEFAULT);
          
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
            settings.bind("counter-boolean", counterType, 'active', Gio.SettingsBindFlags.DEFAULT);



            // Create a input field for date
            const targetYear = settings.get_int('target-year');
            const targetMonth = settings.get_int('target-month');
            const targetDay = settings.get_int('target-day');



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

            function syncSettings(calendar) {
                const year = calendar.year;
                const month = calendar.month + 1;
                const day = calendar.day;
          
                targetDateButton.set_label(formatTargetDate(year, month, day));
          
                settings.set_int("target-year", year);
                settings.set_int("target-month", month);
                settings.set_int("target-day", day);
            }

            for (const event of ["day-selected", "prev-year", "next-year", "prev-month", "next-month"]) {
                targetCalender.connect(event, (calendar) => {
                    syncSettings(calendar);
                });
            }

            saveButton.connect('clicked', () => prepList(addDialog));

            addDialog.present(window);
        };

        const prepList = (addDialog) => {
            const name = settings.get_string('name-string');
            const icon = settings.get_string('icon-string');
            const count = (settings.get_boolean('counter-boolean')) ? 'U' : 'D';
            const year = settings.get_int('target-year');
            const month = settings.get_int('target-month');
            const day = settings.get_int('target-day');
            const hash = simpleHash();
                
            const item = (`${hash},${name},${icon},${count},${year},${month},${day}`);

            let list = settings.get_strv('counter-list');
            settings.set_strv('counter-list', [...list, item]);

            list = settings.get_strv('counter-list');
            list.forEach((ele) => {
                const val = ele.split(',')
            })

            refreshList();

            addDialog.close();
        }

        addAppsButton.connect('clicked', addCounter);

        window._settings = this.getSettings();
    }
}
